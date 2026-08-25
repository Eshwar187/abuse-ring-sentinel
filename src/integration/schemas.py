"""
Pydantic Schemas for Raw Merchant Integration (API v1).

Defines the external API contracts for:
- Raw observable merchant transactions (no manual feature calculation required)
- Asynchronous lifecycle events
- Feedback and chargeback outcomes
- Structured evaluation responses with reason codes and evidence
- Merchant health and configuration
"""

from __future__ import annotations
import re
from datetime import datetime
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field, field_validator, model_validator


# Forbidden ground-truth or post-event columns
FORBIDDEN_GROUND_TRUTH = {
    "is_abuse_ring",
    "ring_id",
    "ring_type",
    "user_population_type",
    "order_status",
    "fraud_label",
    "is_fraud",
}

# Regex patterns for credit cards and CVVs
CARD_PAN_REGEX = re.compile(r"\b(?:\d[ -]*?){13,19}\b")
CVV_REGEX = re.compile(r"\b\d{3,4}\b")


class RawTransactionEvent(BaseModel):
    """
    Raw, observable checkout transaction event submitted by a merchant.
    The merchant does NOT need to compute any of the 33 ML features.
    """
    transaction_id: str = Field(..., min_length=1, max_length=128, description="Unique transaction identifier")
    user_id: str = Field(..., min_length=1, max_length=128, description="Merchant user/customer identifier")
    amount: float = Field(..., gt=0.0, le=1000000.0, description="Transaction monetary amount")
    currency: str = Field(default="INR", min_length=3, max_length=3, description="ISO currency code (e.g. INR, USD)")
    timestamp: str = Field(..., description="ISO-8601 or UTC string timestamp of checkout event")
    product_category: str = Field(default="general", max_length=64, description="E-commerce product category")
    device_id: Optional[str] = Field(default="", max_length=128, description="Client device fingerprint or ID")
    ip_address: Optional[str] = Field(default="", max_length=64, description="Client IP address or hashed subnet")
    payment_method_id: Optional[str] = Field(default="", max_length=128, description="Tokenized payment instrument ID")
    billing_address_id: Optional[str] = Field(default="", max_length=128, description="Billing address identifier")
    shipping_address_id: Optional[str] = Field(default="", max_length=128, description="Shipping address identifier")
    email_domain: Optional[str] = Field(default="unknown", max_length=128, description="Email domain or customer email")
    promo_code: Optional[str] = Field(default="", max_length=64, description="Promotional voucher code if used")
    custom_fields: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Optional merchant custom fields")

    @field_validator("transaction_id", "user_id")
    @classmethod
    def validate_non_empty_identifiers(cls, v: str) -> str:
        s = v.strip()
        if not s:
            raise ValueError("Identifier must not be empty or blank.")
        return s

    @field_validator("timestamp")
    @classmethod
    def validate_timestamp_format(cls, v: str) -> str:
        s = v.strip()
        formats = [
            "%Y-%m-%dT%H:%M:%SZ",
            "%Y-%m-%dT%H:%M:%S",
            "%Y-%m-%d %H:%M:%S",
            "%Y-%m-%d",
        ]
        parsed = None
        for fmt in formats:
            try:
                parsed = datetime.strptime(s, fmt)
                break
            except ValueError:
                continue
        if parsed is None:
            try:
                parsed = datetime.fromisoformat(s.replace("Z", "+00:00"))
            except Exception:
                raise ValueError(f"Invalid timestamp format: '{v}'. Expected ISO-8601 UTC (e.g. '2026-08-25T12:00:00Z').")
        return s

    @model_validator(mode="before")
    @classmethod
    def check_forbidden_and_sensitive_fields(cls, data: Any) -> Any:
        if isinstance(data, dict):
            # Check top-level and custom_fields for forbidden ground-truth labels
            all_keys = set(data.keys())
            if "custom_fields" in data and isinstance(data["custom_fields"], dict):
                all_keys.update(data["custom_fields"].keys())

            leaked = all_keys.intersection(FORBIDDEN_GROUND_TRUTH)
            if leaked:
                raise ValueError(f"Ground-truth or target leakage fields rejected in raw ingestion: {sorted(list(leaked))}")

            # Check keys and values for raw card numbers or sensitive credentials (password, secret, token)
            def scan_dict_recursive(d: Dict[str, Any]):
                for k, val in d.items():
                    k_lower = str(k).lower()
                    if "password" in k_lower or "secret" in k_lower or "cvv" in k_lower or "pan" in k_lower:
                        raise ValueError(f"Sensitive credential field detected: '{k}'.")
                    if isinstance(val, str) and k not in ("timestamp", "transaction_id"):
                        val_lower = val.lower()
                        if "password" in val_lower or "secret" in val_lower or "bearer " in val_lower:
                            raise ValueError(f"Sensitive credentials or secrets detected in field '{k}'.")
                    elif isinstance(val, dict):
                        scan_dict_recursive(val)

            scan_dict_recursive(data)
        return data


