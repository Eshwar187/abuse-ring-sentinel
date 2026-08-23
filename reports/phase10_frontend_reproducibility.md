# Phase 10 — Frontend Reproducibility & Build Audit

**Project**: Abuse-Ring Sentinel  
**Track**: Razorpay Buildathon — Track 02: AI Risk Manager  
**Audit Date**: August 23, 2026  
**Auditor**: Lead Frontend Engineer

---

## 1. Frontend Environment & Build Specifications

- **Framework**: Angular 19 (Standalone architecture)
- **Node Runtime**: Node.js v20.20.0 / npm 10.8.2
- **Build Output**: `frontend/dist/frontend/browser`
- **Build Command**: `npm run build`
- **Build Duration**: 6.02 seconds
- **Compilation Errors**: **0 errors, 0 warnings**

---

## 2. Production Environment & API Integration

- **Environment Replacement**: `angular.json` replaces `environment.ts` with `environment.prod.ts` for production builds.
- **API Base URL**: `apiBaseUrl: ''` (relative origin), ensuring seamless integration when hosted alongside FastAPI or behind Nginx/Caddy reverse proxies.
- **Contract Enforcement**: Strongly typed interfaces in `risk.models.ts` (`PredictRequest`, `PredictResponse`, `MetricsSummary`, `HealthResponse`).

---

## 3. Resilience & Anti-Fake Guardrails

- **Zero Mock Data in Production**: All risk scores in the Interactive Studio (`/risk-analyzer`) are received via real HTTP POST requests to `POST /predict`.
- **Backend Offline Handling**: When the FastAPI service is unreachable, the UI displays a clear offline alert with a **"Retry Evaluation"** button. The UI strictly refuses to display simulated or cached fake predictions.

---

## 4. Verdict

### **VERDICT: PASS (FRONTEND REPRODUCIBILITY VERIFIED)**
