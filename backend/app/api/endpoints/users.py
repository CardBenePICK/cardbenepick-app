# backend/app/api/endpoints/users.py

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.api import deps
from app.core.security import get_current_user_payload
from app.db.models import UserMaster, UserAsset, CardTransaction
from app.schemas.response import UserResponse
from typing import Any, List, Optional
from pydantic import BaseModel
import httpx # httpx 추가 (pip install httpx 필요)

router = APIRouter()



class UserPreferenceCreate(BaseModel):
    user_id: Optional[str] = None
    cluster_id: int
    preferred_categories: List[str]
    timestamp: str

# 에이전트 서버 주소 설정
AGENT_SERVER_URL = "http://localhost:8090/api/ml/preferences"

@router.get("/me", response_model=UserResponse)
def read_user_me(
    db: Session = Depends(deps.get_db),
    payload: dict = Depends(get_current_user_payload)
):
    """
    내 정보 조회
    """
    user_id = payload.get("user_id")
    user = db.get(UserMaster, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.delete("/me")
def delete_user_me(
    db: Session = Depends(deps.get_db),
    payload: dict = Depends(get_current_user_payload)
):
    """
    회원 탈퇴: 유저 정보뿐만 아니라 연동된 자산, 거래 내역을 모두 삭제합니다.
    """
    user_id = payload.get("user_id")
    user = db.get(UserMaster, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    try:
        # [수정된 부분] 안전한 삭제 방식 (객체 조회 -> db.delete)
        # 데이터가 없으면 빈 리스트([])가 반환되어 for문이 실행되지 않으므로 에러가 나지 않습니다.
        
        # 1. 거래 내역 삭제
        transactions = db.exec(select(CardTransaction).where(CardTransaction.user_id == user_id)).all()
        for transaction in transactions:
            db.delete(transaction)
            
        # 2. 자산(연동 정보) 삭제
        assets = db.exec(select(UserAsset).where(UserAsset.user_id == user_id)).all()
        for asset in assets:
            db.delete(asset)
            
        # 3. 유저 마스터 삭제
        db.delete(user)
        
        db.commit()
        return {"message": "회원 탈퇴가 완료되었습니다."}
        
    except Exception as e:
        db.rollback()
        print(f"Withdrawal Error: {e}")
        raise HTTPException(status_code=500, detail=f"탈퇴 처리 중 오류 발생: {str(e)}")
    
async def send_to_agent(payload: dict):
    async with httpx.AsyncClient() as client:
        try:
            print(f"🚀 Sending to Agent: {AGENT_SERVER_URL}")
            resp = await client.post(AGENT_SERVER_URL, json=payload, timeout=10.0)
            if resp.status_code == 200:
                print(f"✅ Agent Success: {resp.json()}")
            else:
                print(f"⚠️ Agent Failed: {resp.text}")
        except Exception as e:
            print(f"❌ Connection Error: {e}")

@router.post("/preferences")
async def receive_user_preferences(
    preference_data: UserPreferenceCreate,
    background_tasks: BackgroundTasks # 백그라운드 작업 추가
) -> Any:
    """
    프론트엔드 -> 백엔드 -> 에이전트 서버로 데이터 전달
    """
    print(f"===== [Backend] 데이터 수신 =====")
    print(f"Cluster: {preference_data.cluster_id}")
    
    # 1. 에이전트 서버로 전송 (백그라운드 실행으로 사용자 대기 시간 단축)
    # Pydantic 모델을 dict로 변환하여 전송
    background_tasks.add_task(send_to_agent, preference_data.dict())
    
    # 2. (선택사항) 필요하다면 여기서 메인 DB(PostgreSQL)에 저장하는 로직 추가
    # crud.user_preference.create(db, preference_data) 

    return {
        "status": "success", 
        "message": "데이터가 접수되어 추천 엔진으로 전송되었습니다.",
        "received_data": preference_data
    }
    # @router.post("/preferences")
    # async def receive_user_preferences(preference_data: UserPreferenceCreate) -> Any:
    #     """
    #     프론트엔드로부터 유저의 선호 정보(클러스터 + 카테고리)를 수신합니다.
    #     """
    #     print(f"===== [Backend] 통합 데이터 수신 =====")
    #     print(f"User ID: {preference_data.user_id}")
    #     print(f"Cluster: {preference_data.cluster_id}")
    #     print(f"Categories: {preference_data.preferred_categories}")
    #     print(f"Timestamp: {preference_data.timestamp}")
    #     print("======================================")
        
    #     # TODO: 여기서 DB에 저장하는 로직을 추가하면 됩니다.
        
    #     return {
    #         "status": "success", 
    #         "message": "사용자 취향 데이터가 성공적으로 저장되었습니다.",
    #         "received_data": preference_data
    #     }