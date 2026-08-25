"""
SQLAlchemy 2.0 Normalized Schema Models for Abuse-Ring Sentinel.
Production MySQL Database Architecture with strict multi-tenant isolation.
"""

from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy import (
    String,
    Integer,
    BigInteger,
    Double,
    Boolean,
    DateTime,
    Text,
    ForeignKey,
    UniqueConstraint,
    Index,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class MerchantModel(Base):
    __tablename__ = "merchants"

    merchant_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    company_name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="active", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    credentials: Mapped[List["MerchantCredentialModel"]] = relationship("MerchantCredentialModel", back_populates="merchant", cascade="all, delete-orphan")
    integration: Mapped[Optional["MerchantIntegrationModel"]] = relationship("MerchantIntegrationModel", back_populates="merchant", uselist=False, cascade="all, delete-orphan")


class MerchantCredentialModel(Base):
    __tablename__ = "merchant_credentials"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    merchant_id: Mapped[str] = mapped_column(String(64), ForeignKey("merchants.merchant_id", ondelete="CASCADE"), nullable=False, index=True)
    api_key_hash: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    api_key_masked: Mapped[str] = mapped_column(String(64), nullable=False)
    session_token: Mapped[Optional[str]] = mapped_column(String(255), unique=True, nullable=True, index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), default=datetime.utcnow, nullable=False)
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=False), nullable=True)

    merchant: Mapped["MerchantModel"] = relationship("MerchantModel", back_populates="credentials")


class TransactionModel(Base):
    __tablename__ = "transactions"

    transaction_id: Mapped[str] = mapped_column(String(128), primary_key=True)
    merchant_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    user_id: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    amount: Mapped[float] = mapped_column(Double, nullable=False)
    currency: Mapped[str] = mapped_column(String(16), default="INR", nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=False), nullable=False, index=True)
    product_category: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    device_id: Mapped[Optional[str]] = mapped_column(String(128), nullable=True, index=True)
    ip_address: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, index=True)
    payment_method_id: Mapped[Optional[str]] = mapped_column(String(128), nullable=True, index=True)
    shipping_address_id: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    billing_address_id: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    email_domain: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    promo_code: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    raw_payload_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), default=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index("idx_tx_merchant_time", "merchant_id", "timestamp"),
        Index("idx_tx_merchant_user_time", "merchant_id", "user_id", "timestamp"),
        Index("idx_tx_merchant_device", "merchant_id", "device_id"),
        Index("idx_tx_merchant_ip", "merchant_id", "ip_address"),
        Index("idx_tx_merchant_payment", "merchant_id", "payment_method_id"),
    )


class UserModel(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    merchant_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    user_id: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    first_seen_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), nullable=False)
    last_seen_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), nullable=False)
    account_age_days: Mapped[float] = mapped_column(Double, default=0.0, nullable=False)
    tx_count: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    total_amount: Mapped[float] = mapped_column(Double, default=0.0, nullable=False)
    promo_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    email_domain: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("merchant_id", "user_id", name="uq_user_merchant"),
        Index("idx_user_merchant_last_seen", "merchant_id", "last_seen_at"),
    )


class TransactionEntityModel(Base):
    __tablename__ = "transaction_entities"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    merchant_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    transaction_id: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    entity_type: Mapped[str] = mapped_column(String(32), nullable=False)  # device, ip, payment, shipping, billing
    entity_id: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), default=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index("idx_tx_ent_lookup", "merchant_id", "entity_type", "entity_id"),
    )


class EntityRelationshipModel(Base):
    __tablename__ = "entity_relationships"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    merchant_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    entity_type: Mapped[str] = mapped_column(String(32), nullable=False)  # device, ip, payment, shipping, billing
    entity_id: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    user_id: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    first_seen_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), nullable=False)
    last_seen_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), nullable=False)
    shared_count: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("merchant_id", "entity_type", "entity_id", "user_id", name="uq_entity_rel"),
        Index("idx_ent_rel_lookup", "merchant_id", "entity_type", "entity_id"),
        Index("idx_ent_rel_user", "merchant_id", "user_id"),
    )


