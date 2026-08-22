"""
FastAPI Application for Abuse-Ring Sentinel.

Provides:
- GET  /health   -> System and model version health check
- POST /predict  -> Real-time transaction risk scoring and reason code explanation
"""

import os
import sys
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field, field_validator
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.responses import JSONResponse, FileResponse
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.decision.engine import RiskDecisionEngine
from src.audit.logger import AuditLogger
from src.features.groups import METADATA_COLUMNS

app = FastAPI(
    title="Abuse-Ring Sentinel Risk API",
    description="Defensive AI risk decision and explainability engine for coordinated merchant abuse detection.",
    version="1.0.0",
)

# Enable CORS for Angular frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global singletons
decision_engine = RiskDecisionEngine()
audit_logger = AuditLogger()


class ReasonCodeItem(BaseModel):
    code: str
    message: str
    evidence: Dict[str, Any]


class PredictRequest(BaseModel):
    transaction_id: str = Field(..., description="Unique merchant transaction ID")
    features: Dict[str, Any] = Field(..., description="Dictionary of 33 point-in-time features")

    @field_validator("features")
    def validate_features_no_ground_truth(cls, v):
        forbidden = [col for col in METADATA_COLUMNS if col in v and col not in ("transaction_id", "timestamp")]
        if forbidden:
            raise ValueError(f"Forbidden ground-truth or post-event fields detected: {forbidden}")
        return v


class PredictResponse(BaseModel):
    transaction_id: str
    risk_score: float = Field(..., description="Continuous model risk score in [0.0, 1.0]")
    risk_level: str = Field(..., description="LOW, MEDIUM, or HIGH")
    decision: str = Field(..., description="APPROVE, REVIEW, or BLOCK")
    reason_codes: List[ReasonCodeItem]
    evidence: Dict[str, Any]
    model_version: str
    feature_version: str
    policy_version: str
    evaluated_at: str


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Clean validation error response without leaking stack traces."""
    errors = []
    for err in exc.errors():
        loc = " -> ".join(str(l) for l in err["loc"])
        msg = err["msg"]
        errors.append(f"{loc}: {msg}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"status": "error", "error_type": "ValidationError", "details": errors},
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    """Clean internal error response."""
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"status": "error", "error_type": "InternalServerError", "message": str(exc)},
    )


@app.get("/health", status_code=200)
def health_check():
    """Returns system status and frozen model versions."""
    meta = decision_engine.model_service.metadata
    return {
        "status": "ok",
        "model_name": meta["model_name"],
        "model_type": meta["model_type"],
        "model_version": meta["model_version"],
        "feature_version": meta["feature_version"],
        "policy_version": decision_engine.policy.policy_version,
    }


@app.post("/predict", response_model=PredictResponse, status_code=200)
def predict_transaction_risk(payload: PredictRequest):
    """
    Evaluates transaction risk, applies decision policy, generates reason codes,
    and records audit logs.
    """
    try:
        decision_result = decision_engine.evaluate_features(
            features=payload.features,
            transaction_id=payload.transaction_id
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    # Audit logging
    audit_logger.log(decision_result)

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
                evidence=r["evidence"]
            )
            for r in decision_result["reason_codes"]
        ],
        evidence=decision_result["evidence"],
        model_version=meta["model_version"],
        feature_version=meta["feature_version"],
        policy_version=meta["policy_version"],
        evaluated_at=decision_result["evaluated_at"],
    )


# Serve built Angular frontend assets if dist directory exists
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

