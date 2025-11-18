# (1단계: DB 세션)
# engine과 get_session 함수
from sqlmodel import create_engine, Session
from app.core import settings

# 1. .env에서 읽어온 DATABASE_URL로 DB 엔진 생성
engine = create_engine(settings.DATABASE_URL)

# 2. API 엔드포인트에서 사용할 DB 세션 생성기
def get_session():
    # 'with' 구문은 FastAPI의 Depends와 함께 사용되어
    # API 요청 시작 시 세션을 열고,
    # 요청 종료 시 (정상/오류 모두) 세션을 닫아줍니다 (commit/rollback).
    with Session(engine) as session:
        yield session