class RiskEvaluationModel(Base):
    __tablename__ = "risk_evaluations"

    request_id: Mapped[str] = mapped_column(String(128), primary_key=True)
    merchant_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    transaction_id: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    risk_score: Mapped[float] = mapped_column(Double, nullable=False)
    risk_level: Mapped[str] = mapped_column(String(16), nullable=False)
    decision: Mapped[str] = mapped_column(String(16), nullable=False)
    reason_codes_json: Mapped[str] = mapped_column(Text, nullable=False)
    evidence_json: Mapped[str] = mapped_column(Text, nullable=False)
    features_json: Mapped[str] = mapped_column(Text, nullable=False)
    model_version: Mapped[str] = mapped_column(String(32), nullable=False)
    latency_ms: Mapped[float] = mapped_column(Double, nullable=False)
    data_quality_status: Mapped[str] = mapped_column(String(32), nullable=False)
    evaluated_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), default=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index("idx_eval_merchant_time", "merchant_id", "evaluated_at"),
        Index("idx_eval_merchant_decision", "merchant_id", "decision"),
    )


class MerchantActionModel(Base):
    __tablename__ = "merchant_actions"

    action_id: Mapped[str] = mapped_column(String(128), primary_key=True)
    merchant_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    transaction_id: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    decision: Mapped[str] = mapped_column(String(16), nullable=False)
    action: Mapped[str] = mapped_column(String(32), nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, index=True)  # PENDING, EXECUTED, FAILED, TIMEOUT, REJECTED, NOT_CONFIGURED
    http_status: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    merchant_reference: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    merchant_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    latency_ms: Mapped[float] = mapped_column(Double, default=0.0, nullable=False)
    attempt_number: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    payload_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    response_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), default=datetime.utcnow, nullable=False)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=False), nullable=True)

    __table_args__ = (
        Index("idx_action_merchant_status", "merchant_id", "status"),
        Index("idx_action_merchant_tx", "merchant_id", "transaction_id"),
    )


class ActionAttemptModel(Base):
    __tablename__ = "action_attempts"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    action_id: Mapped[str] = mapped_column(String(128), ForeignKey("merchant_actions.action_id", ondelete="CASCADE"), nullable=False, index=True)
    merchant_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    attempt_number: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False)
    http_status: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    error_detail: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    latency_ms: Mapped[float] = mapped_column(Double, default=0.0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), default=datetime.utcnow, nullable=False)


class OutcomeModel(Base):
    __tablename__ = "outcomes"

    transaction_id: Mapped[str] = mapped_column(String(128), primary_key=True)
    merchant_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    outcome: Mapped[str] = mapped_column(String(64), nullable=False)  # CONFIRMED_FRAUD, LEGITIMATE, CHARGEBACK, etc.
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    outcome_timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=False), nullable=False)
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), default=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index("idx_outcome_merchant", "merchant_id", "outcome"),
    )


class IdempotencyRecordModel(Base):
    __tablename__ = "idempotency_records"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    merchant_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    idempotency_key: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    transaction_id: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    response_hash: Mapped[str] = mapped_column(String(128), nullable=False)
    response_json: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), default=datetime.utcnow, nullable=False)
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=False), nullable=True)

    __table_args__ = (
        UniqueConstraint("merchant_id", "idempotency_key", name="uq_idempotency_merchant"),
    )


class AuditEventModel(Base):
    __tablename__ = "audit_events"

    event_id: Mapped[str] = mapped_column(String(128), primary_key=True)
    merchant_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    transaction_id: Mapped[Optional[str]] = mapped_column(String(128), nullable=True, index=True)
    event_type: Mapped[str] = mapped_column(String(64), nullable=False)
    actor: Mapped[str] = mapped_column(String(128), default="system", nullable=False)
    details_json: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), default=datetime.utcnow, nullable=False, index=True)

    __table_args__ = (
        Index("idx_audit_merchant_time", "merchant_id", "created_at"),
    )


class MerchantIntegrationModel(Base):
    __tablename__ = "merchant_integrations"

    merchant_id: Mapped[str] = mapped_column(String(64), ForeignKey("merchants.merchant_id", ondelete="CASCADE"), primary_key=True)
    action_endpoint_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    auth_header_name: Mapped[str] = mapped_column(String(64), default="Authorization", nullable=False)
    auth_token: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    webhook_secret: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    timeout_seconds: Mapped[float] = mapped_column(Double, default=3.0, nullable=False)
    max_retries: Mapped[int] = mapped_column(Integer, default=2, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    merchant: Mapped["MerchantModel"] = relationship("MerchantModel", back_populates="integration")
