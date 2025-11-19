# backend/app/api/endpoints/assets.py

from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select, SQLModel 

from app.api import deps
from app.core.security import get_current_user_payload
from app.services.data_loader import load_mock_data
from app.schemas.response import AssetResponse 
from app.db.models import UserAsset, CardTransaction

# [추가] config 모듈 임포트 (Settings 클래스가 아닌 모듈 자체)
import app.core.config as config

router = APIRouter()

class LinkAssetRequest(SQLModel):
    companies: List[str]

@router.post("/link")
def link_assets(
    request: LinkAssetRequest,
    db: Session = Depends(deps.get_db),
    payload: dict = Depends(get_current_user_payload)
):
    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid user token")

    result = load_mock_data(db, user_id, request.companies)
    return result

@router.get("/", response_model=List[AssetResponse])
def read_my_assets(
    db: Session = Depends(deps.get_db),
    payload: dict = Depends(get_current_user_payload)
):
    """
    연동된 내 카드(자산) 목록 조회
    """
    user_id = payload.get("user_id")
    
    # 1. DB 조회
    statement = select(UserAsset).where(UserAsset.user_id == user_id)
    assets = db.exec(statement).all()
    
    # 2. Response 변환 및 이미지 URL 주입
    response_list = []
    for asset in assets:
        # DB 모델 -> Pydantic 모델 변환
        asset_res = AssetResponse.model_validate(asset)
        
        # [핵심] 이미지 URL 생성 규칙: {BASE_URL}/{card_id}card.png
        # 예: http://localhost:8080/images/13card.png
        if asset.external_account_id:
             asset_res.card_image_url = f"{config.IMAGE_BASE_URL}/{asset.external_account_id}card.png"
        
        response_list.append(asset_res)
    
    return response_list

@router.delete("/{asset_id}")
def delete_asset(
    asset_id: int,
    db: Session = Depends(deps.get_db),
    payload: dict = Depends(get_current_user_payload)
):
    user_id = payload.get("user_id")
    
    asset = db.exec(
        select(UserAsset)
        .where(UserAsset.asset_id == asset_id)
        .where(UserAsset.user_id == user_id)
    ).first()
    
    if not asset:
        raise HTTPException(status_code=404, detail="자산을 찾을 수 없습니다.")

    try:
        # 관련 거래 내역 삭제
        card_id = asset.external_account_id
        
        transactions = db.exec(
            select(CardTransaction)
            .where(CardTransaction.card_id == card_id)
            .where(CardTransaction.user_id == user_id)
        ).all()
        
        for tx in transactions:
            db.delete(tx)

        # 자산 삭제
        db.delete(asset)
        
        db.commit()
        return {"message": "연동이 해제되었습니다.", "deleted_asset_id": asset_id}
        
    except Exception as e:
        db.rollback()
        print(f"Asset Delete Error: {e}")
        raise HTTPException(status_code=500, detail=f"연동 해제 중 오류 발생: {str(e)}")