class ReasonCodeEvidence(BaseModel):
    code: str
    message: str
    evidence: Dict[str, Any]


class DataQualityMetadata(BaseModel):
    status: str = Field(..., description="'cold_start' if minimal history exists; 'sufficient_history' if established.")
    historical_transactions: int = Field(default=0, description="Count of prior user transactions before timestamp T")
    graph_connected_entities: int = Field(default=0, description="Count of prior shared entities before timestamp T")


class RiskEvaluateResponse(BaseModel):
    transaction_id: str
    merchant_id: str
    risk_score: float = Field(..., ge=0.0, le=1.0)
    risk_level: str = Field(..., description="LOW, MEDIUM, or HIGH")
    decision: str = Field(..., description="APPROVE, REVIEW, or BLOCK")
    reason_codes: List[ReasonCodeEvidence]
    evidence: Dict[str, Any]
    data_quality: DataQualityMetadata
    model_version: str
    feature_version: str
    policy_version: str
    evaluated_at: str
    request_id: str
    latency_ms: float
    merchant_action: Optional[Dict[str, Any]] = Field(default=None, description="Outbound action execution status and details")


class MerchantEventPayload(BaseModel):
    event_id: str = Field(default_factory=lambda: f"evt_{datetime.utcnow().strftime('%Y%m%d%H%M%S%f')}")
    event_type: str = Field(..., description="transaction.created, transaction.completed, transaction.cancelled, transaction.refunded, transaction.chargeback")
    transaction_id: str
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"))
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)


class OutcomePayload(BaseModel):
    transaction_id: str = Field(..., min_length=1, max_length=128)
    outcome: str = Field(..., description="CONFIRMED_FRAUD, LEGITIMATE, MANUAL_REVIEW_CONFIRMED, CHARGEBACK, UNKNOWN")
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"))
    notes: Optional[str] = Field(default="", max_length=512)

    @field_validator("outcome")
    @classmethod
    def validate_outcome_type(cls, v: str) -> str:
        valid_outcomes = {
            "CONFIRMED_FRAUD",
            "LEGITIMATE",
            "MANUAL_REVIEW_CONFIRMED",
            "CHARGEBACK",
            "UNKNOWN",
        }
        v_upper = v.strip().upper()
        if v_upper not in valid_outcomes:
            raise ValueError(f"Invalid outcome '{v}'. Must be one of: {sorted(list(valid_outcomes))}")
        return v_upper


class MerchantConfigResponse(BaseModel):
    merchant_id: str
    api_version: str = "v1"
    model_name: str = "abuse_ring_sentinel"
    model_type: str = "hist_gradient_boosting"
    model_version: str
    feature_version: str
    policy_version: str
    threshold: float = 0.90
    supported_event_types: List[str]
    required_fields: List[str]
    environment: str


class MerchantHealthResponse(BaseModel):
    status: str = "ok"
    merchant_id: str
    integration_status: str = "connected"
    model_status: str = "ready"
    state_store_status: str = "ready"
    last_processed_event: Optional[str] = None
    environment: str
    timestamp: str
