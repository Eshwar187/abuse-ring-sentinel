"""
Merchant Raw Event Normalizer.

Transforms merchant input into a sanitized, validated CanonicalTransaction.
- Parses ISO-8601/UTC timestamps
- Extracts and cleans email domains
- Normalizes payment/device/ip/address identifiers
- Computes checkout-level boolean indicators (e.g. promo usage, billing-shipping match)
"""

from __future__ import annotations
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from dataclasses import dataclass

from src.integration.schemas import RawTransactionEvent
from src.integration.merchant_adapter import MerchantAdapter


@dataclass(frozen=True)
class CanonicalTransaction:
    """
    Sanitized, normalized canonical representation of a merchant transaction.
    """
    transaction_id: str
    user_id: str
    amount: float
    currency: str
    timestamp: datetime
    product_category: str
    device_id: str
    ip_address: str
    payment_method_id: str
    billing_address_id: str
    shipping_address_id: str
    email_domain: str
    is_promo_used: int
    promo_code: str
    billing_shipping_match: int
    custom_fields: Dict[str, Any]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "transaction_id": self.transaction_id,
            "user_id": self.user_id,
            "amount": self.amount,
            "currency": self.currency,
            "timestamp": self.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
            "product_category": self.product_category,
            "device_id": self.device_id,
            "ip_address": self.ip_address,
            "payment_method_id": self.payment_method_id,
            "billing_address_id": self.billing_address_id,
            "shipping_address_id": self.shipping_address_id,
            "email_domain": self.email_domain,
            "is_promo_used": self.is_promo_used,
            "promo_code": self.promo_code,
            "billing_shipping_match": self.billing_shipping_match,
        }


class EventNormalizer:
    """
    Normalizes raw merchant transaction payloads into CanonicalTransaction objects.
    """

    def __init__(self, adapter: Optional[MerchantAdapter] = None):
        self.adapter = adapter or MerchantAdapter()

    @staticmethod
    def parse_timestamp(ts_str: str) -> datetime:
        """Parses diverse timestamp strings into a timezone-naive UTC datetime."""
        s = ts_str.strip()
        formats = [
            "%Y-%m-%dT%H:%M:%SZ",
            "%Y-%m-%dT%H:%M:%S",
            "%Y-%m-%d %H:%M:%S",
            "%Y-%m-%d",
        ]
        for fmt in formats:
            try:
                return datetime.strptime(s, fmt)
            except ValueError:
                continue
        # Fallback to fromisoformat
        dt = datetime.fromisoformat(s.replace("Z", "+00:00"))
        if dt.tzinfo is not None:
            dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
        return dt

    @staticmethod
    def extract_email_domain(val: Optional[str]) -> str:
        """Extracts domain from an email or returns the sanitized domain string."""
        if not val or not isinstance(val, str):
            return "unknown"
        val_clean = val.strip().lower()
        if "@" in val_clean:
            parts = val_clean.split("@")
            domain = parts[-1].strip()
            return domain if domain else "unknown"
        return val_clean if val_clean else "unknown"

    def normalize(self, raw_event: RawTransactionEvent) -> CanonicalTransaction:
        """
        Normalizes a validated RawTransactionEvent into CanonicalTransaction.
        """
        raw_dict = raw_event.model_dump()
        adapted = self.adapter.adapt_payload(raw_dict)

        dt = self.parse_timestamp(adapted["timestamp"])
        category = str(adapted.get("product_category") or "general").strip().lower()
        promo_code = str(adapted.get("promo_code") or "").strip()
        is_promo_used = 1 if promo_code else 0

        shipping_id = str(adapted.get("shipping_address_id") or "").strip()
        billing_id = str(adapted.get("billing_address_id") or "").strip()
        billing_shipping_match = 1 if (shipping_id and shipping_id == billing_id) else 0

        email_dom = self.extract_email_domain(adapted.get("email_domain"))

        return CanonicalTransaction(
            transaction_id=str(adapted["transaction_id"]).strip(),
            user_id=str(adapted["user_id"]).strip(),
            amount=float(adapted["amount"]),
            currency=str(adapted.get("currency", "INR")).strip().upper(),
            timestamp=dt,
            product_category=category,
            device_id=str(adapted.get("device_id") or "").strip(),
            ip_address=str(adapted.get("ip_address") or "").strip(),
            payment_method_id=str(adapted.get("payment_method_id") or "").strip(),
            billing_address_id=billing_id,
            shipping_address_id=shipping_id,
            email_domain=email_dom,
            is_promo_used=is_promo_used,
            promo_code=promo_code,
            billing_shipping_match=billing_shipping_match,
            custom_fields=adapted.get("custom_fields", {}),
        )
