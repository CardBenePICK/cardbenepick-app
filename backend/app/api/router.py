# 모든 라우터를 통합
from fastapi import APIRouter
from app.api.endpoints import auth

api_router = APIRouter()
api_router.include_router(auth.router, tags=["Authentication"])

# (나중에 /users, /cards 등 다른 엔드포인트가 생기면 여기에 추가)
# api_router.include_router(users.router, prefix="/users", tags=["Users"])