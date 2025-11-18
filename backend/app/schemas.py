# (2단계: API 입출력 모델)
# API가 phone_number를 입력받고, token을 반환하도록 타입을 정의
from pydantic import BaseModel, Field

# --- Auth ---

# POST /api/auth/send-otp 요청 본문
class SendOtpRequest(BaseModel):
    phone_number: str

# POST /api/auth/verify-otp 요청 본문
class VerifyOtpRequest(BaseModel):
    phone_number: str
    otp: str = Field(..., description="실제로는 SMS로 전송된 OTP. 테스트시 '123456' 고정")

# POST /api/auth/register 요청 본문
class RegisterRequest(BaseModel):
    user_name: str
    # (약관 동의 등 추가 정보...)

# 인증 응답 (로그인/회원가입 공통)
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    is_new_user: bool