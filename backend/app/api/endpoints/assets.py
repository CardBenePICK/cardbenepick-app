# backend/app/api/endpoints/assets.py

from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select, SQLModel 

from app.api import deps
from app.core.security import get_current_user_payload
from app.services.data_loader import load_mock_data
from app.schemas.response import AssetResponse 
from app.db.models import UserAsset, CardTransaction, CardMaster, AssetType
import app.core.config as config

router = APIRouter()

# -------------------------------------------------------------------
# 1. 카드 상품 목록 조회 (공개 API)
# -------------------------------------------------------------------
class CardProductResponse(SQLModel):
    card_id: str
    card_name: str
    card_company: str
    card_image_url: str

@router.get("/products", response_model=List[CardProductResponse])
def get_card_products(
    company: str,
    db: Session = Depends(deps.get_db),
):
    """
    특정 카드사(예: '신한카드')의 모든 카드 상품 목록을 반환합니다.
    """
    products = db.exec(
        select(CardMaster)
        .where(CardMaster.card_company == company)
        .order_by(CardMaster.card_name)
    ).all()
    
    response = []
    for p in products:
        image_url = f"{config.IMAGE_BASE_URL}/{p.card_id}card.png"
        response.append(CardProductResponse(
            card_id=p.card_id,
            card_name=p.card_name,
            card_company=p.card_company,
            card_image_url=image_url
        ))
    return response

# -------------------------------------------------------------------
# 2. 카드 직접 등록 (수정됨)
# -------------------------------------------------------------------
class CardRegisterRequest(SQLModel):
    card_number: str          
    cvc: str                  
    expiry_date: str          
    password_2digit: str      
    card_product_id: str      # 사용자가 선택한 카드 상품 ID (예: '13')

@router.post("/register")
def register_card(
    request: CardRegisterRequest,
    db: Session = Depends(deps.get_db),
    payload: dict = Depends(get_current_user_payload)
):
    user_id = payload.get("user_id")
    
    # 1. 유효성 검사 (형식만 체크)
    clean_number = request.card_number.replace("-", "").strip()
    if len(clean_number) != 16:
        raise HTTPException(status_code=400, detail="카드 번호는 16자리여야 합니다.")

    # 2. 카드 상품 정보 조회
    card_product = db.exec(
        select(CardMaster).where(CardMaster.card_id == request.card_product_id)
    ).first()
    
    if not card_product:
        raise HTTPException(status_code=404, detail="존재하지 않는 카드 상품입니다.")

    # [수정] 3. 중복 등록 확인 (이제 card_product_id로 체크)
    # 사용자가 동일한 상품(예: 신한 Mr.Life)을 중복 등록하는 것을 방지
    existing_asset = db.exec(
        select(UserAsset)
        .where(UserAsset.user_id == user_id)
        .where(UserAsset.external_account_id == request.card_product_id) # 카드ID로 비교
    ).first()

    if existing_asset:
        raise HTTPException(status_code=409, detail="이미 등록된 카드 상품입니다.")

    try:
        # [수정] 4. 자산 등록 (external_account_id = card_id)
        new_asset = UserAsset(
            user_id=user_id,
            asset_type=AssetType.card,
            institution_name=card_product.card_company,
            # 요청하신 대로 '선택한 카드의 card_id'를 저장합니다.
            external_account_id=card_product.card_id,       
            external_account_name=card_product.card_name,   
            balance=0,
        )
        
        db.add(new_asset)
        db.commit()
        db.refresh(new_asset)
        
        return {"message": "카드가 성공적으로 등록되었습니다.", "asset_id": new_asset.asset_id}

    except Exception as e:
        db.rollback()
        print(f"Card Register Error: {e}")
        raise HTTPException(status_code=500, detail="카드 등록 중 오류가 발생했습니다.")


# -------------------------------------------------------------------
# 3. 내 자산(카드) 조회 (수정됨)
# -------------------------------------------------------------------
@router.get("/", response_model=List[AssetResponse])
def read_my_assets(
    db: Session = Depends(deps.get_db),
    payload: dict = Depends(get_current_user_payload)
):
    user_id = payload.get("user_id")
    
    assets = db.exec(
        select(UserAsset).where(UserAsset.user_id == user_id)
    ).all()
    
    response_list = []
    
    for asset in assets:
        asset_res = AssetResponse.model_validate(asset)
        
        # [수정] 이미지 URL 생성 로직 단순화
        # 이제 external_account_id가 곧 card_id이므로 바로 URL 생성 가능
        if asset.external_account_id:
             asset_res.card_image_url = f"{config.IMAGE_BASE_URL}/{asset.external_account_id}card.png"
        else:
             asset_res.card_image_url = f"{config.IMAGE_BASE_URL}/placeholder.svg"
        
        response_list.append(asset_res)
    
    return response_list


# -------------------------------------------------------------------
# 4. 기타 기능 (연동, 삭제)
# -------------------------------------------------------------------
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
        card_id = asset.external_account_id
        
        transactions = db.exec(
            select(CardTransaction)
            .where(CardTransaction.card_id == card_id)
            .where(CardTransaction.user_id == user_id)
        ).all()
        
        for tx in transactions:
            db.delete(tx)

        db.delete(asset)
        
        db.commit()
        return {"message": "연동이 해제되었습니다.", "deleted_asset_id": asset_id}
        
    except Exception as e:
        db.rollback()
        print(f"Asset Delete Error: {e}")
        raise HTTPException(status_code=500, detail=f"연동 해제 중 오류 발생: {str(e)}")