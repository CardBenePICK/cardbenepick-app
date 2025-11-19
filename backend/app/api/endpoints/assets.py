# backend/app/api/endpoints/assets.py

from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, SQLModel

from app.api import deps
from app.core.security import get_current_user_payload
from app.services.data_loader import load_mock_data

router = APIRouter()

# 요청 바디 모델 (Pydantic)
class LinkAssetRequest(SQLModel):
    companies: List[str]  # 예: ["shinhan", "samsung"]

@router.post("/link")
def link_assets(
    request: LinkAssetRequest,
    db: Session = Depends(deps.get_db),
    payload: dict = Depends(get_current_user_payload)
):
    """
    [마이데이터 연동] 선택한 카드사의 거래 내역을 Mock 데이터에서 가져와 적재합니다.
    """
    # 1. 토큰에서 user_id 추출 (auth.py 로그인 로직에서 user_id를 넣었음)
    user_id = payload.get("user_id")
    
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid user token")

    # 2. 서비스 로직 호출 (CSV 로드 -> DB 적재)
    # 예외 발생 시 서비스 내부에서 HTTPException을 던지므로 별도 처리 불필요
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
    assets = db.exec(
        select(UserAsset).where(UserAsset.user_id == user_id)
    ).all()
    return assets

@router.delete("/{asset_id}")
def delete_asset(
    asset_id: int,
    db: Session = Depends(deps.get_db),
    payload: dict = Depends(get_current_user_payload)
):
    """
    특정 자산(카드) 연동 해제 및 관련 거래 내역 삭제
    """
    user_id = payload.get("user_id")
    
    # 1. 본인의 자산인지 확인
    asset = db.exec(
        select(UserAsset)
        .where(UserAsset.asset_id == asset_id)
        .where(UserAsset.user_id == user_id)
    ).first()
    
    if not asset:
        raise HTTPException(status_code=404, detail="자산을 찾을 수 없습니다.")

    try:
        # 2. 관련 거래 내역 삭제 (Cascade)
        # UserAsset의 external_account_id가 CardTransaction의 card_id와 매핑됨
        card_id = asset.external_account_id
        
        # 주의: 다른 유저가 같은 카드를 가질 일은 없지만(카드번호니까), user_id 조건도 추가하여 안전하게 삭제
        transactions_to_delete = db.exec(
            select(CardTransaction)
            .where(CardTransaction.card_id == card_id)
            .where(CardTransaction.user_id == user_id)
        ).all()
        
        for tx in transactions_to_delete:
            db.delete(tx)

        # 3. 자산 삭제
        db.delete(asset)
        
        db.commit()
        return {"message": "연동이 해제되었습니다.", "deleted_asset_id": asset_id}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"연동 해제 중 오류 발생: {str(e)}")