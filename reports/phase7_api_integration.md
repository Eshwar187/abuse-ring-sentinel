# Phase 7 API Integration & Network Flow Report

**Project**: Abuse-Ring Sentinel  
**Track**: Razorpay Buildathon — Track 02 (AI Risk Manager)  
**Report Date**: August 22, 2026

---

## 1. Network Integration Architecture

```
[Angular 19 Browser UI]
        │
        ▼ (HttpClient - JSON over HTTP)
[FastAPI Backend :8000]
        │
        ├─► [Pydantic Validation (PredictRequest)]
        │       └─► Rejects forbidden metadata (is_abuse_ring, ring_id, etc.)
        │
        ├─► [RiskDecisionEngine]
        │       ├─► [ModelService -> HistGradientBoostingClassifier (models/model_f.joblib)]
        │       │       └─► Computes P(abuse | 33 features)
        │       ├─► [DecisionPolicy (Threshold tau* = 0.90)]
        │       │       └─► Maps score to APPROVE (<0.50), REVIEW (0.50-0.90), BLOCK (>=0.90)
        │       ├─► [TransactionExplainer]
        │       │       └─► Derives 3–5 ranked reason codes & evidence dict
        │       └─► [AuditLogger]
        │               └─► Writes structured event to reports/audit_log.jsonl
        │
        ▼ (HTTP 200 OK - PredictResponse)
[Angular UI Rendering]
        └─► Animated Score Bar, Action Badge, Reason Timeline, Evidence Inspector
```

---

## 2. Live Endpoint Verification Evidence

### Endpoint 1: System Health (`GET /health`)
- **HTTP Method**: `GET`
- **URL**: `http://localhost:8000/health`
- **Status**: `200 OK`
- **Response Payload**:
```json
{
  "status": "ok",
  "model_name": "abuse_ring_sentinel",
  "model_type": "HistGradientBoostingClassifier",
  "model_version": "phase3-v1",
  "feature_version": "features-v2",
  "policy_version": "val-opt-v1"
}
```

---

### Endpoint 2: Real-Time Transaction Prediction (`POST /predict`)
- **HTTP Method**: `POST`
- **URL**: `http://localhost:8000/predict`
- **Status**: `200 OK`
- **Typical Response Latency**: `12ms - 28ms`
- **Sample Request Payload (Coordinated Abuse Control)**:
```json
{
  "transaction_id": "tx_phase7_ctrl_high_01",
  "features": {
    "amount": 299.99,
    "product_category": "electronics",
    "is_promo_used": 1,
    "hour_of_day": 4,
    "day_of_week": 2,
    "is_weekend": 0,
    "billing_shipping_match": 0,
    "account_age_days": 0.35,
    "email_domain": "tempmail.org",
    "user_tx_count_1h": 3,
    "user_tx_count_24h": 5,
    "user_tx_count_7d": 5,
    "user_historical_tx_count": 1,
    "user_historical_mean_amount": 299.99,
    "user_historical_std_amount": 0.0,
    "amount_to_user_mean_ratio": 1.0,
    "user_promo_rate": 1.0,
    "user_unique_device_count": 1,
    "user_unique_ip_count": 2,
    "user_unique_payment_count": 1,
    "user_unique_address_count": 1,
    "device_prior_user_count": 8,
    "ip_prior_user_count": 5,
    "payment_prior_user_count": 7,
    "shipping_address_prior_user_count": 2,
    "billing_address_prior_user_count": 0,
    "max_shared_entity_user_count": 8,
    "number_of_prior_connected_users": 9,
    "shared_entity_types_count": 4,
    "connected_component_user_count": 9,
    "connected_component_total_nodes": 16,
    "connected_component_edge_count": 26,
    "connected_component_density": 0.2167
  }
}
```

- **Sample Response Payload**:
```json
{
  "transaction_id": "tx_phase7_ctrl_high_01",
  "risk_score": 1.0,
  "risk_level": "HIGH",
  "decision": "BLOCK",
  "reason_codes": [
    {
      "code": "GRAPH_CONNECTED_USERS",
      "message": "Transaction belongs to a highly connected account cluster in the entity graph.",
      "evidence": {
        "number_of_prior_connected_users": 9
      }
    },
    {
      "code": "GRAPH_SHARED_DEVICE",
      "message": "Device fingerprint is associated with multiple distinct user accounts.",
      "evidence": {
        "device_prior_user_count": 8
      }
    },
    {
      "code": "GRAPH_SHARED_PAYMENT",
      "message": "Payment instrument is associated with multiple distinct user accounts.",
      "evidence": {
        "payment_prior_user_count": 7
      }
    },
    {
      "code": "HIGH_1H_VELOCITY",
      "message": "Account has unusually high transaction velocity in the last 1 hour.",
      "evidence": {
        "user_tx_count_1h": 3
      }
    },
    {
      "code": "NEW_ACCOUNT",
      "message": "Account was created very recently (< 3 days ago).",
      "evidence": {
        "account_age_days": 0.35
      }
    }
  ],
  "evidence": {
    "account_age_days": 0.35,
    "user_tx_count_24h": 5,
    "device_prior_user_count": 8,
    "ip_prior_user_count": 5,
    "payment_prior_user_count": 7,
    "shipping_address_prior_user_count": 2,
    "number_of_prior_connected_users": 9,
    "max_shared_entity_user_count": 8,
    "is_promo_used": 1,
    "amount": 299.99
  },
  "model_version": "phase3-v1",
  "feature_version": "features-v2",
  "policy_version": "val-opt-v1",
  "evaluated_at": "2026-08-22T18:20:30Z"
}
```

---

## 3. Backend Downtime Resilience

When the FastAPI server is stopped or unreachable, the Angular UI responds with:
- Error banner: `"Risk API service is currently unreachable. Please ensure FastAPI server is running on port 8000."`
- Explicit Retry button.
- Zero score display and zero decision badge displayed.
- Refuses to convert network failure into a simulated or fake prediction.
