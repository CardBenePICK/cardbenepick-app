# backend/app/api/endpoints/assets.py

from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select, desc, SQLModel 

from app.api import deps
from app.core.security import get_current_user_payload
from app.services.data_loader import load_mock_data
from app.schemas.response import AssetResponse 
from app.db.models import UserAsset, CardTransaction, CardMaster, AssetType

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
    
    # 1. 내 자산 조회
    statement = select(UserAsset).where(UserAsset.user_id == user_id)
    assets = db.exec(statement).all()
    
    response_list = []
    
    # 2. 이미지 매핑을 위한 카드 마스터 정보 로드 (최적화: 필요한 카드명만 조회 가능하지만, 일단 개별 조회로 구현)
    # (더 좋은 방법: 자산 조회 시 CardMaster를 Left Join 하는 것이지만, SQLModel로 복잡해질 수 있어 파이썬 로직으로 처리)
    
    for asset in assets:
        asset_res = AssetResponse.model_validate(asset)
        
        # [핵심 로직] 이미지 URL 찾기
        # Case A: 마이데이터 연동으로 들어온 경우 -> external_account_id가 이미 '상품ID'일 수 있음 (기존 로직 호환)
        # Case B: 직접 등록한 경우 -> external_account_id는 '1234-5678'이므로 이걸로는 이미지 못 찾음.
        #          -> external_account_name('신한카드 Mr.Life')으로 CardMaster를 찾아서 ID를 구해야 함.
        
        matched_card_id = None
        
        # 1) 이름으로 먼저 찾아본다 (가장 정확)
        if asset.external_account_name:
            card_master = db.exec(
                select(CardMaster).where(CardMaster.card_name == asset.external_account_name)
            ).first()
            if card_master:
                matched_card_id = card_master.card_id
        
        # 2) 이름으로 못 찾았다면, ID 자체가 상품ID인지 확인 (기존 마이데이터 연동 건 호환)
        if not matched_card_id and asset.external_account_id:
             # 숫자로만 구성되어 있고 길이가 짧다면(예: 2, 13) 상품 ID로 간주
             if len(asset.external_account_id) < 10 and asset.external_account_id.isdigit():
                 matched_card_id = asset.external_account_id

        # 이미지 URL 생성
        if matched_card_id:
             asset_res.card_image_url = f"{config.IMAGE_BASE_URL}/{matched_card_id}card.png"
        else:
             # 기본 이미지 (Placeholder)
             asset_res.card_image_url = f"{config.IMAGE_BASE_URL}/placeholder.svg" 
        
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
    
# --- 카드 등록 ---
class CardProductResponse(SQLModel):
    card_id: str
    card_name: str
    card_company: str
    card_image_url: str

@router.get("/products", response_model=List[CardProductResponse])
def get_card_products(
    company: str,
    db: Session = Depends(deps.get_db),
    payload: dict = Depends(get_current_user_payload)
):
    """
    특정 카드사(예: '신한카드')의 모든 카드 상품 목록을 반환합니다.
    """
    # DB에서 해당 회사 카드 조회
    products = db.exec(
        select(CardMaster)
        .where(CardMaster.card_company == company)
        .order_by(CardMaster.card_name)
    ).all()
    
    response = []
    for p in products:
        # 이미지 URL 생성 규칙 적용
        image_url = f"{config.IMAGE_BASE_URL}/{p.card_id}card.png"
        
        response.append(CardProductResponse(
            card_id=p.card_id,
            card_name=p.card_name,
            card_company=p.card_company,
            card_image_url=image_url
        ))
        
    return response


# -------------------------------------------------------------------
# [수정] 카드 직접 등록 API (card_product_id 필수)
# -------------------------------------------------------------------

class CardRegisterRequest(SQLModel):
    card_number: str          
    cvc: str                  
    expiry_date: str          
    password_2digit: str      
    card_product_id: str      # [필수] 사용자가 선택한 카드 상품 ID

@router.post("/register")
def register_card(
    request: CardRegisterRequest,
    db: Session = Depends(deps.get_db),
    payload: dict = Depends(get_current_user_payload)
):
    user_id = payload.get("user_id")
    
    # 1. 카드 번호 길이 검증 (간단 체크)
    clean_number = request.card_number.replace("-", "").strip()
    if len(clean_number) != 16:
        raise HTTPException(status_code=400, detail="카드 번호는 16자리여야 합니다.")

    # 2. 선택한 카드 상품 정보 조회 (CardMaster)
    card_product = db.exec(
        select(CardMaster).where(CardMaster.card_id == request.card_product_id)
    ).first()
    
    if not card_product:
        raise HTTPException(status_code=404, detail="존재하지 않는 카드 상품입니다.")

    # 3. 중복 등록 확인
    existing_asset = db.exec(
        select(UserAsset)
        .where(UserAsset.user_id == user_id)
        .where(UserAsset.external_account_id == clean_number) # 카드번호로 중복 체크
    ).first()

    if existing_asset:
        raise HTTPException(status_code=409, detail="이미 등록된 카드입니다.")

    # 4. 자산 등록
    try:
        new_asset = UserAsset(
            user_id=user_id,
            asset_type=AssetType.card,
            institution_name=card_product.card_company,
            external_account_id=clean_number,               # 실제 카드 번호 저장
            # [중요] 이미지 역추적을 위해 '정확한 카드 상품명'을 저장
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