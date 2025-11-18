import enum
from datetime import datetime, date
from typing import Optional, List, Any
from decimal import Decimal
from sqlmodel import Field, SQLModel, create_engine, Session, select, Relationship
from sqlalchemy import Column, JSON, String, DateTime, Enum, DECIMAL, BINARY, VARBINARY, Text

# --- Enum 정의 (SQL의 ENUM에 대응) ---

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

# --- 테이블 모델 정의 ---

# 1. user_master
class UserMaster(SQLModel, table=True):
    __tablename__ = "user_master"

    user_id: Optional[int] = Field(default=None, primary_key=True)

    uuid: bytes = Field(sa_column=Column(BINARY(16), unique=True))
    
    user_name: str = Field(max_length=50)
    birth_date: date
    gender: Gender = Field(sa_column=Column(Enum(Gender)))
    telecom: str = Field(max_length=20)
    
    ci_hash: bytes = Field(sa_column=Column(VARBINARY(32), unique=True))
    di_hash: bytes = Field(sa_column=Column(VARBINARY(32), unique=True))
    
    phone_number: str = Field(max_length=20, unique=True, index=True) # (이건 sa_column이 없으므로 OK)
    
    status: UserStatus = Field(sa_column=Column(Enum(UserStatus), default=UserStatus.active, index=True))
    
    last_login_at: Optional[datetime] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow, sa_column=Column(DateTime, default=datetime.utcnow))
    updated_at: datetime = Field(default_factory=datetime.utcnow, sa_column=Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow))
    
    # 관계 설정 (User가 여러 Asset을 가짐)
    assets: List["UserAssets"] = Relationship(back_populates="user")

# 2. user_assets
class UserAssets(SQLModel, table=True):
    __tablename__ = "user_assets"

    asset_id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user_master.user_id", index=True)
    

    asset_type: AssetType = Field(sa_column=Column(Enum(AssetType), index=True))
    
    institution_name: str = Field(max_length=100)
    external_account_id: str = Field(max_length=100, index=True)
    external_account_name: Optional[str] = Field(default=None, max_length=200)
    currency: str = Field(default="KRW", max_length=3)
    balance: Decimal = Field(default=0, sa_column=Column(DECIMAL(18, 2)))
    updated_at: datetime = Field(default_factory=datetime.utcnow, sa_column=Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow))
    created_at: datetime = Field(default_factory=datetime.utcnow, sa_column=Column(DateTime, default=datetime.utcnow))

    # 관계 설정 (Asset은 하나의 User에 속함)
    user: UserMaster = Relationship(back_populates="assets")

# 3. card_master
class CardMaster(SQLModel, table=True):
    __tablename__ = "card_master"
    
    card_id: str = Field(primary_key=True, max_length=64)
    card_name: str = Field(max_length=128)
    card_company: str = Field(max_length=64, index=True)
    card_rank: Optional[int] = Field(default=None)
    card_type: int # 0=신용, 1=체크
    domestic_year_cost: Optional[int] = Field(default=None)
    abroad_year_cost: Optional[int] = Field(default=None)
    previous_month_performance: Optional[int] = Field(default=None)
    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow)
    json_notice: Optional[dict] = Field(default=None, sa_column=Column(JSON))