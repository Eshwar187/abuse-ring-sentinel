"""
Production Hardened FastAPI Application for Abuse-Ring Sentinel.

Provides:
- GET  /health          -> System and model version health & availability check
- GET  /metrics/summary -> Live operational inference metrics and throughput
- POST /predict         -> Real-time risk evaluation with rate limiting, strict validation, and audit logging
"""

import os
import sys
import time
import uuid
import math
from typing import Dict, Any, List, Optional
from collections import defaultdict, deque
from pydantic import BaseModel, Field, field_validator
from fastapi import FastAPI, HTTPException, Request, Response, status
from fastapi.responses import JSONResponse, FileResponse
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.config import config
from src.decision.engine import RiskDecisionEngine
from src.audit.logger import AuditLogger
from src.features.groups import METADATA_COLUMNS, COMBINED_FEATURES
from src.state.state_store import RuntimeStateStore
from src.integration.normalizer import EventNormalizer
from src.integration.feature_adapter import FeatureAdapter
from api.v1.routes import create_v1_router

app = FastAPI(
    title="Abuse-Ring Sentinel Risk API",
    description="Defensive AI risk decision and explainability engine for coordinated merchant abuse detection.",
    version="1.0.0",
    docs_url="/docs" if not config.is_production else None,
    redoc_url="/redoc" if not config.is_production else None,
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# Global Singletons
try:
    decision_engine = RiskDecisionEngine(model_path=config.model_path)
    model_loaded = True
    model_load_error = None
except Exception as e:
    decision_engine = None
    model_loaded = False
    model_load_error = str(e)

audit_logger = AuditLogger(log_path=config.audit_log_path)
state_store = RuntimeStateStore()
event_normalizer = EventNormalizer()
feature_adapter = FeatureAdapter(state_store=state_store)

# Mount Merchant Risk API v1 Router
v1_router = create_v1_router(
    decision_engine=decision_engine,
    state_store=state_store,
    audit_logger=audit_logger,
    normalizer=event_normalizer,
    feature_adapter=feature_adapter,
)
app.include_router(v1_router)


# ---------------------------------------------------------------------------
# In-Memory Rate Limiter (Sliding Window per Client IP)
# ---------------------------------------------------------------------------
class RateLimiter:
    def __init__(self, requests_per_minute: int = 120):
        self.limit = requests_per_minute
        self.window = 60.0  # seconds
        self.client_records: Dict[str, deque] = defaultdict(deque)

    def is_allowed(self, client_ip: str) -> bool:
        if self.limit <= 0:
            return True
        now = time.time()
        timestamps = self.client_records[client_ip]
        while timestamps and (now - timestamps[0]) > self.window:
            timestamps.popleft()
        if len(timestamps) < self.limit:
            timestamps.append(now)
            return True
        return False


rate_limiter = RateLimiter(requests_per_minute=config.rate_limit_per_minute)


# ---------------------------------------------------------------------------
# Live Metrics & Observability Tracker
# ---------------------------------------------------------------------------
class MetricsTracker:
    def __init__(self):
        self.total_requests: int = 0
        self.approval_count: int = 0
        self.review_count: int = 0
        self.block_count: int = 0
        self.error_count: int = 0
        self.latencies: deque = deque(maxlen=500)

    def record_prediction(self, decision: str, latency_ms: float):
        self.total_requests += 1
        self.latencies.append(latency_ms)
        if decision == "APPROVE":
            self.approval_count += 1
        elif decision == "REVIEW":
            self.review_count += 1
        elif decision == "BLOCK":
            self.block_count += 1

    def record_error(self):
        self.total_requests += 1
        self.error_count += 1

    def get_summary(self) -> Dict[str, Any]:
        l_list = list(self.latencies)
        avg_lat = round(sum(l_list) / len(l_list), 2) if l_list else 0.0
        p95_lat = round(sorted(l_list)[int(len(l_list) * 0.95)], 2) if len(l_list) >= 20 else avg_lat
        return {
            "total_inference_requests": self.total_requests,
            "decision_breakdown": {
                "approvals": self.approval_count,
                "reviews": self.review_count,
                "blocks": self.block_count,
            },
            "error_count": self.error_count,
            "performance": {
                "avg_latency_ms": avg_lat,
                "p95_latency_ms": p95_lat,
                "sample_window_size": len(l_list),
            },
            "server_environment": config.app_env,
        }


metrics_tracker = MetricsTracker()


# ---------------------------------------------------------------------------
# Request & Response Schemas
# ---------------------------------------------------------------------------
class ReasonCodeItem(BaseModel):
    code: str
    message: str
    evidence: Dict[str, Any]


class PredictRequest(BaseModel):
    transaction_id: str = Field(..., min_length=1, max_length=64, description="Unique transaction ID")
    features: Dict[str, Any] = Field(..., description="Dictionary of 33 observable point-in-time features")

    @field_validator("transaction_id")
    def validate_tx_id(cls, v):
        v_str = str(v).strip()
        if not v_str:
            raise ValueError("transaction_id cannot be empty")
        return v_str

    @field_validator("features")
    def validate_features_payload(cls, v):
        if not isinstance(v, dict):
            raise ValueError("features must be a JSON dictionary")

        # 1. Reject forbidden ground-truth fields
        forbidden = [col for col in METADATA_COLUMNS if col in v and col not in ("transaction_id", "timestamp")]
        if forbidden:
            raise ValueError(f"Forbidden ground-truth or post-event fields detected: {forbidden}")

        # 2. Validate numeric cleanliness (no NaN, Infinity, negative amounts)
        for key, val in v.items():
            if isinstance(val, (int, float)):
                if math.isnan(val) or math.isinf(val):
                    raise ValueError(f"Invalid numeric value (NaN/Infinity) in feature '{key}'")
            elif isinstance(val, str):
                if len(val) > 128:
                    raise ValueError(f"Feature string '{key}' exceeds maximum permitted length (128 chars)")

        if "amount" in v:
            try:
                amt = float(v["amount"])
                if amt < 0.0 or amt > 1_000_000.0:
                    raise ValueError("Field 'amount' must be between 0.0 and 1,000,000.0")
            except (TypeError, ValueError):
                raise ValueError("Field 'amount' must be a valid positive float")

        return v


class PredictResponse(BaseModel):
    transaction_id: str
    risk_score: float = Field(..., ge=0.0, le=1.0, description="Continuous risk score in [0.0, 1.0]")
    risk_level: str = Field(..., description="LOW, MEDIUM, or HIGH")
    decision: str = Field(..., description="APPROVE, REVIEW, or BLOCK")
    reason_codes: List[ReasonCodeItem]
    evidence: Dict[str, Any]
    model_version: str
    feature_version: str
    policy_version: str
    evaluated_at: str
    request_id: str


# ---------------------------------------------------------------------------
# Structured Error Handlers
# ---------------------------------------------------------------------------
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    metrics_tracker.record_error()
    req_id = str(uuid.uuid4())
    errors = []
    for err in exc.errors():
        loc = " -> ".join(str(l) for l in err["loc"])
        msg = err["msg"]
        errors.append(f"{loc}: {msg}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": True,
            "code": "VALIDATION_ERROR",
            "message": "Invalid prediction request payload.",
            "details": errors,
            "request_id": req_id,
        },
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    metrics_tracker.record_error()
    req_id = str(uuid.uuid4())
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": True,
            "code": f"HTTP_{exc.status_code}",
            "message": str(exc.detail),
            "detail": str(exc.detail),
            "request_id": req_id,
        },
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    metrics_tracker.record_error()
    req_id = str(uuid.uuid4())
    # Log internal error safely on server without leaking traceback to client
    print(f"[INTERNAL_ERROR req_id={req_id}]: {exc}", file=sys.stderr)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": True,
            "code": "INTERNAL_SERVER_ERROR",
            "message": "An internal risk engine error occurred while processing the request.",
            "request_id": req_id,
        },
    )


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@app.get("/health", status_code=200)
def health_check():
    """Returns system status, readiness, and frozen model metadata."""
    if not model_loaded or decision_engine is None:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "degraded",
                "message": "Risk model artifact unavailable.",
                "error": model_load_error,
            },
        )

    meta = decision_engine.model_service.metadata
    return {
        "status": "ok",
        "model_name": meta["model_name"],
        "model_type": meta["model_type"],
        "model_version": meta["model_version"],
        "feature_version": meta["feature_version"],
        "policy_version": decision_engine.policy.policy_version,
        "environment": config.app_env,
    }


