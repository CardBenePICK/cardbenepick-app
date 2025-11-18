# DB 테이블(`user_master`, `user_assets`) 정의
import enum
from typing import Optional
from decimal import Decimal
from datetime import datetime, date
from sqlmodel import SQLModel, Field, Column, Enum as SQLAEnum, text

# 3. SQLAlchemy에서 필요한 타입들 임포트
from sqlalchemy import CHAR, BINARY, VARBINARY, ForeignKey, DateTime
from sqlalchemy.dialects.mysql import BIGINT, DECIMAL as SQLDecimal
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

    # [FIXED] primary_key를 Field()가 아닌 Column()으로 이동
    user_id: Optional[int] = Field(
        default=None,
        sa_column=Column(BIGINT(unsigned=True), primary_key=True, autoincrement=True)
    )
    
    # [FIXED] unique를 Field()가 아닌 Column()으로 이동
    uuid: Optional[bytes] = Field(default=None, sa_column=Column(BINARY(16), unique=True))
    user_name: Optional[str] = Field(max_length=50, default=None)
    birth_date: Optional[date] = Field(default=None)
    gender: Optional[Gender] = Field(default=None, sa_column=Column(SQLAEnum(Gender)))
    telecom: Optional[str] = Field(default=None, max_length=20)
    
    # [FIXED] unique를 Field()가 아닌 Column()으로 이동
    ci_hash: Optional[bytes] = Field(default=None, sa_column=Column(VARBINARY(32), unique=True))
    di_hash: Optional[bytes] = Field(default=None, sa_column=Column(VARBINARY(32), unique=True))
    
    # [OK] sa_column이 없으므로 Field()에 unique, index 설정 가능
    phone_number: str = Field(max_length=20, unique=True, index=True, nullable=False)

    status: UserStatus = Field(
        default=UserStatus.active, 
        sa_column=Column(SQLAEnum(UserStatus), index=True, nullable=False, server_default=UserStatus.active.value)
    )
    last_login_at: Optional[datetime] = Field(default=None)
    
    # [REVISED] sa_column_kwargs 대신 Column으로 통일
    created_at: datetime = Field(
        default_factory=datetime.utcnow, # Pydantic 모델을 위한 기본값
        sa_column=Column(DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP"))
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow, # Pydantic 모델을 위한 기본값
        sa_column=Column(DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP"), onupdate=text("CURRENT_TIMESTAMP"))
    )

class UserAsset(SQLModel, table=True):
    __tablename__ = "user_assets"

    # [FIXED] primary_key를 Field()가 아닌 Column()으로 이동
    asset_id: Optional[int] = Field(
        default=None,
        sa_column=Column(BIGINT(unsigned=True), primary_key=True, autoincrement=True)
    )
    
    # [FIXED] foreign_key와 index를 Field()가 아닌 Column()으로 이동
    user_id: int = Field(
        sa_column=Column(
            BIGINT(unsigned=True), 
            ForeignKey("user_master.user_id"), 
            index=True, 
            nullable=False
        )
    )
    
    asset_type: AssetType = Field(sa_column=Column(SQLAEnum(AssetType), index=True, nullable=False))
    institution_name: str = Field(max_length=100, nullable=False)
    
    # [OK] sa_column이 없으므로 Field()에 index 설정 가능
    external_account_id: str = Field(max_length=100, index=True, nullable=False)
    external_account_name: Optional[str] = Field(max_length=200, default=None)

    # [REVISED] nullable=False 중복 제거 (Column 내부에만 명시)
    currency: str = Field(
        default="KRW", 
        sa_column=Column(CHAR(3), nullable=False, server_default="KRW")
    )
    
    balance: Decimal = Field(
        default=Decimal("0.00"), 
        sa_column=Column(SQLDecimal(18, 2), nullable=False, server_default=text("'0.00'"))
    )

    # [REVISED] sa_column_kwargs 대신 Column으로 통일
    created_at: datetime = Field(
        default_factory=datetime.utcnow, # Pydantic 모델을 위한 기본값
        sa_column=Column(DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP"))
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow, # Pydantic 모델을 위한 기본값
        sa_column=Column(DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP"), onupdate=text("CURRENT_TIMESTAMP"))
    )