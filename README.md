# Abuse-Ring Sentinel 🛡️

**Defensive Coordinated Merchant Abuse Ring & Sybil Network Detector**  
*Built for the Razorpay Buildathon — Track 02 (AI Risk Manager)*

---

## 📌 Project Overview

**Abuse-Ring Sentinel** protects e-commerce merchants against organized multi-account fraud syndicates (voucher harvesting, card testing rings, chargeback networks). 

The system bridges the gap between traditional single-transaction models and entity network analysis by combining **point-in-time behavioral ML** with **heterogeneous bipartite entity relationship graphs** (Users, Devices, IPs, Payment Tokens, Addresses) to uncover hidden collusion while protecting legitimate shared infrastructure (such as family households).

---

## 🏗️ System Architecture

```
Incoming Transaction Event (t_pred)
       ↓
Pydantic Schema & Anti-Leakage Validator
       ↓
Point-in-Time Feature Engine (33 Behavioral + Graph Features)
       ↓
Frozen Model Serving Layer (HistGradientBoostingClassifier)
       ↓
Continuous Risk Score in [0.0, 1.0]
       ↓
Merchant Decision Policy (<0.50 APPROVE | 0.50-0.90 REVIEW | >=0.90 BLOCK)
       ↓
Explainability Engine (Top 3-5 Ranked Reason Codes + Feature Evidence)
       ↓
Structured JSON Audit Logger & REST API Response
```

---

## 🚀 Quick Start & CLI Usage

### 1. Requirements
Ensure Python 3.10+ is available:
```bash
py -m pip install -r requirements.txt
```

### 2. Generate Benchmark Dataset (Phase 1)
```bash
py scripts/generate_dataset.py --seed 42 --users 5000 --days 90 --out-dir data/raw
```

### 3. Extract Point-in-Time Features (Phase 2)
```bash
py scripts/build_features.py --raw-dir data/raw --out-dir data/processed
```

### 4. Run Ablation Study & Model Experiments (Phase 3)
```bash
py scripts/run_phase3_experiments.py
```

### 5. Run Batch Inference on Transactions (Phase 4)
```bash
py scripts/predict_batch.py --input data/demo/demo_transactions.csv --output reports/predictions.csv
```

### 6. Run Complete Test Suite
```bash
py -m pytest tests/ -v
```

---

## 🌐 FastAPI Risk Decision Service (Phase 4)

### Starting the API Server:
```bash
py -m uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
```

### 1. Health Check (`GET /health`)
```bash
curl -X GET http://localhost:8000/health
```
**Response**:
```json
{
  "status": "ok",
  "model_name": "abuse_ring_sentinel",
  "model_type": "hist_gradient_boosting",
  "model_version": "phase3-v1",
  "feature_version": "features-v2",
  "policy_version": "val-opt-v1"
}
```

### 2. Real-Time Transaction Scoring (`POST /predict`)
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

**Response**:
```json
{
  "transaction_id": "tx_demo_001",
  "risk_score": 1.0,
  "risk_level": "HIGH",
  "decision": "BLOCK",
  "reason_codes": [
    {
      "code": "NEW_ACCOUNT",
      "message": "Account was recently created and has minimal prior tenure.",
      "evidence": {
        "account_age_days": 0.45
      }
    },
    {
      "code": "GRAPH_CONNECTED_USERS",
      "message": "Transaction belongs to a highly connected account cluster in the entity graph.",
      "evidence": {
        "number_of_prior_connected_users": 8
      }
    },
    {
      "code": "GRAPH_SHARED_DEVICE",
      "message": "Device fingerprint is associated with multiple distinct user accounts.",
      "evidence": {
        "device_prior_user_count": 7
      }
    }
  ],
  "evidence": {
    "account_age_days": 0.45,
    "user_tx_count_24h": 4,
    "device_prior_user_count": 7,
    "ip_prior_user_count": 4,
    "payment_prior_user_count": 6,
    "shipping_address_prior_user_count": 1,
    "number_of_prior_connected_users": 8,
    "max_shared_entity_user_count": 7,
    "is_promo_used": 1,
    "amount": 249.99
  },
  "model_version": "phase3-v1",
  "feature_version": "features-v2",
  "policy_version": "val-opt-v1",
  "evaluated_at": "2026-08-22T21:15:00Z"
}
```

