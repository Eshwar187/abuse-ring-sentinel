# Phase 12 — Preflight System Inspection & Architecture Baseline

**Project**: Abuse-Ring Sentinel  
**Track**: Razorpay Buildathon — Track 02: AI Risk Manager  
**Date**: August 25, 2026  
**Auditor**: Lead Platform Architect

---

## 1. Existing Ingestion-Related Functionality
- `api/main.py`: Currently provides `POST /predict`, accepting a pre-computed dictionary of 33 features (`amount`, `product_category`, `is_promo_used`, etc.). It does not directly ingest raw merchant checkouts with automated state lookups.
- `src/audit/logger.py`: Provides structured JSON Lines audit logging (`reports/audit_log.jsonl`) with PII and payment card sanitization.
- `src/config.py`: Centralized environment configuration (`APP_ENV`, `PORT`, `CORS_ORIGINS`, `RATE_LIMIT_PER_MINUTE`, etc.).

---

## 2. Existing Feature Generation Functionality
- `src/features/behavioral.py`: Implements `PointInTimeBehavioralEngine` which calculates point-in-time velocity windows (1h, 24h, 7d), historical mean/std amounts, account age, and entity diversity counts strictly before timestamp $T$.
- `src/features/groups.py`: Defines immutable feature partitions (`BEHAVIORAL_FEATURES` [21], `GRAPH_FEATURES` [12], `COMBINED_FEATURES` [33], `METADATA_COLUMNS`).
- `src/features/pipeline.py`: Handles batch extraction over pandas DataFrames for training and validation partitions.

---

## 3. Existing Graph Functionality
- `src/features/graph.py`: Implements `PointInTimeGraphEngine` using NetworkX. Maintains an incremental bipartite graph of `(USER, user_id)` and entities `(DEVICE, dev_id)`, `(IP, ip_addr)`, `(PAYMENT, pmt_id)`, `(SHIPPING_ADDR, ship_id)`, `(BILLING_ADDR, bill_id)`. Computes prior user sharing counts, connected component size, total nodes, edge count, and density strictly before timestamp $T$.

---

## 4. Existing Model Interface
- `src/serving/model_service.py`: Implements `ModelServingService` wrapping the frozen candidate `models/model_f.joblib` (`TreeRiskModel` / `HistGradientBoostingClassifier`). Validates the 33-feature contract, rejects target leakage, and produces calibrated risk probabilities $\in [0.0, 1.0]$.
- Baseline Model Hash (SHA-256): `a288f019a2693c04c5d6a2c454da4e9c9f7c54f1298b5777ab276cbca9a6dd9c`.

---

## 5. Existing Decision & Explainability Interface
- `src/decision/engine.py`: Evaluates risk probabilities against validation-selected policy ($\tau^* = 0.90$) to generate `APPROVE` ($<0.50$), `REVIEW` ($0.50-0.90$), or `BLOCK` ($\ge 0.90$).
- `src/explanation/explainer.py`: Evaluates 15 registered reason rules to rank top decision drivers with attached observable feature evidence.

---

## 6. What Phase 12 Needs to Add
1. **Raw Event Ingestion & Normalization (`src/integration/`)**:
   - Pydantic schemas for raw merchant transaction events, lifecycle events, and outcomes.
   - Normalization engine converting raw merchant payloads into canonical internal representation.
   - Configurable field mapping adapter per merchant.
   - Feature adapter deriving the exact 33 `COMBINED_FEATURES` from raw event + runtime state.
2. **Persistent Runtime State Store (`src/state/`)**:
   - Thread-safe runtime store (`data/runtime/runtime_state.db`) maintaining historical transactions, user profiles, outcome records, idempotency cache, and point-in-time entity graph.
3. **Versioned Merchant API (`/api/v1`)**:
   - `POST /api/v1/risk/evaluate` (with `Idempotency-Key` header, API key authentication, rate limiting, feature extraction, GBDT inference, policy evaluation, reason code ranking, audit logging, and state commitment).
   - `GET /api/v1/risk/{transaction_id}` (retrieves stored evaluation).
   - `POST /api/v1/events` (ingests asynchronous transaction lifecycle events).
   - `POST /api/v1/outcomes` (records chargeback / fraud outcomes without retraining).
   - `GET /api/v1/merchant/config` (returns safe capabilities and integration requirements).
   - `GET /api/v1/merchant/health` (returns integration health, state store status, model status, and last processed event timestamp).
4. **Merchant Integration Console in Angular UI**:
   - New "Integration" navigation tab in `frontend/src/app/` with API status, API key rotation, schema guidelines, and a live Interactive Risk API Tester.
5. **Comprehensive Integration Test Suite (`tests/test_phase12_integration.py`)**:
   - 24+ tests covering raw ingestion, feature derivation, model inference, idempotency, auth, outcomes, and graph learning.
6. **Reality & Integrity Audits**:
   - `scripts/phase12_real_merchant_demo.py`, `scripts/phase12_reality_audit.py`, `reports/phase12_model_integrity.md`, `reports/phase12_merchant_integration_audit.md`, `reports/phase12_results.json`.

---

## 7. What Must Remain Strictly Frozen
- `models/model_f.joblib` (SHA-256: `a288f019a2693c04c5d6a2c454da4e9c9f7c54f1298b5777ab276cbca9a6dd9c`).
- `data/processed/test_features.csv` (SHA-256: `be9b9f921948862a9fff52c9d6202bd2f6b1bf9c07a7725844bc2f5dad3a14cd`).
- 33-Feature Contract (`COMBINED_FEATURES`).
- Validation-derived threshold $\tau^* = 0.90$ and 3-tier policy ($<0.50$ APPROVE, $0.50-0.90$ REVIEW, $\ge 0.90$ BLOCK).
- Zero fake predictions, zero mock inference in production paths, zero hardcoded scores.
