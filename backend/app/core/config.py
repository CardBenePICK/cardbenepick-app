import os
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv()

DATABASE_URL: str = os.getenv("DATABASE_URL")
SECRET_KEY: str = os.getenv("SECRET_KEY")
ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
# 60분 * 24시간 * 7일 = 7일
ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60 * 24 * 7)) 
# OTP 인증 후 회원가입을 완료하기 위한 임시 토큰 (10분)
REGISTRATION_TOKEN_EXPIRE_MINUTES: int = 10

# [추가] 카드 이미지 기본 경로
# frontend/vite.config.ts에 설정된 포트(8080)를 반영
IMAGE_BASE_URL: str = "http://localhost:8080/images"