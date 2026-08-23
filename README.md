# Abuse-Ring Sentinel 🛡️

**Defensive Coordinated Merchant Abuse Ring & Sybil Network Detector**  
*Built for the Razorpay Buildathon — Track 02 (AI Risk Manager)*

[![Tests](https://img.shields.io/badge/Tests-54%2F54%20Passed-emerald.svg)](tests/)
[![Model](https://img.shields.io/badge/Model-HistGradientBoosting-blue.svg)](models/model_f.joblib)
[![Recall](https://img.shields.io/badge/Benchmark%20Recall-100.0%25-emerald.svg)](reports/phase5_evaluation_report.md)
[![Precision@0.90](https://img.shields.io/badge/Precision%400.90-89.58%25-blue.svg)](reports/phase5_evaluation_report.md)
[![Frontend](https://img.shields.io/badge/Frontend-Angular%2019-red.svg)](frontend/)

---

## 1. Project Overview

**Abuse-Ring Sentinel** is a production-grade, defensive AI risk decision and explainability engine engineered to detect coordinated multi-account merchant fraud syndicates (voucher harvesting, card testing rings, chargeback syndicates). 

By integrating **point-in-time behavioral velocity signals** with **incremental bipartite entity relationship graphs** (Users, Devices, IPs, Payment Instruments, Shipping Addresses), the system uncovers concealed Sybil and mesh collusion at checkout while safeguarding legitimate shared infrastructure (such as family households and corporate networks) against false declines.

---

## 2. The Problem

Modern fraud syndicates no longer operate through obvious single-account velocity anomalies. Instead, coordinated rings distribute malicious transactions across hundreds of newly registered, seemingly independent synthetic user profiles (Sybil attacks) sharing underlying physical or digital infrastructure. 

Traditional rule engines and isolated per-transaction classifiers fail because:
1. **Isolated Analysis Blindness**: Individual accounts show low transaction volume and appear benign in isolation.
2. **Legitimate Sharing Over-Blocking**: Naive device/IP blacklisting falsely blocks entire apartment buildings, universities, or family households.
3. **Temporal Lookahead Leakage**: Research graph algorithms frequently leak future graph edges established *after* the transaction timestamp into real-time scoring.

---

## 3. The Solution

Abuse-Ring Sentinel resolves these challenges through:
- **Strict Point-in-Time Causality**: Zero lookahead leakage. Graph state and behavioral aggregates only include events strictly prior to $t_{\text{pred}}$.
- **Heterogeneous Bipartite Graph Intelligence**: Models accounts and shared digital entities to measure connected component size, edge density, and 1-hop neighbor counts dynamically.
- **Explainable Decision Engine**: Enforces a validation-optimized 3-tier operating policy ($\tau^* = 0.90$) and returns 3–5 ranked reason codes with explicit evidence.
- **Enterprise-Ready Full Stack**: Fast, hardened FastAPI backend paired with an Angular 19 merchant risk management console.

---

## 4. System Architecture

```
                               ┌─────────────────────────────┐
                               │   Merchant Checkout Event   │
                               └──────────────┬──────────────┘
                                              │ POST /predict
                                              ▼
                               ┌─────────────────────────────┐
                               │  Pydantic Anti-Leakage Gate │
                               └──────────────┬──────────────┘
                                              │
                      ┌───────────────────────┴───────────────────────┐
                      │                                               │
                      ▼                                               ▼
       ┌─────────────────────────────┐                 ┌─────────────────────────────┐
       │   Point-in-Time Behavioral  │                 │    Incremental Bipartite    │
       │     Feature Engine (21)     │                 │      Graph Engine (12)      │
       └──────────────┬──────────────┘                 └──────────────┬──────────────┘
                      │                                               │
                      └───────────────────────┬───────────────────────┘
                                              │ 33 Combined Features
                                              ▼
                               ┌─────────────────────────────┐
                               │  TreeRiskModel (model_f)    │
                               │  HistGradientBoosting       │
                               └──────────────┬──────────────┘
                                              │ Risk Score in [0.0, 1.0]
                                              ▼
                               ┌─────────────────────────────┐
                               │   Risk Decision Policy      │
                               │   (<0.50, 0.50-0.90, ≥0.90) │
                               └──────────────┬──────────────┘
                                              │
                      ┌───────────────────────┴───────────────────────┐
                      │                                               │
                      ▼                                               ▼
       ┌─────────────────────────────┐                 ┌─────────────────────────────┐
       │    Transaction Explainer    │                 │   Structured Audit Logger   │
       │   (Ranked Reason Codes)     │                 │   (reports/audit_log.jsonl) │
       └──────────────┬──────────────┘                 └─────────────────────────────┘
                      │
                      ▼
       ┌─────────────────────────────┐
       │   FastAPI Response &        │
       │   Angular 19 Risk Console   │
       └─────────────────────────────┘
```

---

## 5. Dataset Generation & Multi-Topology Simulation

Phase 1 generated a deterministic, 90-day synthetic benchmark dataset without target leakage:
- **Total Transactions**: 27,439
- **Total Accounts**: 5,006
- **Abuse Syndicates**: 56 coordinated rings across 3 distinct topological structures:
  1. **Bipartite Mesh**: Dense cross-sharing of devices and payment cards.
  2. **Star Topology**: Central hub entity rotating through peripheral Sybil accounts.
  3. **Chained Sybil**: Sequential hopping across transient IP subnets.
- **Benign Shared Infrastructure**: Realistic household clusters and corporate office IP blocks.

---

## 6. Feature Engineering Contract (33 Features)

Features are computed using point-in-time historical tables with zero lookahead:

| Feature Category | Count | Key Examples |
| :--- | :--- | :--- |
| **Transaction Context** | 8 | `amount`, `product_category`, `is_promo_used`, `hour_of_day`, `day_of_week`, `is_weekend`, `billing_shipping_match`, `amount_to_user_mean_ratio` |
| **Account Profile** | 6 | `account_age_days`, `email_domain`, `user_historical_tx_count`, `user_historical_mean_amount`, `user_historical_std_amount`, `user_promo_rate` |
| **Velocity & Diversity** | 7 | `user_tx_count_1h`, `user_tx_count_24h`, `user_tx_count_7d`, `user_unique_device_count`, `user_unique_ip_count`, `user_unique_payment_count`, `user_unique_address_count` |
| **Shared Entity Counts** | 7 | `device_prior_user_count`, `ip_prior_user_count`, `payment_prior_user_count`, `shipping_address_prior_user_count`, `billing_address_prior_user_count`, `max_shared_entity_user_count`, `shared_entity_types_count` |
| **Graph Topology Signals** | 5 | `number_of_prior_connected_users`, `connected_component_user_count`, `connected_component_total_nodes`, `connected_component_edge_count`, `connected_component_density` |

---

## 7. Model Selection & Ablation Study

Phase 3 evaluated 6 model architectures on chronological splits:
- **Train Window**: Jan 1, 2026 – Feb 28, 2026 ($N=15,060$)
- **Validation Window**: Mar 1, 2026 – Mar 15, 2026 ($N=5,450$)

| Candidate | Architecture | Feature Set | PR-AUC | ROC-AUC | Validation False Positives |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Model A | Logistic Regression | Behavioral Only (21) | 0.9412 | 0.9780 | 38 |
| Model B | Logistic Regression | Graph Only (12) | 0.9820 | 0.9910 | 19 |
| Model C | Logistic Regression | Combined (33) | 0.9958 | 0.9996 | 12 |
| Model D | Random Forest | Combined (33) | 0.9989 | 0.9999 | 8 |
| **Model F (Selected)** | **HistGradientBoosting** | **Combined (33)** | **0.9996** | **1.0000** | **5** |

**Production Artifact**: `models/model_f.joblib` (Frozen).

---

## 8. Decision Engine & Operating Policy

The validation-selected policy optimizes merchant profit under asymmetric error costs:
- **$\text{Risk Score} < 0.50$** $\to$ **`APPROVE`** (`LOW RISK` — Auto-authorized)
- **$0.50 \le \text{Risk Score} < 0.90$** $\to$ **`REVIEW`** (`MEDIUM RISK` — Step-up 2FA / OTP)
- **$\text{Risk Score} \ge 0.90$** $\to$ **`BLOCK`** (`HIGH RISK` — Automated decline, $\tau^* = 0.90$)

---

## 9. Final Held-Out Evaluation Results (Phase 5)

Evaluated strictly once on the held-out test dataset (Mar 16, 2026 – Mar 31, 2026, $N=6,929$, 43 abuse transactions):

| Evaluation Metric | Baseline / Ideal | Held-Out Result | Verdict |
| :--- | :--- | :--- | :--- |
| **Total Test Transactions** | — | **6,929** | Complete window |
| **Actual Abuse Events** | — | **43** | 0.62% prevalence |
| **True Positives (TP)** | 43 | **43** | **100.00% Recall** |
| **False Negatives (FN)** | 0 | **0** | **0 Missed Attacks** |
| **False Positives (FP)** | 0 | **5** | 0.07% False Alarm Rate |
| **Precision @ 0.90** | 100% | **89.58%** | Highly actionable |
| **PR-AUC** | 1.0000 | **1.0000** | Perfect ranking |
| **ROC-AUC** | 1.0000 | **1.0000** | Complete separability |
| **Financial Cost Reduction** | — | **97.67%** | Illustrative benchmark |

> *Disclaimer: Financial loss calculations use illustrative benchmark parameters ($FP = \$10, FN = \$50$) and represent synthetic evaluation performance rather than production financial figures.*

---

## 10. Security & Production Hardening (Phase 8)

1. **Environment Configuration**: Centralized in [`src/config.py`](src/config.py) and [`.env.example`](.env.example).
2. **CORS Allowlist**: Explicit origin whitelisting in production (wildcard `*` disabled).
3. **API Rate Limiting**: In-memory sliding-window limiter (120 req/min/IP) returning `HTTP 429`.
4. **Target Leakage Protection**: Pydantic validators reject all ground-truth columns (`is_abuse_ring`, `ring_id`, etc.) with `HTTP 422`.
5. **Observability**: `GET /metrics/summary` provides live throughput and latency telemetry.
6. **Safe Failure Mode**: Missing or corrupted model triggers `HTTP 503 Service Unavailable` with zero fake prediction fallbacks.
7. **PII Sanitization**: Scrubbers in [`src/audit/logger.py`](src/audit/logger.py) sanitize passwords, tokens, and payment card numbers before writing to `reports/audit_log.jsonl`.

---

## 11. Quick Start & Local Execution

### 1. Prerequisites & Dependencies
```bash
py -m pip install -r requirements.txt
```

### 2. Run All Automated Tests (54 Tests)
```bash
py -m pytest tests/ -v
```

### 3. Start the FastAPI Production Server
```bash
py -m uvicorn api.main:app --host 0.0.0.0 --port 8000
```

### 4. Start the Angular Merchant Console
```bash
cd frontend
npm install
npm start
# Navigate to: http://localhost:4200 (or http://localhost:8000 directly!)
```

### 5. Build Production Frontend SPA
```bash
cd frontend
npm run build
```

---

## 12. Docker Container Deployment

Build and run using the multi-stage hardened `Dockerfile`:
```bash
# Build container image
docker build -t abuse-ring-sentinel:latest .

# Run containerized service on port 8000
docker run -d -p 8000:8000 --name sentinel-app abuse-ring-sentinel:latest

# Verify health status
curl http://localhost:8000/health
```

---

## 13. API Endpoint Reference

### `GET /health`
Returns system status, environment, and model version metadata.

### `GET /metrics/summary`
Returns live operational inference telemetry, request counters, decision breakdowns, and latency percentiles.

### `POST /predict`
Evaluates a 33-feature transaction dictionary and returns a continuous risk score, decision, ranked reason codes, and audit `request_id`.

---

## 14. Repository Structure

```
abuse-ring-sentinel/
├── api/
│   ├── __init__.py
│   └── main.py                     # Hardened FastAPI application & endpoints
├── src/
│   ├── config.py                   # Centralized runtime configuration
│   ├── features/
│   │   ├── behavioral.py           # Point-in-time behavioral engine
│   │   ├── graph.py                # Point-in-time incremental graph engine
│   │   ├── pipeline.py             # Feature pipeline & dataset partitioner
│   │   └── groups.py               # Feature group definitions
│   ├── models/
│   │   ├── baseline.py             # Logistic Regression model
│   │   └── tree_model.py           # HistGradientBoosting risk model
│   ├── decision/
│   │   ├── policy.py               # Risk decision policy & thresholds
│   │   └── engine.py               # Production risk decision engine
│   ├── explanation/
│   │   ├── reason_codes.py         # Reason code registry
│   │   └── explainer.py            # Explainer & reason ranking engine
│   ├── audit/
│   │   └── logger.py               # Hardened structured audit logging
│   └── monitoring/
│       └── summary.py              # Operational inference batch summary
├── frontend/                       # Angular 19 Enterprise Merchant Console
│   ├── src/app/                    # Standalone components, services, and routes
│   ├── package.json
│   └── angular.json
├── data/
│   ├── raw/                        # Raw synthetic benchmark
│   ├── processed/                  # Point-in-time features (Train, Val, Test)
│   └── demo/                       # Curated demonstration scenarios
├── models/
│   └── model_f.joblib              # Frozen production GBDT artifact
├── reports/                        # Audit logs, benchmarks, and research reports
├── tests/                          # 54 comprehensive automated test suites
├── Dockerfile                      # Production container image
├── .dockerignore
└── requirements.txt                # Python dependencies
```

---

## 15. Defensive Guarantee & Limitations

- **Strictly Defensive**: Abuse-Ring Sentinel is designed exclusively for merchant fraud prevention and risk management. It contains no tools for fraud generation, credential testing, or evasion.
- **Controlled Scope**: Evaluated on synthetic benchmark simulations designed to replicate real-world multi-account collusion patterns.
- **Model Transparency**: The production model is frozen (`models/model_f.joblib`) with deterministic behavior and strict point-in-time causality.
