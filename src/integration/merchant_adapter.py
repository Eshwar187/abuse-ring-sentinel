"""
Merchant Adapter and Field Mapping Layer.

Provides configurable merchant-specific field alias mappings into canonical representations:
- customerId / account_id -> user_id
- deviceFingerprint / device_token -> device_id
- paymentToken / card_token / payment_id -> payment_method_id
- ip / client_ip -> ip_address
- shippingAddressId / ship_to_address -> shipping_address_id
- billingAddressId / bill_to_address -> billing_address_id
"""

from __future__ import annotations
from typing import Dict, Any, Optional


DEFAULT_FIELD_MAPPINGS: Dict[str, str] = {
    # User / Customer Aliases
    "customerId": "user_id",
    "customer_id": "user_id",
    "accountId": "user_id",
    "account_id": "user_id",
    "userId": "user_id",
    # Device Aliases
    "deviceFingerprint": "device_id",
    "device_fingerprint": "device_id",
    "deviceToken": "device_id",
    "device_token": "device_id",
    "deviceId": "device_id",
    # IP Aliases
    "clientIp": "ip_address",
    "client_ip": "ip_address",
    "ip": "ip_address",
    "ipAddress": "ip_address",
    # Payment Method Aliases
    "paymentToken": "payment_method_id",
    "payment_token": "payment_method_id",
    "cardToken": "payment_method_id",
    "card_token": "payment_method_id",
    "paymentId": "payment_method_id",
    "payment_id": "payment_method_id",
    "paymentMethodId": "payment_method_id",
    "payment_instrument_id": "payment_method_id",
    # Shipping Address Aliases
    "shippingAddressId": "shipping_address_id",
    "shipping_address": "shipping_address_id",
    "shippingAddress": "shipping_address_id",
    "shipToAddress": "shipping_address_id",
    # Billing Address Aliases
    "billingAddressId": "billing_address_id",
    "billing_address": "billing_address_id",
    "billingAddress": "billing_address_id",
    "billToAddress": "billing_address_id",
    # Promo Code Aliases
    "promoCode": "promo_code",
    "couponCode": "promo_code",
    "voucherCode": "promo_code",
    "discountCode": "promo_code",
    # Product Category Aliases
    "category": "product_category",
    "productCategory": "product_category",
    # Email Aliases
    "email": "email_domain",
    "emailDomain": "email_domain",
}


class MerchantAdapter:
    """
    Adapts merchant-specific payload formats into canonical dictionary structures.
    """

    def __init__(self, custom_mappings: Optional[Dict[str, str]] = None):
        self.mappings = dict(DEFAULT_FIELD_MAPPINGS)
        if custom_mappings:
            self.mappings.update(custom_mappings)

    def adapt_payload(self, raw_dict: Dict[str, Any]) -> Dict[str, Any]:
        """
        Maps known alias fields to canonical field names.
        """
        canonical: Dict[str, Any] = {}
        custom_fields: Dict[str, Any] = dict(raw_dict.get("custom_fields", {}))

        for k, v in raw_dict.items():
            if k == "custom_fields":
                continue
            canonical_key = self.mappings.get(k, k)
            if canonical_key in (
                "transaction_id",
                "user_id",
                "amount",
                "currency",
                "timestamp",
                "product_category",
                "device_id",
                "ip_address",
                "payment_method_id",
                "billing_address_id",
                "shipping_address_id",
                "email_domain",
                "promo_code",
            ):
                canonical[canonical_key] = v
            else:
                custom_fields[k] = v

        canonical["custom_fields"] = custom_fields
        return canonical
