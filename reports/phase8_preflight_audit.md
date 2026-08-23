# Phase 8 — Preflight Hardening Audit

**Project**: Abuse-Ring Sentinel  
**Track**: Razorpay Buildathon — Track 02: AI Risk Manager  
**Audit Date**: August 23, 2026  
**Auditor**: Production Hardening & Security Agent

---

## 1. Current Architecture Overview

```
[Angular 19 SPA] ──(HTTP/REST)──► [FastAPI Application] ──► [RiskDecisionEngine]
                                          │                         │
                                          ├──► [AuditLogger]        ├──► [TreeRiskModel (model_f.joblib)]
                                          └──► [Static SPA Mount]   └──► [TransactionExplainer]
```

---

## 2. Existing Security & Configuration Assessment

| Area | Current Implementation State | Production Risk / Gap | Required Hardening |
| :--- | :--- | :--- | :--- |
| **Configuration** | Hardcoded defaults in scripts and `api/main.py`. | No centralized environment configuration; hardcoded ports/paths. | Create `src/config.py` with typed pydantic/env-var settings (`APP_ENV`, `PORT`, `CORS_ORIGINS`, `RATE_LIMIT`, etc.). |
| **CORS Policy** | `allow_origins=["*"]` wildcard in `api/main.py`. | Overly permissive in production environments. | Enforce strict origin allowlist in production loaded from `CORS_ORIGINS`. |
| **Rate Limiting** | None. | Susceptible to DoS or burst traffic overload. | Implement in-memory token-bucket / sliding-window rate limiter with HTTP 429 and `Retry-After`. |
| **Request Validation** | Basic Pydantic fields; ground-truth validator present. | NaN, Infinity, negative amounts, oversized strings not strictly bounded. | Enforce finite floats, bounded numerics, string length limits, max payload size. |
| **Error Handling** | Generic exception handler with `str(exc)`. | Potential internal traceback/path leakage on unexpected errors. | Structured JSON error schema with `request_id`, standard error codes, sanitized messages. |
| **Observability** | Only `GET /health` with static metadata. | No live operational throughput or latency metrics. | Add `GET /metrics/summary` exposing live aggregated counters (requests, approvals, blocks, latencies). |
| **Model Availability** | Server loads model at startup. | If model file is corrupt/missing, predict raises uncaught 500. | Safe failure mode: return `503 Service Unavailable` with degraded health status, 0 fake scores. |
| **Audit Logging** | Logs `transaction_id`, `risk_score`, `decision`, `reason_codes`. | Lacks `request_id` correlation and execution `latency_ms`. | Add `request_id`, `latency_ms`, and PII sanitization filters. |
| **Frontend Production** | `environment.ts` hardcoded to `http://localhost:8000`. | Fails when deployed to remote origin without manual code changes. | Add production environment replacement in `angular.json` with relative/configurable API base URL. |
| **Deployment Packaging** | No Dockerfile or environment template. | Inconsistent deployment across cloud environments. | Create production `Dockerfile`, `.dockerignore`, and `.env.example`. |

---

## 3. Files to Be Created / Modified

### New Files:
- `src/config.py`: Centralized environment configuration.
- `.env.example`: Deployment environment variable template.
- `Dockerfile` & `.dockerignore`: Container deployment specification.
- `tests/test_phase8_security.py`: Security and production hardening regression tests.
- `reports/phase8_production_audit.md`: Final hardening audit report.
- `reports/phase8_production_results.json`: Machine-readable results.

### Modified Files:
- `api/main.py`: Integrate configuration, CORS allowlist, rate limiting, request bounds, structured error handling, observability metrics, model safety guards.
- `src/audit/logger.py`: Add `request_id` and `latency_ms` tracking, PII scrubbers.
- `frontend/src/environments/environment.prod.ts`: Set relative API base URL for deployment.
- `frontend/angular.json`: Enable environment file replacement for production builds.

### Protected / Untouched Files (Frozen Assets):
- `models/model_f.joblib` (FROZEN PRODUCTION MODEL)
- `data/processed/test_features.csv` (FROZEN HELD-OUT TEST DATASET)
- `data/processed/train_features.csv`
- `data/processed/validation_features.csv`
- `src/features/groups.py` (33-feature contract)
- `src/decision/policy.py` (Validation threshold $\tau^* = 0.90$)
