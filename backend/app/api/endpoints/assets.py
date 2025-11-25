from typing import List, Optional, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select, SQLModel 

from app.api import deps
from app.core.security import get_current_user_payload
from app.services.data_loader import load_mock_data
from app.schemas.response import AssetResponse 
# [필수] 모델 임포트
from app.db.models import UserAsset, CardTransaction, CardMaster, AssetType, CardBenefit
import app.core.config as config
import urllib.parse # [추가] URL 디코딩용

router = APIRouter()

# -------------------------------------------------------------------
# 1. 카드 상품 목록 조회
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
    products = db.exec(
        select(CardMaster)
        .where(CardMaster.card_company == company)
        .order_by(CardMaster.card_name)
    ).all()
    
    response = []
    for p in products:
        filename = getattr(p, "image_filename", f"{p.card_id}card.png")
        if not filename:
            filename = f"{p.card_id}card.png"
        image_url = f"{config.IMAGE_BASE_URL}/{filename}"
        
        response.append(CardProductResponse(
            card_id=p.card_id,
            card_name=p.card_name,
            card_company=p.card_company,
            card_image_url=image_url
        ))
    return response

# -------------------------------------------------------------------
# [핵심 수정] 카드 상세 정보 조회 (ID 또는 이름으로 검색)
# -------------------------------------------------------------------
class CardDetailResponse(SQLModel):
    card_id: str
    card_name: str
    card_company: str
    card_image_url: str
    benefits: List[dict]

@router.get("/products/{card_identifier}", response_model=CardDetailResponse)
def get_card_detail(
    card_identifier: str,
    db: Session = Depends(deps.get_db)
):
    # 1. URL 디코딩 (예: "%EC%8B%A0%ED..." -> "신한카드 Mr.Life")
    decoded_id = urllib.parse.unquote(card_identifier)

    # 2. [우선순위 1] ID로 검색
    card = db.exec(select(CardMaster).where(CardMaster.card_id == decoded_id)).first()
    
    # 3. [우선순위 2] 없으면 이름으로 검색 (404 에러 해결!)
    if not card:
        card = db.exec(select(CardMaster).where(CardMaster.card_name == decoded_id)).first()

    if not card:
        raise HTTPException(status_code=404, detail=f"Card not found: {decoded_id}")

    # 4. 혜택 정보 조회
    benefits = db.exec(select(CardBenefit).where(CardBenefit.card_id == card.card_id)).all()
    
    # 5. 이미지 URL 처리
    filename = getattr(card, "image_filename", f"{card.card_id}card.png")
    if not filename: 
        filename = f"{card.card_id}card.png"
    image_url = f"{config.IMAGE_BASE_URL}/{filename}"

    # 6. 혜택 데이터 가공
    benefit_list = []
    for b in benefits:
        benefit_list.append({
            "benefit_id": b.benefit_id,
            "category": b.category,
            "summary": b.summary,
            "detail": b.json_rawdata
        })

    return CardDetailResponse(
        card_id=card.card_id,
        card_name=card.card_name,
        card_company=card.card_company,
        card_image_url=image_url,
        benefits=benefit_list
    )

# -------------------------------------------------------------------
# 2. 카드 직접 등록
# -------------------------------------------------------------------
class CardRegisterRequest(SQLModel):
    card_number: str          
    cvc: str                  
    expiry_date: str          
    password_2digit: str      
    card_product_id: str

@router.post("/register")
def register_card(
    request: CardRegisterRequest,
    db: Session = Depends(deps.get_db),
    payload: dict = Depends(get_current_user_payload)
):
    user_id = payload.get("user_id")
    
    clean_number = request.card_number.replace("-", "").strip()
    if len(clean_number) != 16:
        raise HTTPException(status_code=400, detail="카드 번호는 16자리여야 합니다.")

    card_product = db.exec(
        select(CardMaster).where(CardMaster.card_id == request.card_product_id)
    ).first()
    
    if not card_product:
        raise HTTPException(status_code=404, detail="존재하지 않는 카드 상품입니다.")

    existing_asset = db.exec(
        select(UserAsset)
        .where(UserAsset.user_id == user_id)
        .where(UserAsset.external_account_id == request.card_product_id)
    ).first()

    if existing_asset:
        raise HTTPException(status_code=409, detail="이미 등록된 카드 상품입니다.")

    try:
        new_asset = UserAsset(
            user_id=user_id,
            asset_type=AssetType.card,
            institution_name=card_product.card_company,
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
# 3. 내 자산 조회
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