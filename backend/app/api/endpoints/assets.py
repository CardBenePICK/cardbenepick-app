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