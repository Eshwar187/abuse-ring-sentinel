"""
Authentication, Merchant Onboarding, and Live State Pydantic Schemas.
"""

from __future__ import annotations
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field, EmailStr, field_validator


class SignupRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr = Field(...)
    company_name: str = Field(..., min_length=2, max_length=100)
    password: str = Field(..., min_length=8, max_length=128)

    @field_validator("full_name", "company_name")
    @classmethod
    def strip_whitespace(cls, v: str) -> str:
        return v.strip()


class SignupResponse(BaseModel):
    merchant_id: str
    user_id: str
    full_name: str
    email: str
    company_name: str
    api_key: str = Field(..., description="Raw API key shown only once upon account creation")
    session_token: str
    created_at: str


class LoginRequest(BaseModel):
    email: EmailStr = Field(...)
    password: str = Field(..., min_length=1)


class LoginResponse(BaseModel):
    merchant_id: str
    user_id: str
    full_name: str
    email: str
    company_name: str
    session_token: str
    api_key_masked: str


class UserSessionResponse(BaseModel):
    user_id: str
    merchant_id: str
    full_name: str
    email: str
    company_name: str
    api_key_masked: str


class RotateKeyResponse(BaseModel):
    new_api_key: str
    key_prefix: str
    created_at: str
    message: str = "Store this API key securely. It will not be shown again."


class MerchantTransactionItem(BaseModel):
    transaction_id: str
    user_id: str
    amount: float
    currency: str
    timestamp: str
    product_category: Optional[str] = None
    device_id: Optional[str] = None
    ip_address: Optional[str] = None
    payment_method_id: Optional[str] = None
    risk_score: Optional[float] = None
    risk_level: Optional[str] = None
    decision: Optional[str] = None
    primary_reason: Optional[str] = None
    is_promo_used: Optional[int] = 0
    connected_users: Optional[int] = 0
    evaluated_at: Optional[str] = None


class MerchantTransactionsResponse(BaseModel):
    merchant_id: str
    total_count: int
    page: int
    page_size: int
    transactions: List[MerchantTransactionItem]
    zero_data_state: bool


class MerchantMetricsResponse(BaseModel):
    merchant_id: str
    total_transactions: int
    approvals: int
    reviews: int
    blocks: int
    approval_rate: float
    review_rate: float
    block_rate: float
    average_risk_score: float
    recent_transactions: List[MerchantTransactionItem]
    zero_data_state: bool
    last_evaluated_at: Optional[str] = None


class MerchantEntityGraphResponse(BaseModel):
    merchant_id: str
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]
    total_nodes: int
    total_edges: int
    zero_data_state: bool
