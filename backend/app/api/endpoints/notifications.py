from typing import List, Union, Dict, Any
import json
from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from app.api import deps
from app.core.security import get_current_user_payload
from app.db.models import Notification
from app.schemas.notification import NotificationResponse

router = APIRouter()

@router.get("/", response_model=List[NotificationResponse])
def get_my_notifications(
    db: Session = Depends(deps.get_db),
    payload: dict = Depends(get_current_user_payload)
):
    user_id = payload.get("user_id")
    
    # 최신순 정렬 (카드실적은 매일 생성되므로 자연스럽게 상단에 위치하다가 밀려남)
    notis = db.exec(
        select(Notification)
        .where(Notification.user_id == user_id)
        .where(Notification.is_active == True)
        .order_by(Notification.created_at.desc())
    ).all()

    results = []
    for noti in notis:
        try:
            parsed_content = noti.content
            # JSON 문자열이면 파싱
            if isinstance(parsed_content, str):
                parsed_content = json.loads(parsed_content)
                
            # [중요] 리스트를 풀지 않고 그대로 보냅니다!
            # 프론트엔드에서 "이게 리스트면 접기/펴기 UI를 보여줘야지" 하고 판단합니다.
            
        except Exception as e:
            print(f"Parsing Error: {e}")
            parsed_content = {}

        results.append(NotificationResponse(
            id=noti.id,
            alarm_type=noti.alarm_type,
            content=parsed_content, # 리스트([]) 또는 딕셔너리({})가 그대로 들어감
            is_read=noti.read_at is not None,
            created_at=noti.created_at,
            link_url=noti.link_url
        ))
    
    return results