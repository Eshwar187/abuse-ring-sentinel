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
from src.auth.schemas import (
    SignupRequest,
    SignupResponse,
    LoginRequest,
    LoginResponse,
    UserSessionResponse,
    RotateKeyResponse,
    MerchantTransactionItem,
    MerchantTransactionsResponse,
    MerchantMetricsResponse,
    MerchantEntityGraphResponse,
)
from src.actions.schemas import (
    ActionType,
    ActionStatus,
    RiskActionRequest,
    MerchantActionResponse,
    MerchantIntegrationConfig,
    MerchantIntegrationUpdateRequest,
    ActionTestRequest,
    ActionTestResponse,
)
from src.actions.action_service import ActionExecutionService
from src.integration.normalizer import EventNormalizer
from src.integration.feature_adapter import FeatureAdapter
from src.audit.logger import AuditLogger
from src.config import config
from src.admin.schemas import (
    AdminLoginRequest,
    AdminLoginResponse,
    AdminMerchantItem,
    AdminMerchantsResponse,
    AdminToggleMerchantRequest,
    AdminPolicyConfig,
    AdminUpdatePolicyRequest,
    MaintenanceConfig,
    UpdateMaintenanceRequest,
    AdminSystemStatusResponse,
    AdminEmergencyActionRequest,
    AdminEmergencyActionResponse,
)
from src.admin.admin_service import AdminService


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
    state_store: Optional[RuntimeStateStore] = None,
) -> str:
    """
    Authenticates incoming merchant requests using X-API-Key or Bearer token/session.
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
                "message": "Missing merchant credentials. Provide via 'X-API-Key' or 'Authorization: Bearer <key_or_token>'.",
            },
        )

    # 1. Fast-path constant-time lookup in registered test keys
    for registered_key, merchant_id in API_KEY_REGISTRY.items():
        if hmac.compare_digest(token, registered_key):
            return merchant_id

    # 2. Dynamic lookup in state_store (API keys or browser sessions)
    if state_store is not None:
        db_merchant_id = state_store.validate_api_key(token)
        if db_merchant_id:
            return db_merchant_id

        session = state_store.get_session(token)
        if session:
            return session["merchant_id"]

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail={
            "error": True,
            "code": "INVALID_API_KEY",
            "message": "Invalid merchant API key or session token provided.",
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
    action_service = ActionExecutionService(state_store=state_store, environment=config.environment)
    admin_service = AdminService(state_store=state_store, decision_engine=decision_engine)

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
        triggers outbound merchant action execution if configured, and logs audit records.
        """
        if admin_service.is_request_blocked_by_maintenance(is_admin=False):
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail={
                    "error": True,
                    "code": "MAINTENANCE_MODE_ACTIVE",
                    "message": "Engine is in maintenance mode. Risk inference is temporarily held.",
                    "estimated_end_time": admin_service.maintenance.estimated_end_time,
                },
            )

        merchant_id = authenticate_merchant(x_api_key=x_api_key, authorization=authorization, state_store=state_store)
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
        nonlocal decision_engine
        if decision_engine is None or decision_engine.model_service.model is None:
            try:
                from src.config import config
                decision_engine = RiskDecisionEngine(model_path=config.model_path)
            except Exception:
                pass

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

        # 6. Outbound Merchant Action Execution
        reason_codes_list = [r["code"] for r in decision_result.get("reason_codes", [])]
        action_resp = await action_service.execute_action_for_evaluation(
            merchant_id=merchant_id,
            transaction_id=canonical_tx.transaction_id,
            decision=decision_result["decision"],
            risk_score=decision_result["risk_score"],
            risk_level=decision_result["risk_level"],
            reason_codes=reason_codes_list,
        )

        # 7. Append-only Structured Audit Logging
        decision_payload_for_audit = {
            "transaction_id": canonical_tx.transaction_id,
            "risk_score": decision_result["risk_score"],
            "risk_level": decision_result["risk_level"],
            "decision": decision_result["decision"],
            "reason_codes": decision_result["reason_codes"],
            "merchant_action": action_resp.model_dump(),
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
            "merchant_action": action_resp.model_dump(),
        }

        # 8. Save Idempotency Cache if key provided
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
        merchant_id = authenticate_merchant(x_api_key=x_api_key, authorization=authorization, state_store=state_store)
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
        merchant_id = authenticate_merchant(x_api_key=x_api_key, authorization=authorization, state_store=state_store)
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
        merchant_id = authenticate_merchant(x_api_key=x_api_key, authorization=authorization, state_store=state_store)
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
        merchant_id = authenticate_merchant(x_api_key=x_api_key, authorization=authorization, state_store=state_store)
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
        merchant_id = authenticate_merchant(x_api_key=x_api_key, authorization=authorization, state_store=state_store)
        last_event = state_store.get_last_processed_timestamp(merchant_id)
        now_str = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

        return MerchantHealthResponse(
            status="ok",
            merchant_id=merchant_id,
            integration_status="connected",
            model_status="ready" if decision_engine and decision_engine.model_service.model else "degraded",
            state_store_status="ready",
            database=state_store.get_database_summary(),
            last_processed_event=last_event,
            environment=config.app_env,
            timestamp=now_str,
        )

    # -------------------------------------------------------------------------
    # Authentication & Session Endpoints
    # -------------------------------------------------------------------------
    @v1.post("/auth/signup", response_model=SignupResponse, status_code=status.HTTP_201_CREATED)
    async def signup_merchant(payload: SignupRequest):
        """Creates a new merchant account, admin user, and initial API key."""
        from src.auth.security import hash_password

        if admin_service.is_request_blocked_by_maintenance(is_admin=False):
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail={
                    "error": True,
                    "code": "MAINTENANCE_MODE_ACTIVE",
                    "message": "VigilAI is currently under scheduled core engine maintenance. Merchant registration is temporarily paused.",
                    "estimated_end_time": admin_service.maintenance.estimated_end_time,
                },
            )

        existing = state_store.get_user_by_email(payload.email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "error": True,
                    "code": "EMAIL_ALREADY_EXISTS",
                    "message": "An account with this email already exists.",
                },
            )

        pwd_hash, pwd_salt = hash_password(payload.password)
        merchant_id, user_id, raw_api_key, key_prefix = state_store.create_merchant_user(
            company_name=payload.company_name,
            full_name=payload.full_name,
            email=payload.email.lower(),
            password_hash=pwd_hash,
            password_salt=pwd_salt,
        )

        session_token = state_store.create_session(user_id=user_id, merchant_id=merchant_id)
        now_str = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

        return SignupResponse(
            merchant_id=merchant_id,
            user_id=user_id,
            full_name=payload.full_name,
            email=payload.email.lower(),
            company_name=payload.company_name,
            api_key=raw_api_key,
            session_token=session_token,
            created_at=now_str,
        )

    @v1.post("/auth/login", response_model=LoginResponse, status_code=status.HTTP_200_OK)
    async def login_merchant(payload: LoginRequest):
        """Authenticates merchant user and returns active session token."""
        from src.auth.security import verify_password

        if admin_service.is_request_blocked_by_maintenance(is_admin=False):
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail={
                    "error": True,
                    "code": "MAINTENANCE_MODE_ACTIVE",
                    "message": "VigilAI is currently under scheduled core engine maintenance. Merchant login is temporarily disabled to prevent data inconsistency.",
                    "estimated_end_time": admin_service.maintenance.estimated_end_time,
                },
            )

        user = state_store.get_user_by_email(payload.email)
        if not user or not verify_password(payload.password, user["password_hash"], user["password_salt"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={
                    "error": True,
                    "code": "INVALID_CREDENTIALS",
                    "message": "Invalid email or password provided.",
                },
            )

        merchant = state_store.get_merchant_by_id(user["merchant_id"])
        company_name = merchant["company_name"] if merchant else "Merchant"
        session_token = state_store.create_session(user_id=user["user_id"], merchant_id=user["merchant_id"])
        api_key_masked = state_store.get_active_api_key_prefix(user["merchant_id"])

        return LoginResponse(
            merchant_id=user["merchant_id"],
            user_id=user["user_id"],
            full_name=user["full_name"],
            email=user["email"],
            company_name=company_name,
            session_token=session_token,
            api_key_masked=api_key_masked,
        )

    @v1.get("/auth/me", response_model=UserSessionResponse, status_code=status.HTTP_200_OK)
    async def get_current_user(
        authorization: Optional[str] = Header(None, alias="Authorization"),
        x_session_token: Optional[str] = Header(None, alias="X-Session-Token"),
    ):
        """Returns the authenticated user and merchant context."""
        token = None
        if x_session_token:
            token = x_session_token.strip()
        elif authorization and authorization.startswith("Bearer "):
            token = authorization[7:].strip()

        session = state_store.get_session(token) if token else None
        if not session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"error": True, "code": "UNAUTHORIZED", "message": "Invalid or expired session token."},
            )

        return UserSessionResponse(
            user_id=session["user_id"],
            merchant_id=session["merchant_id"],
            full_name=session["full_name"],
            email=session["email"],
            company_name=session["company_name"],
            api_key_masked=state_store.get_active_api_key_prefix(session["merchant_id"]),
        )

    @v1.post("/auth/rotate-key", response_model=RotateKeyResponse, status_code=status.HTTP_200_OK)
    async def rotate_merchant_api_key(
        x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
        authorization: Optional[str] = Header(None, alias="Authorization"),
    ):
        """Rotates the merchant's API key. The new key is returned once."""
        merchant_id = authenticate_merchant(x_api_key=x_api_key, authorization=authorization, state_store=state_store)
        new_raw_key, new_prefix, created_at = state_store.rotate_api_key(merchant_id)
        return RotateKeyResponse(
            new_api_key=new_raw_key,
            key_prefix=new_prefix,
            created_at=created_at,
        )

    # -------------------------------------------------------------------------
    # Live Merchant Data Query Endpoints (for Live Dashboard & UI)
    # -------------------------------------------------------------------------
    @v1.get("/merchant/transactions", response_model=MerchantTransactionsResponse, status_code=status.HTTP_200_OK)
    async def list_merchant_transactions(
        search: Optional[str] = None,
        risk_level: Optional[str] = None,
        decision: Optional[str] = None,
        page: int = 1,
        page_size: int = 50,
        x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
        authorization: Optional[str] = Header(None, alias="Authorization"),
    ):
        """Returns paginated, searchable runtime transactions evaluated for this merchant."""
        merchant_id = authenticate_merchant(x_api_key=x_api_key, authorization=authorization, state_store=state_store)
        offset = max(0, (page - 1) * page_size)
        tx_rows, total_count = state_store.get_merchant_transactions(
            merchant_id=merchant_id,
            search=search,
            risk_level=risk_level,
            decision=decision,
            limit=page_size,
            offset=offset,
        )

        formatted_items = [
            MerchantTransactionItem(
                transaction_id=r["transaction_id"],
                user_id=r["user_id"],
                amount=float(r["amount"]),
                currency=r["currency"],
                timestamp=r["timestamp"],
                product_category=r.get("product_category"),
                device_id=r.get("device_id"),
                ip_address=r.get("ip_address"),
                payment_method_id=r.get("payment_method_id"),
                risk_score=r.get("risk_score"),
                risk_level=r.get("risk_level"),
                decision=r.get("decision"),
                primary_reason=r.get("decision"),
                is_promo_used=r.get("is_promo_used", 0),
                evaluated_at=r.get("evaluated_at"),
            )
            for r in tx_rows
        ]

        return MerchantTransactionsResponse(
            merchant_id=merchant_id,
            total_count=total_count,
            page=page,
            page_size=page_size,
            transactions=formatted_items,
            zero_data_state=total_count == 0,
        )

    @v1.get("/merchant/metrics", response_model=MerchantMetricsResponse, status_code=status.HTTP_200_OK)
    async def get_merchant_metrics(
        x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
        authorization: Optional[str] = Header(None, alias="Authorization"),
    ):
        """Returns live operational metrics computed from the merchant's real evaluations."""
        merchant_id = authenticate_merchant(x_api_key=x_api_key, authorization=authorization, state_store=state_store)
        metrics = state_store.get_merchant_live_metrics(merchant_id)

        recent_items = [
            MerchantTransactionItem(
                transaction_id=r["transaction_id"],
                user_id=r["user_id"],
                amount=float(r["amount"]),
                currency=r["currency"],
                timestamp=r["timestamp"],
                product_category=r.get("product_category"),
                risk_score=r.get("risk_score"),
                risk_level=r.get("risk_level"),
                decision=r.get("decision"),
                is_promo_used=r.get("is_promo_used", 0),
                evaluated_at=r.get("evaluated_at"),
            )
            for r in metrics["recent_transactions"]
        ]

        return MerchantMetricsResponse(
            merchant_id=metrics["merchant_id"],
            total_transactions=metrics["total_transactions"],
            approvals=metrics["approvals"],
            reviews=metrics["reviews"],
            blocks=metrics["blocks"],
            approval_rate=metrics["approval_rate"],
            review_rate=metrics["review_rate"],
            block_rate=metrics["block_rate"],
            average_risk_score=metrics["average_risk_score"],
            recent_transactions=recent_items,
            zero_data_state=metrics["zero_data_state"],
            last_evaluated_at=metrics["last_evaluated_at"],
        )

    @v1.get("/merchant/graph", response_model=MerchantEntityGraphResponse, status_code=status.HTTP_200_OK)
    async def get_merchant_entity_graph_data(
        x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
        authorization: Optional[str] = Header(None, alias="Authorization"),
    ):
        """Returns live Cytoscape-formatted entity graph for the merchant's runtime network."""
        merchant_id = authenticate_merchant(x_api_key=x_api_key, authorization=authorization, state_store=state_store)
        graph_data = state_store.get_merchant_entity_graph(merchant_id)
        return MerchantEntityGraphResponse(
            merchant_id=graph_data["merchant_id"],
            nodes=graph_data["nodes"],
            edges=graph_data["edges"],
            total_nodes=graph_data["total_nodes"],
            total_edges=graph_data["total_edges"],
            zero_data_state=graph_data["zero_data_state"],
        )

    # -------------------------------------------------------------------------
    # Outbound Action Execution & Integration Settings Endpoints
    # -------------------------------------------------------------------------
    @v1.get("/merchant/integration", response_model=MerchantIntegrationConfig, status_code=status.HTTP_200_OK)
    async def get_merchant_integration_settings(
        x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
        authorization: Optional[str] = Header(None, alias="Authorization"),
    ):
        """Retrieves merchant outbound webhook integration settings with masked credentials."""
        merchant_id = authenticate_merchant(x_api_key=x_api_key, authorization=authorization, state_store=state_store)
        cfg = state_store.get_merchant_integration(merchant_id)
        return MerchantIntegrationConfig(**cfg)

    @v1.put("/merchant/integration", response_model=MerchantIntegrationConfig, status_code=status.HTTP_200_OK)
    async def update_merchant_integration_settings(
        payload: MerchantIntegrationUpdateRequest,
        x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
        authorization: Optional[str] = Header(None, alias="Authorization"),
    ):
        """Updates merchant outbound webhook integration settings."""
        merchant_id = authenticate_merchant(x_api_key=x_api_key, authorization=authorization, state_store=state_store)
        state_store.save_merchant_integration(
            merchant_id=merchant_id,
            action_endpoint_url=payload.action_endpoint_url,
            auth_token=payload.auth_token,
            webhook_secret=payload.webhook_secret,
            timeout_seconds=payload.timeout_seconds or 3.0,
            max_retries=payload.max_retries if payload.max_retries is not None else 2,
            is_active=payload.is_active if payload.is_active is not None else True,
        )
        updated = state_store.get_merchant_integration(merchant_id)
        return MerchantIntegrationConfig(**updated)

    @v1.post("/merchant/action-endpoint/test", response_model=ActionTestResponse, status_code=status.HTTP_200_OK)
    async def test_action_endpoint_connectivity(
        payload: Optional[ActionTestRequest] = None,
        x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
        authorization: Optional[str] = Header(None, alias="Authorization"),
    ):
        """Executes a real outbound HTTP connectivity probe against the merchant endpoint."""
        merchant_id = authenticate_merchant(x_api_key=x_api_key, authorization=authorization, state_store=state_store)
        override_url = payload.endpoint_url if payload else None
        override_token = payload.auth_token if payload else None
        override_secret = payload.webhook_secret if payload else None

        test_result = await action_service.test_merchant_connection(
            merchant_id=merchant_id,
            endpoint_url=override_url,
            auth_token=override_token,
            webhook_secret=override_secret,
        )
        return test_result

    @v1.post("/actions/{transaction_id}", response_model=MerchantActionResponse, status_code=status.HTTP_200_OK)
    async def execute_manual_action(
        transaction_id: str,
        x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
        authorization: Optional[str] = Header(None, alias="Authorization"),
    ):
        """Manually triggers action execution for a previously evaluated transaction."""
        merchant_id = authenticate_merchant(x_api_key=x_api_key, authorization=authorization, state_store=state_store)
        tx = state_store.get_transaction(merchant_id, transaction_id)
        if not tx:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"error": True, "code": "TRANSACTION_NOT_FOUND", "message": f"Transaction '{transaction_id}' not found."},
            )

        resp = await action_service.execute_action_for_evaluation(
            merchant_id=merchant_id,
            transaction_id=transaction_id,
            decision=tx.get("decision", "APPROVE"),
            risk_score=float(tx.get("risk_score", 0.0)),
            risk_level="HIGH" if float(tx.get("risk_score", 0.0)) >= 0.90 else "LOW",
            force_retry=False,
        )
        return resp

    @v1.post("/actions/{transaction_id}/retry", response_model=MerchantActionResponse, status_code=status.HTTP_200_OK)
    async def retry_failed_action(
        transaction_id: str,
        x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
        authorization: Optional[str] = Header(None, alias="Authorization"),
    ):
        """Forces a retry attempt for an action, bypassing idempotent cache."""
        merchant_id = authenticate_merchant(x_api_key=x_api_key, authorization=authorization, state_store=state_store)
        tx = state_store.get_transaction(merchant_id, transaction_id)
        if not tx:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"error": True, "code": "TRANSACTION_NOT_FOUND", "message": f"Transaction '{transaction_id}' not found."},
            )

        resp = await action_service.execute_action_for_evaluation(
            merchant_id=merchant_id,
            transaction_id=transaction_id,
            decision=tx.get("decision", "APPROVE"),
            risk_score=float(tx.get("risk_score", 0.0)),
            risk_level="HIGH" if float(tx.get("risk_score", 0.0)) >= 0.90 else "LOW",
            force_retry=True,
        )
        return resp

    @v1.get("/actions/{transaction_id}", response_model=MerchantActionResponse, status_code=status.HTTP_200_OK)
    async def get_transaction_action(
        transaction_id: str,
        x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
        authorization: Optional[str] = Header(None, alias="Authorization"),
    ):
        """Retrieves latest action execution status for a specific transaction."""
        merchant_id = authenticate_merchant(x_api_key=x_api_key, authorization=authorization, state_store=state_store)
        rec = state_store.get_action_by_tx(merchant_id, transaction_id)
        if not rec:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"error": True, "code": "ACTION_NOT_FOUND", "message": f"No action record found for transaction '{transaction_id}'."},
            )

        return MerchantActionResponse(
            request_id=rec["action_id"],
            transaction_id=rec["transaction_id"],
            action=ActionType(rec["action"]),
            status=ActionStatus(rec["status"]),
            merchant_reference=rec.get("merchant_reference"),
            merchant_message=rec.get("merchant_message"),
            http_status=rec.get("http_status"),
            latency_ms=rec.get("latency_ms"),
            attempt_number=rec.get("attempt_number", 1),
            executed_at=rec.get("completed_at"),
        )

    @v1.get("/actions", status_code=status.HTTP_200_OK)
    async def list_merchant_actions(
        status_filter: Optional[str] = None,
        page: int = 1,
        page_size: int = 50,
        x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
        authorization: Optional[str] = Header(None, alias="Authorization"),
    ):
        """Lists historical merchant action audit records."""
        merchant_id = authenticate_merchant(x_api_key=x_api_key, authorization=authorization, state_store=state_store)
        offset = max(0, (page - 1) * page_size)
        actions, total_count = state_store.get_merchant_actions(
            merchant_id=merchant_id,
            status=status_filter,
            limit=page_size,
            offset=offset,
        )
        return {
            "merchant_id": merchant_id,
            "total_count": total_count,
            "page": page,
            "page_size": page_size,
            "actions": actions,
        }

    # -------------------------------------------------------------------------
    # Central SuperAdmin & Maintenance Operations (/api/v1/admin/*)
    # -------------------------------------------------------------------------

    def authenticate_superadmin(
        authorization: Optional[str] = Header(None, alias="Authorization"),
        x_admin_token: Optional[str] = Header(None, alias="X-Admin-Token"),
    ) -> Dict[str, Any]:
        """Authenticates SuperAdmin requests using Bearer or X-Admin-Token."""
        token = None
        if x_admin_token:
            token = x_admin_token.strip()
        elif authorization and authorization.startswith("Bearer "):
            token = authorization[7:].strip()

        session = admin_service.validate_admin_token(token) if token else None
        if not session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"error": True, "code": "ADMIN_UNAUTHORIZED", "message": "SuperAdmin authentication required. Access denied."},
            )
        return session

    @v1.post("/admin/login", response_model=AdminLoginResponse, status_code=status.HTTP_200_OK)
    async def admin_login(payload: AdminLoginRequest):
        """Authenticates SuperAdmin with credentials (eshwar187 / Eshu@2005)."""
        auth_resp = admin_service.authenticate_admin(payload.username, payload.password)
        if not auth_resp:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"error": True, "code": "INVALID_ADMIN_CREDENTIALS", "message": "Invalid SuperAdmin username or password."},
            )
        return auth_resp

    @v1.get("/admin/me", status_code=status.HTTP_200_OK)
    async def get_admin_session_info(
        authorization: Optional[str] = Header(None, alias="Authorization"),
        x_admin_token: Optional[str] = Header(None, alias="X-Admin-Token"),
    ):
        """Returns the active SuperAdmin session metadata."""
        session = authenticate_superadmin(authorization, x_admin_token)
        return session

    @v1.get("/admin/system/status", response_model=AdminSystemStatusResponse, status_code=status.HTTP_200_OK)
    async def get_admin_system_status(
        authorization: Optional[str] = Header(None, alias="Authorization"),
        x_admin_token: Optional[str] = Header(None, alias="X-Admin-Token"),
    ):
        """Returns comprehensive system telemetry, database health, and model performance."""
        authenticate_superadmin(authorization, x_admin_token)
        return admin_service.get_system_status()

    @v1.get("/admin/merchants", response_model=AdminMerchantsResponse, status_code=status.HTTP_200_OK)
    async def list_all_merchants_admin(
        authorization: Optional[str] = Header(None, alias="Authorization"),
        x_admin_token: Optional[str] = Header(None, alias="X-Admin-Token"),
    ):
        """Lists all registered merchants with volume, fraud block rates, and status."""
        authenticate_superadmin(authorization, x_admin_token)
        return admin_service.list_all_merchants()

    @v1.post("/admin/merchants/{merchant_id}/toggle-status", status_code=status.HTTP_200_OK)
    async def toggle_merchant_status_admin(
        merchant_id: str,
        payload: Optional[AdminToggleMerchantRequest] = None,
        authorization: Optional[str] = Header(None, alias="Authorization"),
        x_admin_token: Optional[str] = Header(None, alias="X-Admin-Token"),
    ):
        """Toggles or updates a merchant's status (ACTIVE / SUSPENDED)."""
        authenticate_superadmin(authorization, x_admin_token)
        target = payload.status if payload else None
        return admin_service.toggle_merchant_status(merchant_id, target)

    @v1.post("/admin/merchants/{merchant_id}/rotate-key", status_code=status.HTTP_200_OK)
    async def rotate_merchant_key_admin(
        merchant_id: str,
        authorization: Optional[str] = Header(None, alias="Authorization"),
        x_admin_token: Optional[str] = Header(None, alias="X-Admin-Token"),
    ):
        """Forces an administrative API key rotation for a merchant."""
        authenticate_superadmin(authorization, x_admin_token)
        return admin_service.rotate_merchant_key(merchant_id)

    @v1.delete("/admin/merchants/{merchant_id}", status_code=status.HTTP_200_OK)
    async def delete_merchant_admin(
        merchant_id: str,
        authorization: Optional[str] = Header(None, alias="Authorization"),
        x_admin_token: Optional[str] = Header(None, alias="X-Admin-Token"),
    ):
        """Permanently purges a merchant, all their users, credentials, and transactions."""
        authenticate_superadmin(authorization, x_admin_token)
        return admin_service.delete_merchant(merchant_id)

    @v1.get("/admin/model/config", response_model=AdminPolicyConfig, status_code=status.HTTP_200_OK)
    async def get_admin_model_config(
        authorization: Optional[str] = Header(None, alias="Authorization"),
        x_admin_token: Optional[str] = Header(None, alias="X-Admin-Token"),
    ):
        """Returns the active decision policy thresholds and model metadata."""
        authenticate_superadmin(authorization, x_admin_token)
        return admin_service.get_policy_config()

    @v1.post("/admin/model/config", response_model=AdminPolicyConfig, status_code=status.HTTP_200_OK)
    async def update_admin_model_config(
        payload: AdminUpdatePolicyRequest,
        authorization: Optional[str] = Header(None, alias="Authorization"),
        x_admin_token: Optional[str] = Header(None, alias="X-Admin-Token"),
    ):
        """Updates decision thresholds and sensitivity configuration in real time."""
        authenticate_superadmin(authorization, x_admin_token)
        return admin_service.update_policy_config(
            block_threshold=payload.block_threshold,
            review_threshold=payload.review_threshold,
            sensitivity_preset=payload.sensitivity_preset,
            rate_limit_per_minute=payload.rate_limit_per_minute,
        )

    @v1.post("/admin/model/reload", status_code=status.HTTP_200_OK)
    async def reload_admin_model(
        authorization: Optional[str] = Header(None, alias="Authorization"),
        x_admin_token: Optional[str] = Header(None, alias="X-Admin-Token"),
    ):
        """Forces an in-memory reload and checkpoint refresh of Model F."""
        authenticate_superadmin(authorization, x_admin_token)
        return admin_service.reload_model_engine()

    @v1.get("/admin/maintenance", response_model=MaintenanceConfig, status_code=status.HTTP_200_OK)
    async def get_maintenance_status_endpoint():
        """Public and admin endpoint returning current maintenance mode state."""
        return admin_service.get_maintenance_status()

    @v1.post("/admin/maintenance", response_model=MaintenanceConfig, status_code=status.HTTP_200_OK)
    async def update_maintenance_status_endpoint(
        payload: UpdateMaintenanceRequest,
        authorization: Optional[str] = Header(None, alias="Authorization"),
        x_admin_token: Optional[str] = Header(None, alias="X-Admin-Token"),
    ):
        """Activates, deactivates, or modifies maintenance mode."""
        authenticate_superadmin(authorization, x_admin_token)
        return admin_service.update_maintenance_status(
            is_active=payload.is_active,
            title=payload.title,
            message=payload.message,
            maintenance_type=payload.maintenance_type,
            duration_minutes=payload.duration_minutes,
            affected_services=payload.affected_services,
        )

    @v1.post("/admin/emergency-action", response_model=AdminEmergencyActionResponse, status_code=status.HTTP_200_OK)
    async def trigger_emergency_action_endpoint(
        payload: AdminEmergencyActionRequest,
        authorization: Optional[str] = Header(None, alias="Authorization"),
        x_admin_token: Optional[str] = Header(None, alias="X-Admin-Token"),
    ):
        """Executes emergency circuit breakers (flush sessions, quarantine traffic, reload models)."""
        authenticate_superadmin(authorization, x_admin_token)
        return admin_service.trigger_emergency_action(payload.action, payload.reason)

    @v1.get("/admin/database/summary", status_code=status.HTTP_200_OK)
    async def get_admin_database_summary():
        """Developer and inspection endpoint returning actual MySQL table counts."""
        return state_store.get_database_summary()

    return v1

