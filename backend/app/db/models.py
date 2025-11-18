# DB 테이블(`user_master`, `user_asset`) 정의
import enum
from typing import Optional
from sqlmodel import SQLModel, Field, Column, Enum as SQLAEnum
from datetime import datetime, date

# --- Enums (DB 스키마와 동일하게) ---
class Gender(str, enum.Enum):
    M = "M"
    F = "F"

class UserStatus(str, enum.Enum):
    active = "active"
    blocked = "blocked"
    deleted = "deleted"

class AssetType(str, enum.Enum):
    card = "card"
    account = "account"
    loan = "loan"
    investment = "investment"
    cash = "cash"
    etc = "etc"

# --- Tables ---

class UserMaster(SQLModel, table=True):
    __tablename__ = "user_master"

    user_id: Optional[int] = Field(default=None, primary_key=True)
    phone_number: str = Field(max_length=20, unique=True, index=True) # 필수
    user_name: Optional[str] = Field(max_length=50, default=None) # 회원가입 시 입력

    # [수정됨] 회원가입 시 받지 않는 정보는 모두 Optional(nullable=True)로 변경
    uuid: Optional[bytes] = Field(default=None, unique=True)
    ci_hash: Optional[bytes] = Field(default=None, unique=True)
    di_hash: Optional[bytes] = Field(default=None, unique=True)
    birth_date: Optional[date] = Field(default=None)
    gender: Optional[Gender] = Field(default=None, sa_column=Column(SQLAEnum(Gender)))
    telecom: Optional[str] = Field(default=None, max_length=20)
    
    status: UserStatus = Field(default=UserStatus.active, sa_column=Column(SQLAEnum(UserStatus), index=True))
    last_login_at: Optional[datetime] = Field(default=None)
    
    # default_factory를 사용하면 Python 코드 실행 시점이 아닌, DB에 삽입될 때 기본값 생성
    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: Optional[datetime] = Field(default_factory=datetime.utcnow, nullable=False, sa_column_kwargs={"onupdate": datetime.utcnow})

class UserAsset(SQLModel, table=True):
    __tablename__ = "user_asset"

    asset_id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user_master.user_id", index=True)
    asset_type: AssetType = Field(sa_column=Column(SQLAEnum(AssetType), index=True))
    institution_name: str = Field(max_length=100)
    external_account_id: str = Field(max_length=100, index=True)
    external_account_name: Optional[str] = Field(max_length=200, default=None)
    currency: str = Field(default="KRW", max_length=3)
    balance: float = Field(default=0.0) # DECIMAL은 float으로 매핑
    
    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: Optional[datetime] = Field(default_factory=datetime.utcnow, nullable=False, sa_column_kwargs={"onupdate": datetime.utcnow})