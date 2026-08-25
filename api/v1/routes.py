"""
Versioned Merchant Risk API (v1).

Endpoints:
- POST /api/v1/risk/evaluate  -> Real-time raw transaction evaluation
- GET  /api/v1/risk/{tx_id}    -> Retrieve previously evaluated transaction
- POST /api/v1/events         -> Asynchronous transaction lifecycle events
- POST /api/v1/outcomes       -> Merchant feedback & chargeback outcomes
- GET  /api/v1/merchant/config -> Safe integration configuration & requirements
- GET  /api/v1/merchant/health -> Live integration and state store status
"""

from __future__ import annotations
import hmac
import time
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, Optional

from fastapi import APIRouter, Header, HTTPException, Request, Response, status
from fastapi.responses import JSONResponse

from src.integration.schemas import (
    RawTransactionEvent,
    RiskEvaluateResponse,
    ReasonCodeEvidence,
    DataQualityMetadata,
    MerchantEventPayload,
    OutcomePayload,
    MerchantConfigResponse,
    MerchantHealthResponse,
)
from src.integration.normalizer import EventNormalizer
from src.integration.feature_adapter import FeatureAdapter
from src.state.state_store import RuntimeStateStore
from src.decision.engine import RiskDecisionEngine
from src.audit.logger import AuditLogger
from src.config import config


router = APIRouter(prefix="/api/v1", tags=["Merchant Risk API v1"])

# Standard Development & Sandbox API Keys mapping to Merchant IDs
API_KEY_REGISTRY: Dict[str, str] = {
    "ars_live_test_merchant_01": "merchant_dev_01",
    "ars_live_demo_merchant_02": "merchant_dev_02",
    "ars_live_sandbox_key": "merchant_sandbox",
}


def authenticate_merchant(
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
    authorization: Optional[str] = Header(None, alias="Authorization"),
) -> str:
    """
    Authenticates incoming merchant requests using X-API-Key or Bearer token.
    Uses constant-time comparison to prevent timing side-channel leaks.
    """
    token = None
    if x_api_key:
        token = x_api_key.strip()
    elif authorization and authorization.startswith("Bearer "):
        token = authorization[7:].strip()

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error": True,
                "code": "UNAUTHORIZED",
                "message": "Missing merchant API key. Provide via 'X-API-Key' or 'Authorization: Bearer <key>'.",
            },
        )

    for registered_key, merchant_id in API_KEY_REGISTRY.items():
        if hmac.compare_digest(token, registered_key):
            return merchant_id

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail={
            "error": True,
            "code": "INVALID_API_KEY",
            "message": "Invalid merchant API key provided.",
        },
    )


