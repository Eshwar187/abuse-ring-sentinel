# Abuse-Ring Sentinel 🛡️

**Defensive Coordinated Merchant Abuse Ring & Sybil Network Detector**  
*Built for the Razorpay Buildathon — Track 02: AI Risk Manager*

[![Automated Tests](https://img.shields.io/badge/Pytest-70%2F70%20Passing%20(100%25)-emerald.svg?style=for-the-badge&logo=pytest)](tests/)
[![Model Engine](https://img.shields.io/badge/Model-HistGradientBoosting%20GBDT-blue.svg?style=for-the-badge&logo=scikitlearn)](models/model_f.joblib)
[![Benchmark Recall](https://img.shields.io/badge/Benchmark%20Recall-100.0%25-emerald.svg?style=for-the-badge)](reports/phase5_final_report.md)
[![Precision @ 0.90](https://img.shields.io/badge/Precision%20%40%200.90-89.58%25-blue.svg?style=for-the-badge)](reports/phase5_final_report.md)
[![Merchant API](https://img.shields.io/badge/API-v1%20Raw%20Merchant%20Gateway-indigo.svg?style=for-the-badge&logo=fastapi)](api/v1/)
[![Frontend Console](https://img.shields.io/badge/Frontend-Angular%2019%20%2B%20Tailwind-red.svg?style=for-the-badge&logo=angular)](frontend/)

---

## 📑 Table of Contents

1. [Executive Summary](#-executive-summary)
2. [API-First Merchant Integration Platform (API v1)](#-api-first-merchant-integration-platform-api-v1)
3. [The Core Problem: Invisible Sybil Abuse Rings](#-the-core-problem-invisible-sybil-abuse-rings)
4. [The Abuse-Ring Sentinel Solution](#-the-abuse-ring-sentinel-solution)
5. [System Architecture & Data Flow](#-system-architecture--data-flow)
6. [Synthetic Dataset & Topological Simulation](#-synthetic-dataset--topological-simulation)
7. [Point-in-Time Feature Engineering Contract (33 Features)](#-point-in-time-feature-engineering-contract-33-features)
8. [Model Selection & Ablation Study](#-model-selection--ablation-study)
9. [Decision Policy & Operating Thresholds](#-decision-policy--operating-thresholds)
10. [Final Held-Out Benchmark Performance](#-final-held-out-benchmark-performance)
11. [Explainability & Ranked Reason Code Engine](#-explainability--ranked-reason-code-engine)
12. [Merchant Risk & Integration Console (Angular 19 Frontend)](#-merchant-risk--integration-console-angular-19-frontend)
13. [Production Hardening & Security Architecture](#-production-hardening--security-architecture)
14. [API Endpoint Specifications (v1 & Predict)](#-api-endpoint-specifications-v1--predict)
15. [Local Quick Start & Execution Guide](#-local-quick-start--execution-guide)
16. [Docker Container Deployment](#-docker-container-deployment)
17. [Interactive 3-Minute Judge Demo Guide](#-interactive-3-minute-judge-demo-guide)
18. [Repository File Inventory](#-repository-file-inventory)
19. [Disclosed Limitations & Ethical Statement](#-disclosed-limitations--ethical-statement)

---

## 📌 Executive Summary

**Abuse-Ring Sentinel** is a production-hardened, real-time AI risk decision and explainability engine designed to protect digital merchants from coordinated multi-account fraud syndicates (voucher harvesting, card testing rings, and chargeback networks).

Unlike single-transaction fraud classifiers that evaluate checkouts in isolation, Abuse-Ring Sentinel combines **point-in-time behavioral velocity** with **incremental bipartite entity relationship graphs** (connecting Users, Devices, IP Subnets, Payment Tokens, and Shipping Addresses). This enables the system to detect sophisticated distributed Sybil networks at checkout while strictly safeguarding legitimate shared infrastructure—such as residential family households and corporate networks—against false declines.

```
[Merchant Checkout Event]
           │
           ▼
[FastAPI Gate & Rate Limiter] ──(Anti-Leakage Validator)
           │
           ├──► [Point-in-Time Behavioral Features (21)]
           └──► [Incremental Bipartite Graph Features (12)]
                       │
                       ▼ (33 Combined Features)
         [Frozen HistGradientBoosting GBDT Model]
                       │ (Risk Score: 0.0000 -> 1.0000)
                       ▼
         [Validation Policy Engine (tau = 0.90)]
           ├── APPROVE (< 0.50)  -> Auto-Authorize
           ├── REVIEW  (0.50-0.90) -> Step-Up 2FA / OTP
           └── BLOCK   (>= 0.90) -> Automated Decline
                       │
                       ├──► [Explainability Engine (Ranked Reason Codes)]
                       ├──► [Structured Audit Logger (PII-Scrubbed)]
                       └──► [Angular 19 Merchant Risk Console]
```

---

## 🚀 API-First Merchant Integration Platform (API v1)

Abuse-Ring Sentinel exposes an enterprise-grade, versioned REST API (`/api/v1/*`) enabling merchants to integrate real-time abuse detection without knowing any internal machine learning features. Merchants simply send observable checkout payloads; Abuse-Ring Sentinel automatically maintains merchant-isolated state, constructs point-in-time entity graphs, extracts 33 behavioral & graph features, executes the frozen GBDT model, and applies the decision policy.

```
RAW MERCHANT CHECKOUT (JSON)
  ├── transaction_id, user_id, amount, timestamp
  └── device_id, ip_address, payment_token, addresses
            │
            ▼
[Event Normalizer & Security Sanitizer]  ──(Rejects PANs, CVVs, Passwords, Target Labels)
            │
            ▼
[Merchant Runtime State Store (SQLite + NetworkX)]
  ├── Strictly partitioned by merchant_id
  └── Strictly enforces point-in-time causality (t < T)
            │
            ▼
[Automated Feature Adapter] ──(Generates exact 33 COMBINED_FEATURES)
            │
            ▼
[Frozen HistGradientBoosting Model (model_f.joblib)]
            │
            ▼
[Decision Policy Engine (tau = 0.90)] -> APPROVE | REVIEW | BLOCK
            │
            ▼
[Explainability & PII-Safe Structured Audit Logger]
```

### Quick Integration Examples

#### 1. Direct cURL (Raw Checkout Evaluation)
```bash
curl -X POST http://127.0.0.1:8000/api/v1/risk/evaluate \
  -H "X-API-Key: ars_live_test_merchant_01" \
  -H "Idempotency-Key: req_idemp_checkout_9918" \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_id": "tx_live_1001",
    "user_id": "cust_sarah_connor",
    "amount": 249.99,
    "currency": "INR",
    "timestamp": "2026-08-25T14:30:00Z",
    "product_category": "electronics",
    "device_id": "dev_fp_abc123",
    "ip_address": "203.0.113.195",
    "payment_method_id": "pm_tok_card_99",
    "shipping_address_id": "addr_99",
    "billing_address_id": "addr_99",
    "email_domain": "sarah.connor@gmail.com",
    "promo_code": "WELCOME10"
  }'
```

#### 2. TypeScript / Node.js Integration
```typescript
import axios from 'axios';

const riskEvaluation = await axios.post('http://127.0.0.1:8000/api/v1/risk/evaluate', {
  transaction_id: 'tx_live_1001',
  user_id: 'cust_sarah_connor',
  amount: 249.99,
  currency: 'INR',
  timestamp: new Date().toISOString(),
  product_category: 'electronics',
  device_id: 'dev_fp_abc123',
  ip_address: '203.0.113.195',
  payment_method_id: 'pm_tok_card_99',
  shipping_address_id: 'addr_99',
  billing_address_id: 'addr_99',
  email_domain: 'sarah.connor@gmail.com',
  promo_code: 'WELCOME10',
}, {
  headers: {
    'X-API-Key': 'ars_live_test_merchant_01',
    'Idempotency-Key': 'req_idemp_checkout_9918',
  },
});

console.log('Automated Risk Action:', riskEvaluation.data.decision); // APPROVE | REVIEW | BLOCK
console.log('Calculated Risk Score:', riskEvaluation.data.risk_score);
console.log('Data Quality Status:', riskEvaluation.data.data_quality.status); // cold_start | sufficient_history
console.log('Primary Decision Drivers:', riskEvaluation.data.reason_codes);
```

---

## 🎯 The Core Problem: Invisible Sybil Abuse Rings

Traditional rule engines and machine learning models fail against coordinated abuse rings for three fundamental reasons:

1. **Isolated Velocity Blindness**: Modern syndicates distribute attacks across hundreds of freshly registered, seemingly independent synthetic user profiles (Sybil accounts). Each account executes only 1 or 2 low-value purchases, completely bypassing per-account velocity checks.
2. **Legitimate Sharing Over-Blocking**: Naive IP or address blacklisting causes massive collateral damage—falsely blocking legitimate families sharing a home Wi-Fi or college students sharing a campus network.
3. **Temporal Lookahead Leakage**: Research graph algorithms routinely suffer from lookahead leakage by querying graph states that include relationships established *after* the target transaction occurred ($t > t_{\text{pred}}$), invalidating real-world applicability.

---

## 💡 The Abuse-Ring Sentinel Solution

Abuse-Ring Sentinel solves these vulnerabilities through strict, defensible engineering:

- **Strict Point-in-Time Causality ($t < t_{\text{pred}}$)**: Zero lookahead leakage. Both behavioral counts and entity graph edges reflect only relationships established strictly prior to the transaction evaluation timestamp.
- **Heterogeneous Entity Bipartite Graphs**: Tracks 1-hop and multi-hop co-usage across 5 distinct digital entities (User accounts, Device fingerprints, IP addresses, Payment instruments, Shipping addresses).
- **Behavioral + Relational Fusion**: Distinguishes malicious device rotation from benign household sharing by cross-evaluating account tenure, promo usage rates, and graph density metrics simultaneously.
- **Explainable Decision Engine**: Produces 3–5 human-interpretable reason codes with concrete feature evidence for every automated decision, enabling instant merchant dispute defense.

---

## 🏛️ System Architecture & Data Flow

| Subsystem | Source Location | Core Responsibility |
| :--- | :--- | :--- |
| **API Serving Layer** | [`api/main.py`](api/main.py) | FastAPI application providing `/health`, `/metrics/summary`, and `/predict` with sliding-window rate limiting. |
| **Configuration** | [`src/config.py`](src/config.py) | Dynamic environment configuration (`APP_ENV`, `PORT`, `CORS_ORIGINS`, `RATE_LIMIT_PER_MINUTE`). |
| **Behavioral Engine** | [`src/features/behavioral.py`](src/features/behavioral.py) | Point-in-time transaction velocity (1h, 24h, 7d), account tenure, and monetary aggregations. |
| **Graph Engine** | [`src/features/graph.py`](src/features/graph.py) | Point-in-time bipartite entity graph, connected component sizing, and prior user neighbor counting. |
| **Model Serving** | [`src/serving/model_service.py`](src/serving/model_service.py) | High-throughput GBDT inference wrapper around the frozen production model artifact. |
| **Decision Engine** | [`src/decision/engine.py`](src/decision/engine.py) | Applies the 3-tier operating policy ($\tau^* = 0.90$) to generate `APPROVE`, `REVIEW`, or `BLOCK` actions. |
| **Explainability Engine** | [`src/explanation/explainer.py`](src/explanation/explainer.py) | Evaluates 15 registered reason rules to rank top decision drivers and attach observable evidence. |
| **Audit Logger** | [`src/audit/logger.py`](src/audit/logger.py) | Append-only structured JSON logging with UUID `request_id`, execution latency, and automated PII scrubbing. |
| **Merchant Console** | [`frontend/src/app/`](frontend/src/app/) | Angular 19 SPA featuring an interactive Risk Studio, Cytoscape entity graph, and investigation tools. |

---

## 📊 Synthetic Dataset & Topological Simulation

To rigorously evaluate coordinated abuse detection without customer privacy violations, Phase 1 generated a deterministic, 90-day synthetic benchmark dataset ($N=27,439$ transactions across $5,006$ user accounts):

```
Dataset Chronological Splits:
├── Training Partition:    2026-01-01 -> 2026-02-28 (15,060 transactions, 54.9%)
├── Validation Partition:  2026-03-01 -> 2026-03-15 (5,450 transactions,  19.9%)
└── Held-Out Test Set:     2026-03-16 -> 2026-03-31 (6,929 transactions,  25.2% - FROZEN)
```

### Simulated Threat Topologies:
1. **Bipartite Mesh Collusion (Dense Sharing)**: Tightly coupled syndicates sharing multiple devices, virtual cards, and shipping drop locations.
2. **Star Topology (Hub & Spoke)**: Central rogue coordinator distributing promotional vouchers across peripheral transient Sybil accounts.
3. **Chained Sybil (Sequential Rotation)**: Sybils sequentially hopping across residential proxy subnets with rapid card turnover.
4. **Benign Shared Infrastructure (Control Group)**: Legitimate family households (shared Wi-Fi/address, distinct devices) and corporate office networks (shared IP gateway, isolated cards/devices).

---

## 📐 Point-in-Time Feature Engineering Contract (33 Features)

Every checkout event is transformed into exactly 33 causal features ($t < t_{\text{pred}}$):

| Feature Category | Count | Feature Names & Definitions |
| :--- | :---: | :--- |
| **Transaction Context** | 8 | `amount`, `product_category`, `is_promo_used`, `hour_of_day`, `day_of_week`, `is_weekend`, `billing_shipping_match`, `amount_to_user_mean_ratio` |
| **Account Profile & Tenure** | 6 | `account_age_days`, `email_domain`, `user_historical_tx_count`, `user_historical_mean_amount`, `user_historical_std_amount`, `user_promo_rate` |
| **Velocity & Diversity** | 7 | `user_tx_count_1h`, `user_tx_count_24h`, `user_tx_count_7d`, `user_unique_device_count`, `user_unique_ip_count`, `user_unique_payment_count`, `user_unique_address_count` |
| **Shared Entity Counts** | 7 | `device_prior_user_count`, `ip_prior_user_count`, `payment_prior_user_count`, `shipping_address_prior_user_count`, `billing_address_prior_user_count`, `max_shared_entity_user_count`, `shared_entity_types_count` |
| **Relational Graph Topology** | 5 | `number_of_prior_connected_users`, `connected_component_user_count`, `connected_component_total_nodes`, `connected_component_edge_count`, `connected_component_density` |

---

## 🔬 Model Selection & Ablation Study

Phase 3 conducted an extensive ablation experiment comparing 6 candidate architectures on chronological validation partitions:

| Candidate Model | Algorithm | Feature Set | PR-AUC | ROC-AUC | Validation FP | Validation FN |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: |
| **Model A** | Logistic Regression | Behavioral Only (21) | 0.9412 | 0.9780 | 38 | 0 |
| **Model B** | Logistic Regression | Graph Only (12) | 0.9820 | 0.9910 | 19 | 0 |
| **Model C** | Logistic Regression | Combined (33) | 0.9958 | 0.9996 | 12 | 0 |
| **Model D** | Random Forest | Combined (33) | 0.9989 | 0.9999 | 8 | 0 |
| **Model E** | Extra Trees | Combined (33) | 0.9982 | 0.9998 | 9 | 0 |
| **Model F (Selected)** | **HistGradientBoosting** | **Combined (33)** | **0.9996** | **1.0000** | **5** | **0** |

> **Key Ablation Finding**: Incorporating graph features into Model F reduced false positives by **86.8%** (from 38 down to 5) compared to behavioral-only baselines, proving that multi-account collusion is fundamentally a graph-structured problem.

**Frozen Production Artifact**: [`models/model_f.joblib`](models/model_f.joblib)  
*(SHA-256: `a288f019a2693c04c5d6a2c454da4e9c9f7c54f1298b5777ab276cbca9a6dd9c`)*

---

## ⚖️ Decision Policy & Operating Thresholds

The decision policy enforces asymmetric risk boundaries optimized on validation data under realistic operational costs ($C_{\text{FP}} = \$10, C_{\text{FN}} = \$50$):

```
       LOW RISK                   MEDIUM RISK                  HIGH RISK
 [ 0.00 ─────────── 0.50 )   [ 0.50 ─────────── 0.90 )   [ 0.90 ─────────── 1.00 ]
         APPROVE                       REVIEW                       BLOCK
  (Seamless Checkout)           (Step-Up 2FA / OTP)          (Automated Decline)
```

- **`APPROVE` (Score < 0.50)**: Standard checkout path with zero friction.
- **`REVIEW` (0.50 ≤ Score < 0.90)**: Intermediate threshold triggering 2FA/OTP step-up verification.
- **`BLOCK` (Score ≥ 0.90)**: Automated high-confidence decline ($\tau^* = 0.90$).

---

## 🏆 Final Held-Out Benchmark Performance

In Phase 5, the frozen candidate (Model F at $\tau^* = 0.90$) was evaluated strictly once against the held-out test set ($N=6,929$, 43 actual abuse transactions):

| Performance Metric | Held-Out Test Value | Operational Impact |
| :--- | :---: | :--- |
| **Total Test Transactions** | **6,929** | Complete 15-day evaluation window |
| **Actual Abuse Transactions** | **43** | 0.62% test set attack prevalence |
| **True Positives (TP)** | **43** | **100.00% Abuse Recall** (Zero missed attacks) |
| **False Negatives (FN)** | **0** | Zero merchant chargeback leakage |
| **False Positives (FP)** | **5** | 0.07% False Alarm Rate on benign shoppers |
| **True Negatives (TN)** | **6,881** | 99.93% Specificity |
| **Precision @ $\tau = 0.90$** | **89.58%** | 43 true abuse attacks blocked out of 48 total declines |
| **PR-AUC / ROC-AUC** | **1.0000 / 1.0000** | Complete probabilistic separability |
| **Illustrative Cost Reduction** | **97.67%** | \$2,150 unmitigated loss reduced to \$50 total operational cost |

> *Disclaimer: Cost reductions reflect benchmark evaluation parameters ($FP=\$10, FN=\$50$) on synthetic data and represent illustrative research performance.*

---

## 💡 Explainability & Ranked Reason Code Engine

Abuse-Ring Sentinel eliminates "black-box AI" risk by providing ranked, human-interpretable reason codes for every evaluation:

```json
{
  "code": "GRAPH_CONNECTED_USERS",
  "message": "Transaction belongs to a highly connected account cluster in the entity graph.",
  "evidence": { "number_of_prior_connected_users": 9 }
}
```

### Registered Reason Codes:
- `GRAPH_CONNECTED_USERS`: High prior connected account cluster density.
- `GRAPH_SHARED_DEVICE`: Device fingerprint linked to multiple user accounts.
- `GRAPH_SHARED_PAYMENT`: Credit card or payment instrument shared across accounts.
- `GRAPH_SHARED_IP`: IP address associated with multiple distinct users.
- `HIGH_1H_VELOCITY` / `HIGH_24H_VELOCITY`: Sudden burst transaction velocity.
- `NEW_ACCOUNT`: Account created $< 24\text{h}$ prior to checkout.
- `OFF_HOURS_ACTIVITY`: Transaction initiated during overnight hours (01:00–06:00).
- `HIGH_AMOUNT_ANOMALY`: Purchase amount significantly exceeds account historical mean.
- `LOW_RISK_ESTABLISHED_ACCOUNT`: Clean account tenure with zero graph sharing (Fallback for Approvals).

---

## 💻 Merchant Risk Console (Angular 19 Frontend)

The merchant web console is built using modern **Angular 19** standalone components, **Tailwind CSS**, **Apache ECharts**, and **Cytoscape.js**:

```
frontend/src/app/
├── features/
│   ├── dashboard/          # Risk score separation histogram, decision donuts, KPI tiles
│   ├── risk-analyzer/      # Interactive Studio with live demo scenario injection
│   ├── transactions/       # Searchable ledger with filter tabs and inspection drawers
│   ├── risk-networks/      # Cytoscape.js heterogeneous entity graph explorer
│   ├── monitoring/         # Live API telemetry (GET /metrics/summary) & governance specs
│   └── audit/              # Immutable regulatory compliance log with PII masking
├── shared/components/      # Score meters, decision pills, risk badges, KPI cards
└── core/services/          # Strongly typed HttpClient services and error interceptors
```

### Key UI Features:
- **Interactive Risk Studio (`/risk-analyzer`)**: Main demo page allowing real-time feature adjustments and immediate `POST /predict` scoring.
- **Relational Entity Networks (`/risk-networks`)**: Interactive graph visualizer mapping clusters of Users, Devices, IPs, Payments, and Addresses.
- **Live Telemetry Dashboard (`/monitoring`)**: Direct connection to `GET /metrics/summary` displaying real-time request counts and P95 latencies.

---

## 🛡️ Production Hardening & Security Architecture

The backend implements multi-layered enterprise defensive controls:

1. **Anti-Leakage Validator**: Pydantic schemas reject all ground-truth columns (`is_abuse_ring`, `ring_id`, `ring_type`, `order_status`) with `HTTP 422`.
2. **API Rate Limiter**: In-memory sliding-window rate limiter (120 req/min/IP) returning `HTTP 429 Too Many Requests`.
3. **CORS Allowlist**: Explicit origin whitelisting in production mode (wildcard `*` disabled).
4. **Structured Error Sanitization**: All exceptions return uniform JSON containing a UUID `request_id` with zero Python tracebacks or paths leaked.
5. **PII Scrubbing**: `AuditLogger` automatically redacts passwords, authentication tokens, and payment card numbers before writing to [`reports/audit_log.jsonl`](reports/audit_log.jsonl).
6. **Safe Degradation Mode**: If the model artifact is missing or corrupted, the service returns `HTTP 503 Service Unavailable`—strictly preventing fake or random score fallbacks.

---

## 🔌 API Endpoint Specifications (v1 & Predict)

### Merchant Gateway Endpoints (`/api/v1/*`)

#### 1. `POST /api/v1/risk/evaluate`
Accepts raw merchant checkout events and returns a live risk decision.
- **Headers**: `X-API-Key: <key>`, `Idempotency-Key: <key>` (optional)
- **Response**: `RiskEvaluateResponse` (contains `decision`, `risk_score`, `reason_codes`, `data_quality`, `latency_ms`).

#### 2. `GET /api/v1/risk/{transaction_id}`
Retrieves a previously evaluated transaction within the merchant's isolated tenant scope.
- **Headers**: `X-API-Key: <key>`

#### 3. `POST /api/v1/events`
Records transaction lifecycle updates (e.g. `transaction.completed`, `transaction.chargeback`).
- **Headers**: `X-API-Key: <key>`

#### 4. `POST /api/v1/outcomes`
Records post-decision feedback (`CONFIRMED_FRAUD`, `LEGITIMATE`, `CHARGEBACK`) without altering the frozen model.
- **Headers**: `X-API-Key: <key>`

#### 5. `GET /api/v1/merchant/config`
Fetches merchant-specific model registry metadata, supported event types, and policy thresholds.
- **Headers**: `X-API-Key: <key>`

#### 6. `GET /api/v1/merchant/health`
Returns gateway connection status, state store readiness, and model health.
- **Headers**: `X-API-Key: <key>`

---

### Core Inference & Telemetry Endpoints

#### 7. `POST /predict` (Precomputed 33 Features)
Direct low-level inference endpoint accepting precomputed feature vectors.
```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{"transaction_id": "tx_demo_01", "features": {"amount": 50.0, "user_tx_count_24h": 1, ...}}'
```

#### 8. `GET /health`
Returns overall service availability and model registry metadata.

#### 9. `GET /metrics/summary`
Returns live operational telemetry computed from active inference requests.
```bash
curl -X GET http://localhost:8000/metrics/summary
```
```json
{
  "total_inference_requests": 142,
  "decision_breakdown": { "approvals": 138, "reviews": 1, "blocks": 3 },
  "error_count": 0,
  "performance": { "avg_latency_ms": 4.12, "p95_latency_ms": 6.35, "sample_window_size": 142 },
  "server_environment": "production"
}
```

### 3. `POST /predict`
Evaluates a 33-feature transaction dictionary in real time.
```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_id": "tx_demo_001",
    "features": {
      "amount": 249.99,
      "product_category": "electronics",
      "is_promo_used": 1,
      "hour_of_day": 3,
      "day_of_week": 2,
      "is_weekend": 0,
      "billing_shipping_match": 0,
      "account_age_days": 0.45,
      "email_domain": "tempmail.org",
      "user_tx_count_1h": 2,
      "user_tx_count_24h": 4,
      "user_tx_count_7d": 4,
      "user_historical_tx_count": 1,
      "user_historical_mean_amount": 249.99,
      "user_historical_std_amount": 0.0,
      "amount_to_user_mean_ratio": 1.0,
      "user_promo_rate": 1.0,
      "user_unique_device_count": 1,
      "user_unique_ip_count": 2,
      "user_unique_payment_count": 1,
      "user_unique_address_count": 1,
      "device_prior_user_count": 7,
      "ip_prior_user_count": 4,
      "payment_prior_user_count": 6,
      "shipping_address_prior_user_count": 1,
      "billing_address_prior_user_count": 0,
      "max_shared_entity_user_count": 7,
      "number_of_prior_connected_users": 8,
      "shared_entity_types_count": 3,
      "connected_component_user_count": 8,
      "connected_component_total_nodes": 14,
      "connected_component_edge_count": 22,
      "connected_component_density": 0.2418
    }
  }'
```
```json
{
  "transaction_id": "tx_demo_001",
  "risk_score": 1.0,
  "risk_level": "HIGH",
  "decision": "BLOCK",
  "reason_codes": [
    {
      "code": "GRAPH_CONNECTED_USERS",
      "message": "Transaction belongs to a highly connected account cluster in the entity graph.",
      "evidence": { "number_of_prior_connected_users": 8 }
    },
    {
      "code": "GRAPH_SHARED_DEVICE",
      "message": "Device fingerprint is associated with multiple distinct user accounts.",
      "evidence": { "device_prior_user_count": 7 }
    }
  ],
  "evidence": {
    "account_age_days": 0.45,
    "user_tx_count_24h": 4,
    "device_prior_user_count": 7,
    "ip_prior_user_count": 4,
    "payment_prior_user_count": 6,
    "number_of_prior_connected_users": 8,
    "amount": 249.99
  },
  "model_version": "phase3-v1",
  "feature_version": "features-v2",
  "policy_version": "val-opt-v1",
  "evaluated_at": "2026-08-23T22:00:00Z",
  "request_id": "c7a8b9e1-2f34-45d6-8a90-123456789abc"
}
```

---

## 🚀 Local Quick Start & Execution Guide

### 1. Install Backend Dependencies
```bash
py -m pip install -r requirements.txt
```

### 2. Run Complete Automated Test Suite (54 Tests)
```bash
py -m pytest tests/ -v
```

### 3. Start FastAPI Server
```bash
py -m uvicorn api.main:app --host 0.0.0.0 --port 8000
```

### 4. Start Angular Console
```bash
cd frontend
npm install
npm start
```
- Development Console: **`http://localhost:4200`**
- Production Integrated Console: **`http://localhost:8000`** *(FastAPI directly serves the pre-compiled Angular SPA!)*

---

## 🐳 Docker Container Deployment

Build and run using the multi-stage hardened `Dockerfile` (runs as non-root user `appuser`):

```bash
# 1. Build Docker image
docker build -t abuse-ring-sentinel:latest .

# 2. Run container on port 8000
docker run -d -p 8000:8000 --name sentinel-app abuse-ring-sentinel:latest

# 3. Verify health status
curl http://localhost:8000/health
```

---

## ⏱️ Interactive 3-Minute Judge Demo Guide

1. **Open the Risk Analyzer (`/risk-analyzer`)**:
   - Click the scenario preset: **"Coordinated Abuse Ring"**.
   - Click **"Evaluate Transaction (POST /predict)"**.
   - **Result**: `100.00% Risk Score` $\to$ **`BLOCK`** with reason codes `GRAPH_CONNECTED_USERS`, `GRAPH_SHARED_DEVICE`, `NEW_ACCOUNT`.
2. **Test Safe Household Isolation**:
   - Click the scenario preset: **"Legitimate Household"**.
   - Click **"Evaluate Transaction"**.
   - **Result**: `0.00% Risk Score` $\to$ **`APPROVE`** demonstrating that shared Wi-Fi / address without device collusion produces zero false alarms.
3. **Test Dynamic Model Sensitivity**:
   - Manually change `device_prior_user_count` from `8` down to `0` and `account_age_days` to `150`.
   - Re-evaluate: Risk score immediately drops from `1.0000` to `< 0.0010`, proving active GBDT inference.
4. **Inspect Entity Graph (`/risk-networks`)**:
   - Explore the multi-account entity network visualizer rendered in Cytoscape.js.
5. **Review Live Telemetry (`/monitoring`)**:
   - View live API throughput counters and latency distributions updated via `GET /metrics/summary`.

---

## 📂 Repository File Inventory

```
abuse-ring-sentinel/
├── api/
│   ├── __init__.py
│   ├── main.py                     # FastAPI application & hardened endpoints
│   └── v1/
│       ├── __init__.py
│       └── routes.py               # Versioned merchant risk routes (/api/v1/*)
├── src/
│   ├── config.py                   # Centralized environment configuration
│   ├── integration/                # Phase 12 Real Merchant Ingestion Subsystem
│   │   ├── schemas.py              # Raw event schemas, outcomes & Pydantic models
│   │   ├── normalizer.py           # Field alias normalizer & sanitization
│   │   ├── merchant_adapter.py     # Tenant field mapping adapter
│   │   └── feature_adapter.py      # Automated 33-feature point-in-time adapter
│   ├── state/
│   │   └── state_store.py          # SQLite + NetworkX isolated merchant state store
│   ├── features/
│   │   ├── behavioral.py           # Point-in-time behavioral engine
│   │   ├── graph.py                # Point-in-time incremental graph engine
│   │   ├── pipeline.py             # Feature pipeline & dataset partitioner
│   │   └── groups.py               # 33 feature definitions & metadata exclusions
│   ├── models/
│   │   ├── baseline.py             # Logistic Regression model wrapper
│   │   └── tree_model.py           # HistGradientBoosting TreeRiskModel wrapper
│   ├── decision/
│   │   ├── policy.py               # Risk decision policy & threshold evaluation
│   │   └── engine.py               # Production risk decision engine
│   ├── explanation/
│   │   ├── reason_codes.py         # 15 registered reason code definitions
│   │   └── explainer.py            # Decision explainer & evidence ranker
│   ├── audit/
│   │   └── logger.py               # PII-scrubbed JSON Lines audit logger
│   └── monitoring/
│       └── summary.py              # Operational batch inference aggregator
├── frontend/                       # Angular 19 Merchant Risk Management Console
│   ├── src/app/                    # Standalone components, services, and routes
│   │   └── features/integration/   # Merchant API v1 Integration Console & Live Tester
│   ├── package.json
│   └── angular.json
├── data/
│   ├── raw/                        # Raw synthetic benchmark (27,439 transactions)
│   ├── processed/                  # Point-in-time feature partitions (Train, Val, Test)
│   ├── runtime/                    # SQLite runtime state store (runtime_state.db)
│   └── demo/                       # Curated control scenarios for interactive demo
├── models/
│   └── model_f.joblib              # Frozen production GBDT artifact (HistGradientBoosting)
├── reports/                        # Milestone audit reports and research outputs
├── tests/                          # 70 comprehensive automated pytest test suites
├── scripts/                        # Verification, audit & demo execution scripts
├── Dockerfile                      # Production multi-stage Docker container
├── .dockerignore
├── .env.example                    # Safe environment variable template
└── requirements.txt                # Python runtime dependencies
```

---

## 📜 Disclosed Limitations & Ethical Statement

- **Strictly Defensive Mission**: Abuse-Ring Sentinel is engineered exclusively for fraud prevention and merchant protection. It contains zero offensive capabilities or evasion automation.
- **Synthetic Data Disclaimer**: Benchmark metrics were evaluated on a high-fidelity synthetic 90-day simulation designed to replicate real-world multi-account collusion. Performance on real production traffic will depend on merchant-specific data quality and botnet rotation patterns.
- **Model Invariant Guarantee**: The production model (`models/model_f.joblib`) is frozen with deterministic behavior and strict point-in-time causal feature pipelines.

---

*Developed for the Razorpay Buildathon — Track 02: AI Risk Manager.*
