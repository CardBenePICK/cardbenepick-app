# (2단계: 인증 API 구현)
# 가짜 인증, user_master 랜덤 값
# telecom, birth_date, gender 랜덤 값(실제 휴대폰 인증 불가)
import random
import uuid
from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlmodel import Session, select
from jose import jwt
from typing import Dict

from app.db import get_session
from app.models import UserMaster, Gender, UserStatus
from app.schemas import SendOtpRequest, VerifyOtpRequest, RegisterRequest, TokenResponse
from app.core import settings

# API 라우터 설정
auth_router = APIRouter(prefix="/api/auth")

# --- 유틸리티 함수 ---
def create_access_token(data: dict) -> str:
    """JWT 토큰 생성"""
    to_encode = data.copy()
    expire = datetime.utcnow() + datetime.timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

# --- API 엔드포인트 ---

@auth_router.post("/send-otp")
async def send_otp(request: SendOtpRequest):
    """(가짜) OTP 발송 API"""
    # 실제로는 SMS 발송 로직 (e.g. Twilio, NHN)
    # 지금은 목업이므로, "123456"을 발송했다고 가정하고 콘솔에 출력
    print(f"[MOCK SMS] {request.phone_number}로 OTP '123456' 발송됨")
    return {"message": "OTP sent (mock)"}


@auth_router.post("/verify-otp", response_model=TokenResponse)
async def verify_otp(
    request: VerifyOtpRequest, 
    session: Session = Depends(get_session)
):
    """(가짜) OTP 검증 및 로그인/임시 토큰 발급 API"""
    
    # 1. (가짜) OTP 검증
    if request.otp != "123456":
        raise HTTPException(status_code=400, detail="잘못된 OTP입니다.")
        
    # 2. DB에서 사용자 조회
    statement = select(UserMaster).where(UserMaster.phone_number == request.phone_number)
    user = session.exec(statement).first()

    if user:
        # --- 3a. 기존 유저 (로그인) ---
        user.last_login_at = datetime.utcnow()
        session.add(user)
        session.commit()
        
        token_data = {"sub": user.phone_number, "user_id": user.user_id}
        access_token = create_access_token(token_data)
        
        return TokenResponse(
            access_token=access_token, 
            is_new_user=False
        )
    else:
        # --- 3b. 신규 유저 (임시 토큰 발급) ---
        # 이 토큰은 '/api/auth/register' 엔드포인트만 호출할 수 있어야 함 (지금은 편의상 동일하게 발급)
        
        token_data = {"sub": request.phone_number, "user_id": None} # 'sub'에 폰번호 저장
        temp_token = create_access_token(token_data)
        
        return TokenResponse(
            access_token=temp_token, 
            is_new_user=True
        )

@auth_router.post("/register", response_model=TokenResponse)
async def register_user(
    request: RegisterRequest,
    # (추후: 임시 토큰 검증 로직 필요)
    # current_user: Dict = Depends(get_current_user_from_temp_token),
    session: Session = Depends(get_session),
    # 임시로 body에서 폰번호를 받지만, 실제로는 위 'current_user'에서 토큰을 파싱해 가져와야 함
    phone_number_from_token: str = Body(..., description="임시: verify-otp에서 받은 토큰의 폰번호")
):
    """(가짜) 회원가입 API - user_master에 랜덤 값 저장"""

    # (추후: phone_number = current_user.get("sub"))
    phone_number = phone_number_from_token

    # 1. 이미 가입했는지 최종 확인
    statement = select(UserMaster).where(UserMaster.phone_number == phone_number)
    if session.exec(statement).first():
        raise HTTPException(status_code=400, detail="이미 가입된 유저입니다.")

    # 2. [핵심] user_master에 랜덤 데이터로 신규 유저 생성
    try:
        new_user = UserMaster(
            user_name=request.user_name,
            phone_number=phone_number,
            
            # --- 요청하신 Mock 데이터 ---
            birth_date=date(1990, 1, 1),
            telecom=random.choice(['SKT', 'KT', 'LGU+']),
            gender=random.choice([Gender.M, Gender.F]),
            
            # --- 필수 Mock 데이터 (해시/UUID) ---
            # 실제로는 본인인증(CI/DI) 및 UUID 생성기 사용
            uuid=uuid.uuid4().bytes, 
            ci_hash=uuid.uuid4().bytes[0:16], # 임시 해시 (길이 다름)
            di_hash=uuid.uuid4().bytes[16:32], # 임시 해시 (길이 다름)
            
            status=UserStatus.active,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        session.add(new_user)
        session.commit()
        session.refresh(new_user) # DB에서 생성된 user_id 등을 다시 읽어옴

    except Exception as e:
        session.rollback()
        print(f"DB 오류: {e}")
        raise HTTPException(status_code=500, detail="유저 생성 중 오류 발생")

    # 3. 정식 로그인 JWT 토큰 발급
    token_data = {"sub": new_user.phone_number, "user_id": new_user.user_id}
    access_token = create_access_token(token_data)
    
    return TokenResponse(
        access_token=access_token, 
        is_new_user=True # 방금 가입했으므로 true
    )