---

## 💻 Merchant Risk Console Frontend (Phase 6)

The merchant web console is built with **Angular 19**, **TypeScript**, **Tailwind CSS**, **Apache ECharts**, and **Cytoscape.js**.

### Starting the Web Console:
```bash
# Terminal 1: Start FastAPI backend
py -m uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2: Start Angular development server
cd frontend
npm start
# Console available at: http://localhost:4200
```
*(Alternatively, accessing `http://localhost:8000` directly serves the production pre-compiled Angular SPA from the FastAPI server!)*

### Frontend Routes & Capabilities:
- **`/dashboard`**: Real-time KPI summary (6,929 evaluated, 99.11% approved, 0.69% blocked, 100% abuse caught), ECharts risk distribution histogram, and decision donut breakdown.
- **`/transactions`**: Searchable transaction investigation console with risk filters, compact score meters, and reason summaries.
- **`/transactions/:id`**: Deep-dive transaction forensic view with 3-step reason timeline and categorized feature evidence.
- **`/risk-analyzer`**: Live Interactive Studio with 5 pre-configured demo scenarios (Coordinated Abuse, Household, Corporate IP, Established Shopper, Borderline) for real-time scoring against `POST /predict`.
- **`/risk-networks`**: Interactive Cytoscape.js entity relationship graph visualizing multi-account collusion across Users, Devices, IPs, Payments, and Addresses.
- **`/monitoring`**: Operational batch metrics, 4-slice temporal stability charts, and frozen model governance specifications.
- **`/audit`**: Immutable regulatory compliance log with slide-over event inspector.


| Risk Score Range | Risk Level | Action | Merchant Workflow |
| :--- | :--- | :--- | :--- |
| **`score < 0.50`** | `LOW` | **`APPROVE`** | Seamless auto-authorization (zero customer friction). |
| **`0.50 <= score < 0.90`** | `MEDIUM` | **`REVIEW`** | Trigger step-up 2FA / SMS OTP or flag for manual review queue. |
| **`score >= 0.90`** | `HIGH` | **`BLOCK`** | Automated decline with reason codes logged for chargeback defense. |

---

## 📂 Project Repository Structure

```
abuse-ring-sentinel/
├── api/
│   ├── __init__.py
│   └── main.py                     # FastAPI application & endpoints
├── src/
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
│   │   └── logger.py               # Structured JSON audit logging
│   └── monitoring/
│       └── summary.py              # Operational inference batch summary
├── scripts/
│   ├── generate_dataset.py         # Dataset generation CLI
│   ├── build_features.py           # Feature extraction CLI
│   ├── run_phase3_experiments.py   # Ablation study & model comparison CLI
│   ├── predict_batch.py            # Batch prediction CLI
│   └── generate_demo_dataset.py    # Demonstration dataset builder
├── data/
│   ├── raw/                        # Raw synthetic benchmark
│   ├── processed/                  # Point-in-time features (Train, Val, Test)
│   └── demo/                       # Curated demonstration scenarios
├── models/                         # Serialized trained model artifacts
├── reports/
│   ├── phase3_model_comparison.csv # Ablation comparison table
│   ├── phase3_results.json         # Complete machine-readable metrics
│   ├── phase3_ablation.md          # Formal research ablation report
│   ├── phase4_architecture.md      # Decision engine architecture specification
│   ├── phase4_demo_results.json    # Demonstration scenario evaluation outputs
│   └── predictions.csv             # Batch prediction output
└── tests/
    ├── test_generator.py           # Invariant & topology tests
    ├── test_features.py            # Feature extractor tests
    ├── test_temporal_leakage.py    # Lookahead leakage prevention tests
    ├── test_graph_temporal.py      # Point-in-time graph edge tests
    ├── test_ablation.py            # Model ablation isolation tests
    ├── test_decision.py            # Decision policy & boundary tests
    ├── test_explainer.py           # Explainability & reason ranking tests
    └── test_api.py                 # FastAPI integration & contract tests
```

---

## 🛡️ Defensive Guarantee
*This system is strictly defensive. It contains no tools for fraud generation, credential stuffing, account takeover, or detection evasion.*
