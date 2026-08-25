"""
Pydantic Schemas for Merchant Action Execution Subsystem.
"""

from __future__ import annotations
from enum import Enum
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from pydantic import BaseModel, Field, HttpUrl, ConfigDict


class ActionType(str, Enum):
    APPROVE_TRANSACTION = "APPROVE_TRANSACTION"
    REVIEW_TRANSACTION = "REVIEW_TRANSACTION"
    BLOCK_TRANSACTION = "BLOCK_TRANSACTION"


class ActionStatus(str, Enum):
    PENDING = "PENDING"
    EXECUTED = "EXECUTED"
    FAILED = "FAILED"
    REJECTED = "REJECTED"
    TIMEOUT = "TIMEOUT"
    NOT_CONFIGURED = "NOT_CONFIGURED"


class RiskActionRequest(BaseModel):
    """
    Outbound payload sent to the merchant's webhook endpoint.
    """
    event: str = Field(default="risk.action_required", description="Standard event topic")
    request_id: str = Field(..., description="Unique idempotency and trace ID for the request")
    merchant_id: str = Field(..., description="Merchant identifier")
    transaction_id: str = Field(..., description="Merchant transaction / order identifier")
    decision: str = Field(..., description="Risk policy decision: APPROVE, REVIEW, BLOCK")
    risk_score: float = Field(..., ge=0.0, le=1.0, description="Risk probability score")
    risk_level: str = Field(default="LOW", description="LOW, MEDIUM, HIGH")
    action: ActionType = Field(..., description="Requested merchant action")
    reason_codes: List[str] = Field(default_factory=list, description="Ranked risk reasons")
    timestamp: str = Field(..., description="Transaction timestamp (ISO 8601)")
    model_version: str = Field(default="phase3-v1", description="Active GBDT model version")
    policy_version: str = Field(default="val-opt-v1", description="Active threshold policy version")

    model_config = ConfigDict(extra="forbid")


class MerchantActionResponse(BaseModel):
    """
    Structured response received from merchant webhook endpoint or returned by action service.
    """
    request_id: str = Field(..., description="Trace request identifier")
    transaction_id: str = Field(..., description="Transaction identifier")
    action: ActionType = Field(..., description="Action evaluated")
    status: ActionStatus = Field(..., description="Execution status: EXECUTED, FAILED, PENDING, REJECTED, TIMEOUT, NOT_CONFIGURED")
    merchant_reference: Optional[str] = Field(None, description="Merchant order or incident reference")
    merchant_message: Optional[str] = Field(None, description="Merchant response message")
    http_status: Optional[int] = Field(None, description="HTTP status code from merchant")
    latency_ms: Optional[float] = Field(None, description="Outbound request latency in milliseconds")
    attempt_number: int = Field(default=1, description="Attempt number of execution")
    executed_at: Optional[str] = Field(None, description="ISO timestamp of confirmed merchant execution")
    error_detail: Optional[str] = Field(None, description="Redacted error detail if action failed")

    model_config = ConfigDict(extra="ignore")


class MerchantIntegrationConfig(BaseModel):
    """
    Merchant webhook and outbound action execution configuration.
    """
    merchant_id: str = Field(..., description="Merchant identifier")
    action_endpoint_url: Optional[str] = Field(None, description="Outbound HTTP webhook URL")
    auth_header_name: str = Field(default="Authorization", description="Header name for authentication")
    auth_token: Optional[str] = Field(None, description="Auth token / API key for merchant endpoint")
    auth_token_masked: Optional[str] = Field(None, description="Masked auth token for UI display")
    webhook_secret: Optional[str] = Field(None, description="HMAC-SHA256 signing secret")
    webhook_secret_masked: Optional[str] = Field(None, description="Masked signing secret for UI display")
    timeout_seconds: float = Field(default=3.0, ge=0.5, le=30.0, description="HTTP request timeout in seconds")
    max_retries: int = Field(default=2, ge=0, le=5, description="Maximum retry attempts on retryable errors")
    is_active: bool = Field(default=True, description="Whether outbound action execution is enabled")
    updated_at: Optional[str] = Field(None, description="Last configuration update timestamp")

    model_config = ConfigDict(extra="ignore")


class MerchantIntegrationUpdateRequest(BaseModel):
    """
    Payload for updating merchant action integration settings.
    """
    action_endpoint_url: Optional[str] = Field(None, description="Webhook endpoint URL")
    auth_token: Optional[str] = Field(None, description="New auth token / API key (leave blank to keep existing)")
    webhook_secret: Optional[str] = Field(None, description="New HMAC secret (leave blank to keep existing)")
    timeout_seconds: Optional[float] = Field(default=3.0, ge=0.5, le=30.0)
    max_retries: Optional[int] = Field(default=2, ge=0, le=5)
    is_active: Optional[bool] = Field(default=True)


class ActionTestRequest(BaseModel):
    """
    Payload for testing merchant action endpoint connectivity.
    """
    endpoint_url: Optional[str] = Field(None, description="Optional override URL to test")
    auth_token: Optional[str] = Field(None, description="Optional override auth token")
    webhook_secret: Optional[str] = Field(None, description="Optional override HMAC secret")


class ActionTestResponse(BaseModel):
    """
    Result of a real merchant endpoint probe.
    """
    status: str = Field(..., description="CONNECTED or FAILED")
    http_status: Optional[int] = Field(None, description="HTTP response status code")
    latency_ms: float = Field(..., description="Round-trip latency in milliseconds")
    endpoint_url: str = Field(..., description="Target endpoint tested")
    request_id: str = Field(..., description="Probe request identifier")
    timestamp: str = Field(..., description="Execution timestamp")
    response_body: Optional[str] = Field(None, description="Truncated response snippet")
    error: Optional[str] = Field(None, description="Diagnostic error message if failed")


class ActionRecord(BaseModel):
    """
    Database record representation for an action attempt.
    """
    action_id: str
    merchant_id: str
    transaction_id: str
    decision: str
    action: str
    attempt_number: int
    status: str
    http_status: Optional[int] = None
    merchant_reference: Optional[str] = None
    merchant_message: Optional[str] = None
    latency_ms: Optional[float] = None
    payload_json: Optional[str] = None
    response_json: Optional[str] = None
    created_at: str
    completed_at: Optional[str] = None
