# Phase 10 — Backend Clean-Environment Reproducibility Audit

**Project**: Abuse-Ring Sentinel  
**Track**: Razorpay Buildathon — Track 02: AI Risk Manager  
**Audit Date**: August 23, 2026  
**Auditor**: Lead Backend Engineer

---

## 1. Environment & Dependency Specifications

- **Python Runtime**: Python 3.10+ (Verified on Python 3.14.0 Windows AMD64)
- **Dependency Manifest**: `requirements.txt`
  - Core: `numpy`, `pandas`, `pyarrow`, `networkx`, `scikit-learn`, `joblib`, `pydantic`
  - Serving: `fastapi`, `uvicorn[standard]`, `httpx`
  - Testing: `pytest`

---

## 2. API Endpoints & Contract Verification

| Endpoint | Method | Response Code | Verified Behavior |
| :--- | :--- | :--- | :--- |
| `/health` | `GET` | `200 OK` | Returns `status: "ok"`, `model_name`, `model_type`, `model_version`, `feature_version`, `policy_version`, `environment`. |
| `/metrics/summary` | `GET` | `200 OK` | Returns live request counters, approval/review/block counts, and latency percentiles. |
| `/predict` | `POST` | `200 OK` | Evaluates 33 features against `model_f.joblib`, returns risk score, decision, ranked reasons, evidence, and `request_id`. |
| `/predict` (Forbidden GT) | `POST` | `422 Unprocessable` | Rejects `is_abuse_ring`, `ring_id`, etc. with structured validation error. |
| `/predict` (Malformed) | `POST` | `422 Unprocessable` | Rejects missing features, invalid strings, NaN/Inf, and negative amounts. |
| `/predict` (Rate Limit) | `POST` | `429 Too Many` | Returns 429 when client IP exceeds 120 req/min. |
| `/health` (Missing Model) | `GET` | `503 Unavailable` | Returns `status: "degraded"` safely with zero fallback/fake score generation. |

---

## 3. Error Sanitization Verification

All error responses strictly follow the standard schema:
```json
{
  "error": true,
  "code": "VALIDATION_ERROR",
  "message": "Invalid prediction request payload.",
  "details": ["..."],
  "request_id": "7e703482-3009-4326-8dd7-27cef547d63e"
}
```
Zero Python tracebacks, internal filesystem paths, or secrets are exposed.

---

## 4. Verdict

### **VERDICT: PASS (BACKEND REPRODUCIBILITY VERIFIED)**
