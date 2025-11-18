# (3단계: FastAPI 실행)
# api 실행
from fastapi import FastAPI
from app.api import auth_router # 2단계에서 만든 라우터 import

# FastAPI 앱 생성
app = FastAPI(
    title="CardBenePICK API",
    version="0.1.0"
)

# CORS 설정 (React 프론트(예: localhost:5173)에서 오는 요청 허용)
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # 개발 중에는 모든 호스트 허용
    # allow_origins=["http://localhost:5173"], # 실제 배포 시 프론트 주소만
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API 라우터 포함
app.include_router(auth_router)

@app.get("/")
def read_root():
    return {"message": "Welcome to CardBenePICK API"}