"""
Local Real Demo Merchant Backend API.
Standalone FastAPI service simulating an integrated eCommerce merchant backend.
"""

from __future__ import annotations
import hmac
import hashlib
import time
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone
from fastapi import FastAPI, Header, HTTPException, Request, status
from pydantic import BaseModel, Field

from demo_merchant.store import DemoMerchantOrderStore
from src.actions.signature import verify_action_signature


app = FastAPI(
    title="Apex Retail — Merchant Backend Simulator",
    description="Real local merchant application responding to Abuse-Ring Sentinel action webhooks",
    version="1.0.0",
)

order_store = DemoMerchantOrderStore()

# Expected merchant auth credentials (configurable)
MERCHANT_SHARED_SECRET = "demo_webhook_secret_99"
MERCHANT_AUTH_BEARER = "merchant_internal_key_abc123"


class OrderCreateRequest(BaseModel):
    order_id: str
    user_id: str
    amount: float
    currency: str = "INR"


class RiskActionPayload(BaseModel):
    event: Optional[str] = "risk.action_required"
    request_id: str
    merchant_id: str
    transaction_id: str
    decision: str
    risk_score: float
    action: str
    reason_codes: Optional[List[str]] = []
    timestamp: str


@app.get("/api/health")
async def merchant_health():
    return {
        "status": "ok",
        "service": "apex_retail_demo_merchant",
        "store": "sqlite",
        "orders_count": len(order_store.list_orders(1000)),
    }


@app.post("/api/orders", status_code=status.HTTP_201_CREATED)
async def create_order(payload: OrderCreateRequest):
    """Creates a new pending order in the merchant store."""
    order = order_store.create_order(
        order_id=payload.order_id,
        user_id=payload.user_id,
        amount=payload.amount,
        currency=payload.currency,
    )
    return order


@app.get("/api/orders/{order_id}")
async def get_order(order_id: str):
    """Returns order state from merchant database."""
    order = order_store.get_order(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@app.get("/api/orders")
async def list_orders():
    """Lists recent merchant orders."""
    return order_store.list_orders(50)


@app.post("/api/risk/action", status_code=status.HTTP_200_OK)
async def handle_risk_action(
    request: Request,
    authorization: Optional[str] = Header(None, alias="Authorization"),
    x_sentinel_sig: Optional[str] = Header(None, alias="X-Abuse-Sentinel-Signature"),
    x_sentinel_req_id: Optional[str] = Header(None, alias="X-Abuse-Sentinel-Request-ID"),
    idempotency_key: Optional[str] = Header(None, alias="Idempotency-Key"),
):
    """
    Receives Sentinel's signed action webhook, verifies HMAC signature,
    and genuinely updates the order state in SQLite.
    """
    raw_body = await request.body()

    # 1. Probe Ping Handling
    try:
        body_json = await request.json()
    except Exception:
        body_json = {}

    if body_json.get("event") == "risk.ping" or request.headers.get("X-Abuse-Sentinel-Probe") == "true":
        return {
            "status": "CONNECTED",
            "message": "Apex Retail endpoint active and listening",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    # 2. Verify HMAC-SHA256 signature if signature header is provided
    if x_sentinel_sig:
        valid = verify_action_signature(raw_body, MERCHANT_SHARED_SECRET, x_sentinel_sig)
        if not valid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"error": True, "code": "INVALID_SIGNATURE", "message": "HMAC-SHA256 signature mismatch"},
            )

    action_payload = RiskActionPayload(**body_json)
    order_id = action_payload.transaction_id
    action = action_payload.action

    # 3. Update real SQLite order
    updated_order = order_store.update_order_risk_action(
        order_id=order_id,
        action=action,
        risk_score=action_payload.risk_score,
        notes=f"Decision: {action_payload.decision}, Reasons: {','.join(action_payload.reason_codes or [])}",
    )

    now_iso = datetime.now(timezone.utc).isoformat()
    return {
        "status": "EXECUTED",
        "merchant_reference": order_id,
        "merchant_message": f"Order {order_id} transitioned to state: {updated_order['status']}",
        "executed_at": now_iso,
        "order_state": updated_order["status"],
    }
