# Phase 13 Action Execution & Production Webhook Audit

## 1. Executive Summary

Phase 13 establishes the outbound merchant action execution engine for Abuse-Ring Sentinel. Rather than stopping at passive risk scoring, the platform executes real, authenticated outbound HTTP action requests (`BLOCK_TRANSACTION`, `APPROVE_TRANSACTION`, `REVIEW_TRANSACTION`) to the merchant's configured webhook receiver.

### Core Semantic Separation
A strict boundary is maintained across 4 operational states:
1. **Risk Decision**: Computed via frozen GBDT `model_f.joblib` at fixed threshold $\tau^* = 0.90$ (`BLOCK`, `APPROVE`, `REVIEW`).
2. **Merchant Action Request**: Deterministically signed payload sent to the merchant's registered webhook endpoint.
3. **Merchant Action Execution**: Verified acknowledgement received from the merchant backend with HTTP 200/201 and state update.
4. **Merchant Action Failure**: Network timeout, connection error, or merchant error (HTTP 4xx/5xx), permanently recorded as `FAILED` or `TIMEOUT`.

---

## 2. Invariants & Forensic Integrity

| Invariant / Artifact | Expected Value / Hash | Verified Status |
| :--- | :--- | :--- |
| **Frozen ML Model** (`models/model_f.joblib`) | `a288f019a2693c04c5d6a2c454da4e9c9f7c54f1298b5777ab276cbca9a6dd9c` | **PASSED (Byte-for-byte identical)** |
| **Held-Out Test Features** (`data/processed/test_features.csv`) | `be9b9f921948862a9fff52c9d6202bd2f6b1bf9c07a7725844bc2f5dad3a14cd` | **PASSED (Byte-for-byte identical)** |
| **Feature Contract** | 33 features (`COMBINED_FEATURES`) | **PASSED** |
| **Decision Policy** | Fixed threshold $\tau^* = 0.90$ | **PASSED** |
| **Mock Score Ban** | Zero hardcoded risk predictions, zero Math.random() in runtime | **PASSED** |

---

## 3. Idempotency & Action State Management

Action idempotency is anchored on the deterministic SHA-256 hash:
$$\text{action\_id} = \text{SHA256}(\text{merchant\_id} + \text{transaction\_id} + \text{action})$$

- If an action was already successfully executed or rejected, subsequent evaluation requests return the cached action record without redundant network dispatches.
- If an action failed, operators can invoke `POST /api/v1/actions/{transaction_id}/retry` to bypass the cache and trigger a fresh attempt with incremented attempt numbers.

---

## 4. Webhook Security & Signing

Every outbound webhook includes cryptographic authentication:
- **`X-Abuse-Sentinel-Signature`**: `sha256=<HMAC-SHA256(payload, webhook_secret)>`
- **`X-Abuse-Sentinel-Request-ID`**: Traceable unique evaluation identifier.
- **`Idempotency-Key`**: Transaction-level deduplication key.
- **`Authorization: Bearer <token>`**: Optional static bearer token.

---

## 5. Automated Verification Results

- **Total Pytest Suite**: 92 passed, 0 failed.
- **Action Test Suite**: 12 passed in `tests/test_phase13_actions.py`.
- **E2E Demo Verification**: 100% verified state transition in `demo_merchant/orders.db` via `scripts/phase13_real_merchant_demo.py`.
- **Angular Build**: 0 errors (`frontend/dist/frontend`).
