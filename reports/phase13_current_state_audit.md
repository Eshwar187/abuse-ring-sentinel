# Phase 13 — Current-State Audit Report: Data Sources, Routing & Architecture

**Project**: Abuse-Ring Sentinel  
**Track**: Razorpay Buildathon — Track 02: AI Risk Manager  
**Audit Date**: 2026-08-25T17:35:00Z  
**Author**: Lead Systems Auditor & Full-Stack Architect  

---

## 1. Executive Summary

This audit assesses the state of the Abuse-Ring Sentinel frontend and backend applications prior to Phase 13. The purpose is to systematically catalog all UI screens, routes, services, and endpoints, classifying each data source into:
- **A. Historical / Demo Dataset**: Precomputed 90-day simulation / Phase 5 evaluation benchmarks ($N=6,929$).
- **B. Real Runtime Merchant Data**: Active SQLite database (`runtime_transactions`) and tenant-scoped NetworkX runtime graphs.
- **C. Hardcoded UI Data**: Static constants and template literals in components.
- **D. API-Derived Data**: Live responses from FastAPI endpoints (`/predict`, `/api/v1/*`, `/metrics/summary`, `/health`).

---

## 2. Screen-by-Screen Data Source Classification

| Screen Route | Component | Primary Data Displayed | Classification | Notes / Current Behavior |
| :--- | :--- | :--- | :---: | :--- |
| `/dashboard` | `DashboardComponent` | 6,929 transactions, 99.11% approval, 48 blocks, 43 abuse attacks, ROC distribution chart | **A (Historical / Demo Data)** | Currently renders static evaluation benchmark numbers from the Phase 5 test set. Must be relocated to `/demo` and replaced with real live merchant metrics at `/app/overview`. |
| `/transactions` | `TransactionsComponent` | Transaction table (e.g. `tx_0027436`, `tx_0027410`, etc.) | **A (Historical / Demo Data)** | Currently populated from `TransactionService.mockTransactions`. In Live mode (`/app/transactions`), must query `GET /api/v1/merchant/transactions`. |
| `/transactions/:id` | `TransactionDetailComponent` | Feature values, explainability, decision reason codes | **A (Historical / Demo Data)** | Currently resolves against `TransactionService.mockTransactions`. In Live mode, must fetch from `GET /api/v1/risk/{tx_id}`. |
| `/risk-analyzer` | `RiskAnalyzerComponent` | Feature form, dynamic sliders, live model inference | **D (API-Derived Data)** | Calls `POST /predict` with precomputed feature vectors. In Phase 13, upgraded to submit raw observable checkout data to `POST /api/v1/risk/evaluate`. |
| `/risk-networks` | `RiskNetworksComponent` | Cytoscape bipartite entity relationship graph | **A (Historical / Demo Data)** | Renders fixed Sybil ring cluster topology. In Live mode, must render the merchant's real-time runtime entity graph. |
| `/monitoring` | `MonitoringComponent` | Live API session metrics + offline governance specs | **D (API-Derived)** & **A (Historical)** | Session telemetry correctly queries `GET /metrics/summary`, but model governance tables display offline benchmark metrics. |
| `/audit` | `AuditComponent` | JSON audit log table, PII masking indicators | **D (API-Derived)** & **A (Historical)** | Displays live session evaluations from `RiskService.sessionAuditLog` combined with initial historical sample logs. |
| `/integration` | `IntegrationComponent` | API status, live API tester, cURL/TS snippets | **D (API-Derived Data)** | Phase 12 developer portal calling `POST /api/v1/risk/evaluate` and `GET /api/v1/merchant/health`. |

---

## 3. Authentication & Tenant Identity State

- **Current State**:
  - No authentication gate exists on the frontend. The root URL `/` redirects directly to `/dashboard`.
  - Backend API v1 authenticates server-to-server requests using `X-API-Key` or `Authorization: Bearer <key>` mapped against a dictionary `API_KEY_REGISTRY`.
  - No user accounts, passwords, merchant registration, or browser session tokens currently exist.
- **Phase 13 Target**:
  - Unauthenticated root `/` displays a high-conversion Enterprise SaaS Landing Page.
  - Dedicated `/login`, `/signup`, `/forgot-password`, and `/onboarding` flows.
  - Secure PBKDF2/SHA-256 password hashing and tokenized sessions.
  - New merchants receive a securely generated API key (shown once with copy functionality).
  - All application routes (`/app/*`) protected by `AuthGuard`.

---

## 4. Backend Persistence & Runtime State Store

- **SQLite Database (`data/runtime/runtime_state.db`)**:
  - Stores `runtime_transactions`, `user_profiles`, `runtime_outcomes`, `runtime_events`, `idempotency_records`.
  - Every table is strictly partitioned by `merchant_id`.
  - In-memory `merchant_graphs: Dict[str, nx.Graph]` maintains bipartite entity graphs per tenant.
- **Endpoints to Add in Phase 13**:
  - `POST /api/v1/auth/signup`: Create merchant account & initial API key.
  - `POST /api/v1/auth/login`: Authenticate merchant user.
  - `GET /api/v1/auth/me`: Current session status.
  - `POST /api/v1/auth/rotate-key`: Secure API key rotation.
  - `GET /api/v1/merchant/transactions`: Paginated, filtered runtime transactions.
  - `GET /api/v1/merchant/metrics`: Aggregated live metrics computed from the merchant's real evaluations.

---

## 5. Explicit Data Separation Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ABUSE-RING SENTINEL UX                          │
├───────────────────────────────────┬────────────────────────────────────┤
│           LIVE MERCHANT           │           DEMO MODE                │
│             (/app/*)              │            (/demo)                 │
├───────────────────────────────────┼────────────────────────────────────┤
│ • Zero-data state for new users   │ • 6,929 historical test benchmark  │
│ • State source: SQLite database   │ • Benchmark recall: 100.0%         │
│ • Evaluation: POST /api/v1/risk/  │ • Benchmark precision: 89.58%      │
│ • Real-time runtime entity graphs │ • Fixed Sybil ring cluster demo    │
│ • Badge: "● LIVE MERCHANT"        │ • Badge: "⚠️ DEMO ENVIRONMENT"     │
└───────────────────────────────────┴────────────────────────────────────┘
```

---

## 6. Audit Verdict

The codebase is technically sound, cleanly modularized, and fully verified. Proceed with Phase 13 implementation:
1. Backend Auth & Merchant Management extension.
2. Enterprise Landing Page at `/`.
3. Authentication & Onboarding flows (`/login`, `/signup`, `/onboarding`).
4. Strict separation of `/app/*` (Live) and `/demo` (Historical).
5. Comprehensive Phase 13 test suite & reality audit.
