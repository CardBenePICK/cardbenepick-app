import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select, SQLModel

from app.api import deps
from app.core.security import get_current_user_payload
from app.db.models import UserAsset, CardTransaction

router = APIRouter()

# 결제 요청 데이터 모델
class PaymentRequest(SQLModel):
    user_asset_id: int    # 결제할 카드(자산)의 ID
    amount: int           # 결제 금액
    merchant_name: str    # 가맹점명 (예: 스타벅스)
    installment: int = 0  # 할부 개월 수 (기본 0: 일시불)

@router.post("/pay")
def process_payment(
    request: PaymentRequest,
    db: Session = Depends(deps.get_db),
    payload: dict = Depends(get_current_user_payload)
):
    """
    [결제 시뮬레이션] 선택한 카드로 결제를 승인하고 거래 내역을 생성합니다.
    """
    user_id = payload.get("user_id")

    # 1. 사용자의 유효한 자산(카드)인지 확인
    asset = db.exec(
        select(UserAsset)
        .where(UserAsset.asset_id == request.user_asset_id)
        .where(UserAsset.user_id == user_id)
    ).first()

    if not asset:
        raise HTTPException(status_code=404, detail="유효하지 않은 카드입니다.")

    try:
        # 2. 거래 내역 생성 (CardTransaction)
        # transaction_id는 고유한 UUID로 생성
        new_tx = CardTransaction(
            transaction_id=str(uuid.uuid4()),
            user_id=user_id,
            card_id=asset.external_account_id,   # 카드 번호 연결
            card_company=asset.institution_name, # 카드사명
            transaction_date=datetime.now(),
            merchant_name=request.merchant_name,
            amount_krw=request.amount,
            installment_months=request.installment
        )

        db.add(new_tx)
        db.commit()
        db.refresh(new_tx)

        return {
            "message": "결제가 승인되었습니다.",
            "transaction_id": new_tx.transaction_id,
            "amount": new_tx.amount_krw,
            "merchant": new_tx.merchant_name,
            "approved_at": new_tx.transaction_date
        }

    except Exception as e:
        db.rollback()
        print(f"Payment Error: {e}")
        raise HTTPException(status_code=500, detail="결제 처리 중 오류가 발생했습니다.")