def create_v1_router(
    decision_engine: RiskDecisionEngine,
    state_store: RuntimeStateStore,
    audit_logger: AuditLogger,
    normalizer: EventNormalizer,
    feature_adapter: FeatureAdapter,
) -> APIRouter:
    """
    Factory creating the v1 APIRouter injected with runtime singletons.
    """
    v1 = APIRouter(prefix="/api/v1", tags=["Merchant Risk API v1"])

    @v1.post("/risk/evaluate", response_model=RiskEvaluateResponse, status_code=status.HTTP_200_OK)
    async def evaluate_transaction_risk(
        payload: RawTransactionEvent,
        request: Request,
        idempotency_key: Optional[str] = Header(None, alias="Idempotency-Key"),
        x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
        authorization: Optional[str] = Header(None, alias="Authorization"),
    ):
        """
        Ingests a raw merchant transaction event, normalizes it, derives the 33 point-in-time features,
        executes the frozen HistGradientBoosting model, applies decision policy, generates reason codes,
        and logs audit records.
        """
        merchant_id = authenticate_merchant(x_api_key=x_api_key, authorization=authorization)
        start_time = time.perf_counter()
        req_id = str(uuid.uuid4())

        # 1. Idempotency Check
        if idempotency_key:
            cached = state_store.get_idempotency_result(merchant_id, idempotency_key)
            if cached:
                cached["request_id"] = req_id
                return cached

        # 2. Normalize Raw Event
        canonical_tx = normalizer.normalize(payload)

        # 3. Derive 33 Point-in-Time Features (strictly t < t_pred)
        features_dict, data_quality = feature_adapter.extract_features(merchant_id, canonical_tx)

        # 4. Real Inference & Decision Engine Execution
        if decision_engine is None or decision_engine.model_service.model is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail={
                    "error": True,
                    "code": "MODEL_UNAVAILABLE",
                    "message": "Risk model engine is not ready for inference.",
                    "request_id": req_id,
                },
            )

        decision_result = decision_engine.evaluate_features(features_dict)
        elapsed_ms = round((time.perf_counter() - start_time) * 1000.0, 2)

        meta = decision_engine.model_service.metadata
        policy_ver = decision_engine.policy.policy_version
        evaluated_at = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

        # 5. Commit Transaction to Runtime State Store & Point-in-Time Graph
        state_store.record_evaluated_transaction(
            merchant_id=merchant_id,
            tx=canonical_tx,
            risk_score=decision_result["risk_score"],
            decision=decision_result["decision"],
            evaluated_at=evaluated_at,
        )

        # 6. Append-only Structured Audit Logging
        decision_payload_for_audit = {
            "transaction_id": canonical_tx.transaction_id,
            "risk_score": decision_result["risk_score"],
            "risk_level": decision_result["risk_level"],
            "decision": decision_result["decision"],
            "reason_codes": decision_result["reason_codes"],
            "evaluated_at": evaluated_at,
            "model_metadata": {
                "model_version": meta["model_version"],
                "feature_version": meta["feature_version"],
                "policy_version": policy_ver,
            },
        }
        audit_logger.log(
            decision_result=decision_payload_for_audit,
            request_id=req_id,
            latency_ms=elapsed_ms,
        )

        response_payload = {
            "transaction_id": canonical_tx.transaction_id,
            "merchant_id": merchant_id,
            "risk_score": decision_result["risk_score"],
            "risk_level": decision_result["risk_level"],
            "decision": decision_result["decision"],
            "reason_codes": [
                {
                    "code": r["code"],
                    "message": r["message"],
                    "evidence": r["evidence"],
                }
                for r in decision_result["reason_codes"]
            ],
            "evidence": decision_result["evidence"],
            "data_quality": {
                "status": data_quality.status,
                "historical_transactions": data_quality.historical_transactions,
                "graph_connected_entities": data_quality.graph_connected_entities,
            },
            "model_version": meta["model_version"],
            "feature_version": meta["feature_version"],
            "policy_version": policy_ver,
            "evaluated_at": evaluated_at,
            "request_id": req_id,
            "latency_ms": elapsed_ms,
        }

        # 7. Save Idempotency Cache if key provided
        if idempotency_key:
            state_store.save_idempotency_result(
                merchant_id=merchant_id,
                idempotency_key=idempotency_key,
                transaction_id=canonical_tx.transaction_id,
                response_dict=response_payload,
            )

        return response_payload

    @v1.get("/risk/{transaction_id}", status_code=status.HTTP_200_OK)
    async def get_evaluated_risk(
        transaction_id: str,
        x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
        authorization: Optional[str] = Header(None, alias="Authorization"),
    ):
        """Retrieves a previously evaluated transaction record for the authenticated merchant."""
        merchant_id = authenticate_merchant(x_api_key=x_api_key, authorization=authorization)
        record = state_store.get_transaction(merchant_id, transaction_id)
        if not record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "error": True,
                    "code": "TRANSACTION_NOT_FOUND",
                    "message": f"Transaction '{transaction_id}' not found for merchant '{merchant_id}'.",
                },
            )
        return {
            "transaction_id": record["transaction_id"],
            "merchant_id": record["merchant_id"],
            "user_id": record["user_id"],
            "amount": record["amount"],
            "currency": record["currency"],
            "timestamp": record["timestamp"],
            "risk_score": record["risk_score"],
            "decision": record["decision"],
            "evaluated_at": record["evaluated_at"],
        }

    @v1.post("/events", status_code=status.HTTP_200_OK)
    async def record_lifecycle_event(
        payload: MerchantEventPayload,
        x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
        authorization: Optional[str] = Header(None, alias="Authorization"),
    ):
        """Records asynchronous merchant transaction lifecycle events (e.g. completed, cancelled, refunded)."""
        merchant_id = authenticate_merchant(x_api_key=x_api_key, authorization=authorization)
        state_store.record_merchant_event(merchant_id, payload)
        return {
            "status": "recorded",
            "merchant_id": merchant_id,
            "event_id": payload.event_id,
            "event_type": payload.event_type,
            "transaction_id": payload.transaction_id,
        }

    @v1.post("/outcomes", status_code=status.HTTP_200_OK)
    async def record_transaction_outcome(
        payload: OutcomePayload,
        x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
        authorization: Optional[str] = Header(None, alias="Authorization"),
    ):
        """
        Records merchant chargeback or fraud outcome feedback.
        NOTE: Does NOT trigger automated online model retraining.
        """
        merchant_id = authenticate_merchant(x_api_key=x_api_key, authorization=authorization)
        state_store.record_outcome(merchant_id, payload)
        return {
            "status": "recorded",
            "merchant_id": merchant_id,
            "transaction_id": payload.transaction_id,
            "outcome": payload.outcome,
            "timestamp": payload.timestamp,
        }

    @v1.get("/merchant/config", response_model=MerchantConfigResponse, status_code=status.HTTP_200_OK)
    async def get_merchant_config(
        x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
        authorization: Optional[str] = Header(None, alias="Authorization"),
    ):
        """Returns safe integration configuration and required transaction fields."""
        merchant_id = authenticate_merchant(x_api_key=x_api_key, authorization=authorization)
        meta = decision_engine.model_service.metadata
        return MerchantConfigResponse(
            merchant_id=merchant_id,
            api_version="v1",
            model_name=meta["model_name"],
            model_type=meta["model_type"],
            model_version=meta["model_version"],
            feature_version=meta["feature_version"],
            policy_version=decision_engine.policy.policy_version,
            threshold=0.90,
            supported_event_types=[
                "transaction.created",
                "transaction.completed",
                "transaction.cancelled",
                "transaction.refunded",
                "transaction.chargeback",
            ],
            required_fields=[
                "transaction_id",
                "user_id",
                "amount",
                "currency",
                "timestamp",
            ],
            environment=config.app_env,
        )

    @v1.get("/merchant/health", response_model=MerchantHealthResponse, status_code=status.HTTP_200_OK)
    async def get_merchant_health(
        x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
        authorization: Optional[str] = Header(None, alias="Authorization"),
    ):
        """Returns live merchant integration health and runtime state status."""
        merchant_id = authenticate_merchant(x_api_key=x_api_key, authorization=authorization)
        last_event = state_store.get_last_processed_timestamp(merchant_id)
        now_str = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")

        return MerchantHealthResponse(
            status="ok",
            merchant_id=merchant_id,
            integration_status="connected",
            model_status="ready" if decision_engine and decision_engine.model_service.model else "degraded",
            state_store_status="ready",
            last_processed_event=last_event,
            environment=config.app_env,
            timestamp=now_str,
        )

    return v1