@app.get("/metrics/summary", status_code=200)
def get_metrics_summary():
    """Returns live operational inference telemetry and request distribution."""
    return metrics_tracker.get_summary()


@app.post("/predict", response_model=PredictResponse, status_code=200)
def predict_transaction_risk(payload: PredictRequest, request: Request = None):
    """
    Evaluates transaction risk against the frozen GBDT model, applies decision policy,
    generates reason codes, and records structured audit logs.
    """
    req_id = str(uuid.uuid4())
    start_time = time.time()

    # Rate Limiting Check
    client_ip = request.client.host if request and request.client else "127.0.0.1"
    if not rate_limiter.is_allowed(client_ip):
        metrics_tracker.record_error()
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Please throttle your evaluation requests.",
        )

    # Model Availability Guard
    if not model_loaded or decision_engine is None:
        metrics_tracker.record_error()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Risk Decision Engine is currently unavailable (model artifact unready).",
        )

    try:
        decision_result = decision_engine.evaluate_features(
            features=payload.features,
            transaction_id=payload.transaction_id,
        )
    except ValueError as e:
        metrics_tracker.record_error()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        metrics_tracker.record_error()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Inference processing failed.")

    latency_ms = (time.time() - start_time) * 1000.0
    metrics_tracker.record_prediction(decision_result["decision"], latency_ms)

    # Hardened Audit Logging with request_id and latency_ms
    audit_logger.log(decision_result, request_id=req_id, latency_ms=latency_ms)

    meta = decision_result["model_metadata"]
    return PredictResponse(
        transaction_id=decision_result["transaction_id"],
        risk_score=decision_result["risk_score"],
        risk_level=decision_result["risk_level"],
        decision=decision_result["decision"],
        reason_codes=[
            ReasonCodeItem(
                code=r["code"],
                message=r["message"],
                evidence=r["evidence"],
            )
            for r in decision_result["reason_codes"]
        ],
        evidence=decision_result["evidence"],
        model_version=meta["model_version"],
        feature_version=meta["feature_version"],
        policy_version=meta["policy_version"],
        evaluated_at=decision_result["evaluated_at"],
        request_id=req_id,
    )


# ---------------------------------------------------------------------------
# Static Single Page Application (SPA) Serving Fallback
# ---------------------------------------------------------------------------
dist_browser_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist", "frontend", "browser"))
if os.path.exists(dist_browser_path):
    app.mount("/assets", StaticFiles(directory=dist_browser_path), name="static")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = os.path.join(dist_browser_path, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        index_path = os.path.join(dist_browser_path, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
        return JSONResponse(status_code=404, content={"message": "Frontend not found"})
