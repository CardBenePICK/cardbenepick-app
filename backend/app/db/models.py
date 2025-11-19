# DB 테이블(`user_master`, `user_assets`) 정의
import enum
from typing import Optional, List, Any
from decimal import Decimal
from datetime import datetime, date
from sqlmodel import SQLModel, Field, Column, Enum as SQLAEnum, text

# 3. SQLAlchemy에서 필요한 타입들 임포트
from sqlalchemy import CHAR, BINARY, VARBINARY, ForeignKey, DateTime, JSON
from sqlalchemy.dialects.mysql import BIGINT, DECIMAL as SQLDecimal, TINYINT
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

# --- UserMaster ---
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

# --- UserAsset ---
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

# --- CardMaster ---
class CardMaster(SQLModel, table=True):
    """
    카드 상품 마스터 정보
    """
    __tablename__ = "card_master"

    # card_id는 문자열(varchar(64))로 정의되어 있음
    card_id: str = Field(primary_key=True, max_length=64)
    
    card_name: str = Field(max_length=128, nullable=False)
    card_company: str = Field(max_length=64, nullable=False, index=True) # 인덱스 반영
    
    card_rank: Optional[int] = Field(default=None)
    
    # card_type: 0=신용, 1=체크 등 (TINYINT 매핑)
    card_type: int = Field(sa_column=Column(TINYINT, nullable=False))
    
    domestic_year_cost: Optional[int] = Field(default=None)
    abroad_year_cost: Optional[int] = Field(default=None)
    previous_month_performance: Optional[int] = Field(default=None)
    
    created_at: Optional[datetime] = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime, server_default=text("CURRENT_TIMESTAMP"))
    )
    
    # JSON 타입 컬럼 매핑 (주의: MySQL에서 JSON 타입 지원 필요)
    json_notice: Optional[Any] = Field(default=None, sa_column=Column(JSON))

# --- CardTransaction ---
class CardTransaction(SQLModel, table=True):
    """
    사용자 카드 결제 내역 (파티셔닝 적용된 테이블)
    """
    __tablename__ = "card_transactions"

    # id와 transaction_date가 복합 PK로 설정되어 있으나,
    # SQLModel에서 복합 PK 설정이 복잡할 수 있으므로 id를 primary key로 지정하고
    # 실제 DB 제약조건은 DB 스키마를 따름.
    id: Optional[int] = Field(
        default=None,
        sa_column=Column(BIGINT(unsigned=True), primary_key=True, autoincrement=True)
    )
    
    transaction_id: str = Field(max_length=64, nullable=False) # UNIQUE KEY (with date)
    
    user_id: int = Field(
        sa_column=Column(BIGINT(unsigned=True), nullable=False, index=True)
    )
    
    card_id: str = Field(max_length=64, nullable=False, index=True)
    card_company: str = Field(max_length=64, nullable=False, index=True)
    
    transaction_date: datetime = Field(nullable=False, primary_key=True) # 복합 PK의 일부이므로 PK 표시
    
    merchant_name: Optional[str] = Field(max_length=128, default=None, index=True)
    amount_krw: int = Field(nullable=False)
    installment_months: int = Field(default=0, nullable=False)
    
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP"))
    )