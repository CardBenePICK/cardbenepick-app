# (1단계: 설정)
# .env 파일에서 DATABASE_URL과 SECRET_KEY를 읽어오는 설정 파일
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str = "YOUR_SUPER_SECRET_KEY_HERE" # .env에서 읽어옴
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 1일

    class Config:
        env_file = ".env" # .env 파일을 명시적으로 로드

# 전역에서 사용할 설정 객체
settings = Settings()