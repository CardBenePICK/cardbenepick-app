import uuid
import traceback # [추가] 상세 에러 로그용
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select, SQLModel

from app.api import deps
from app.core.security import get_current_user_payload
# [수정된 부분: db insert] BenefitHistory 모델 임포트 추가
from app.db.models import UserAsset, CardTransaction, BenefitHistory

router = APIRouter()

class PaymentRequest(SQLModel):
    user_asset_id: int
    amount: int
    merchant_name: str
    installment: int = 0
    # [수정된 부분: db insert] 혜택 정보 필드 추가 (Optional)
    benefit_id: Optional[str] = None
    discount_amount: Optional[int] = 0

@router.post("/pay")
def process_payment(
    request: PaymentRequest,
    db: Session = Depends(deps.get_db),
    payload: dict = Depends(get_current_user_payload)
):
    """
    [결제 시뮬레이션] 선택한 카드로 결제를 승인합니다.
    """
    user_id = payload.get("user_id")
    
    # 1. 내 자산인지 확인
    asset = db.exec(
        select(UserAsset)
        .where(UserAsset.asset_id == request.user_asset_id)
        .where(UserAsset.user_id == user_id)
    ).first()

    if not asset:
        raise HTTPException(status_code=404, detail="유효하지 않은 카드입니다.")

    try:
        # [Fix 1] 마이크로초 제거 (MySQL DATETIME과 정밀도 일치시키기)
        # 이렇게 해야 저장 후 refresh 할 때 PK 불일치 에러가 안 남
        now = datetime.now().replace(microsecond=0)

        # 2. 거래 내역 생성
        new_tx = CardTransaction(
            transaction_id=str(uuid.uuid4()),
            user_id=user_id,
            card_id=asset.external_account_id, 
            card_company=asset.institution_name,
            transaction_date=now, # [수정] 정제된 시간 사용
            merchant_name=request.merchant_name,
            amount_krw=request.amount,
            installment_months=request.installment
        )

        db.add(new_tx)
        # [수정된 부분: db insert] 혜택 이력 생성 (benefit_id가 있고 할인 금액이 0보다 클 때)
        if request.benefit_id and request.discount_amount and request.discount_amount > 0:
            new_benefit = BenefitHistory(
                user_id=user_id,
                benefit_id=request.benefit_id,
                transaction_id=tx_id, # 위에서 생성한 tx_id 연결
                applied_amount=request.discount_amount,
                usage_date=now
            )
            db.add(new_benefit)
        
        db.commit()
        db.refresh(new_tx) 

        return {
            "message": "결제가 승인되었습니다.",
            "transaction_id": new_tx.transaction_id,
            "amount": new_tx.amount_krw,
            "merchant": new_tx.merchant_name,
            "approved_at": new_tx.transaction_date,
            # 응답에도 혜택 적용 여부 포함 가능
            "benefit_applied": bool(request.benefit_id and request.discount_amount > 0)
        }

    except Exception as e:
        db.rollback()
        # [Fix 2] 상세 에러 로그 출력 (원인 파악용)
        print("="*50)
        print("🚨 결제 처리 중 에러 발생 (Traceback)")
        print("="*50)
        traceback.print_exc() # 에러가 발생한 정확한 파일 위치와 원인을 출력
        print(f"Error Details: {e}")
        print("="*50)
        
        raise HTTPException(status_code=500, detail="결제 처리 중 오류가 발생했습니다.")