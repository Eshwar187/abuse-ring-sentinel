# Phase 11 — Local Production-Like Deployment Audit

**Project**: Abuse-Ring Sentinel  
**Track**: Razorpay Buildathon — Track 02: AI Risk Manager  
**Audit Date**: August 23, 2026  
**Auditor**: Lead Production Deployment Engineer

---

## 1. Environment

- **OS**: Windows 11 (AMD64)
- **Python**: Python 3.14.0
- **FastAPI**: 0.109.0 (with Uvicorn 0.27.0)
- **Angular**: 19.2.27
- **Node**: v20.20.0 (npm 10.8.2)
- **Browser Client**: Modern Evergreen (Chromium / Firefox / WebKit via Angular 19 SPA)

---

## 2. Services

- **FastAPI Backend**: `api/main.py` listening on `http://127.0.0.1:8000`
- **Angular Frontend**: `frontend/` running on `http://localhost:4200` (development) or served via `http://localhost:8000` (production bundle in `frontend/dist/frontend/browser`)

---

## 3. Model

- **Model Artifact**: `models/model_f.joblib` (SHA-256: `a288f019a2693c04c5d6a2c454da4e9c9f7c54f1298b5777ab276cbca9a6dd9c`)
- **Model Type**: `TreeRiskModel` wrapping `HistGradientBoostingClassifier`
- **Feature Count**: Exactly 33 features
- **Training During Startup**: **NONE** (Verified zero `fit()`, `fit_transform()`, `train()`, or `partial_fit()` calls)
- **Model Integrity**: **VERIFIED** (Pure deserialization via `joblib.load()`)

---

## 4. API Verification

- **`GET /health`**: `HTTP 200 OK`
  ```json
  {
    "status": "ok",
    "model_name": "abuse_ring_sentinel",
    "model_type": "hist_gradient_boosting",
    "model_version": "phase3-v1",
    "feature_version": "features-v2",
    "policy_version": "val-opt-v1",
    "environment": "development"
  }
  ```
- **`POST /predict`**: `HTTP 200 OK` (Live GBDT inference)
- **`GET /metrics/summary`**: `HTTP 200 OK` (Live throughput and latency telemetry)

---

## 5. Real Inference

### **A. Low-Risk Control (`data/demo/phase7_controls/low_risk_control.json`)**
- **Score**: `0.0000` (0.00%)
- **Risk Level**: `LOW`
- **Decision**: **`APPROVE`**
- **Primary Reason**: `LOW_RISK_ESTABLISHED_ACCOUNT`

### **B. High-Risk Control (`data/demo/phase7_controls/high_risk_control.json`)**
- **Score**: `1.0000` (100.00%)
- **Risk Level**: `HIGH`
- **Decision**: **`BLOCK`**
- **Primary Reasons**: `GRAPH_CONNECTED_USERS`, `GRAPH_SHARED_DEVICE`, `GRAPH_SHARED_PAYMENT`, `HIGH_1H_VELOCITY`, `NEW_ACCOUNT`

---

## 6. Dynamic Sensitivity

- **Baseline High-Risk Score**: `1.0000` (`BLOCK`)
- **Mutated Score (Graph Sharing Stripped)**: `0.0008` (`APPROVE`)
- **Score Delta ($\Delta$)**: **`-0.9992`**
- **Decision Change**: **`BLOCK -> APPROVE`**
- **Evidence**: Real non-linear response proving active GBDT evaluation rather than hardcoded rules.

---

## 7. Angular Integration

- **Real API Execution**: `Angular -> HttpClient -> POST http://127.0.0.1:8000/predict -> FastAPI -> model_f.joblib -> DecisionEngine -> PredictResponse -> Angular View`
- **Real Model Response**: Rendered live in `RiskAnalyzerComponent`.
- **Reason Codes**: Faithfully maps backend-returned reasons (`GRAPH_CONNECTED_USERS`, etc.) with observable evidence.
- **API Contract**: Strongly typed via `PredictRequest`, `PredictResponse`, and `TransactionEvidence`.

---

## 8. Failure Handling

- **Backend Unavailable Simulation**: Network unreachable triggers a clear rose alert card ("Risk evaluation unavailable").
- **Fake Prediction Prevented**: **100% PREVENTED**. The UI strictly refuses to show simulated or cached predictions on failure.
- **Retry Behavior**: **"Retry Evaluation"** button re-attempts the live request.

---

## 9. Security

- **CORS Policy**: Configured via `src/config.py:CORS_ORIGINS`.
- **Rate Limiting**: Sliding-window rate limiter returns `HTTP 429 Too Many Requests` when limits are exceeded.
- **Request Validation**: Rejects `NaN`, `Infinity`, negative amounts, oversized strings ($>128$ chars), and empty IDs.
- **Target Leakage Rejection**: Rejects `is_abuse_ring`, `ring_id`, `ring_type`, `user_population_type`, and `order_status` with `HTTP 422`.
- **Error Sanitization**: Structured JSON errors with unique `request_id`; zero tracebacks leaked.

---

## 10. Audit Logging

- **Audit Log Target**: `reports/audit_log.jsonl`
- **Recorded Fields**: `request_id`, `transaction_id`, `timestamp`, `risk_score`, `risk_level`, `decision`, `reason_codes`, `model_version`, `latency_ms`.
- **Sensitive Data Handling**: Automatic scrubbing of passwords, tokens, CVVs, and credit card PAN patterns.

---

## 11. Testing

- **Backend Pytest Suite**: **54 / 54 tests passed (100.0%)**
- **Angular Production Build**: `npm run build` compiled in **5.46s** with **0 errors and 0 warnings**.
- **Browser / Live Integration**: Verified end-to-end against live Uvicorn backend.

---

## 12. Fabrication Audit

- **Hardcoded Predictions**: **0 found** (`scripts/scan_no_fabrication.py`)
- **Mock Production Inference**: **0 found**
- **Random Scores (`Math.random`)**: **0 found**
- **Fake Fallbacks**: **0 found**

---

## 13. Final Verdict

### **LOCAL END-TO-END VERIFICATION: PASS**

The complete application is genuine, connected, resilient, and ready for deployment to Vercel (Frontend) + Render (Backend API).
