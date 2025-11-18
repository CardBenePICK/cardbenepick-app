# init_db (테이블 자동 생성)와 api_router (API 엔드포인트)를 포함
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.session import init_db
from app.api.router import api_router
# models.py를 import해야 init_db()가 테이블을 인식합니다.
from app.db import models 

# (1) DB 및 테이블 생성 (개발용)
# 서버가 시작될 때 SQLModel이 DB에 테이블이 없으면 생성하도록 합니다.
@app.on_event("startup")
def on_startup():
    init_db()

# (2) FastAPI 앱 생성
app = FastAPI(
    title="CardBenePICK API",
    version="0.1.0"
)

# (3) CORS 설정
origins = [
    "http://localhost:8080", # 프론트엔드 포트 (npm run dev)
    "http://localhost:5173", # (Vite 기본 포트, 예비용)
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, # ["*"] 대신 명시적 허용
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# (4) API 라우터 포함
# 모든 API는 /api 접두사(prefix)를 갖게 됩니다. (예: /api/auth/send-otp)
app.include_router(api_router, prefix="/api")

# (5) 루트 경로 (Index.tsx 연동 테스트용)
@app.get("/")
def read_root():
    return {"message": "Welcome to CardBenePICK API"}