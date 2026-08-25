# Phase 14 — Transactional Persistence & Deduplication Audit

## 1. Executive Summary

This audit evaluates the transactional integrity, idempotency caching, and outbound action tracking of Abuse-Ring Sentinel's MySQL persistence layer.

---

## 2. Ingress & Transaction Persistence

Upon receiving `POST /api/v1/risk/evaluate`:
1. The raw payload is parsed and validated by `EventNormalizer`.
2. Hashed API key is verified against `merchant_credentials`.
3. Idempotency lock is checked in `idempotency_records`:
   - If present, cached response is returned immediately (zero redundant model inference).
   - If not present, execution proceeds.
4. Historical state is queried point-in-time (`timestamp < T`) from `transactions` and `entity_relationships`.
5. 33 features are extracted and fed to frozen Model F.
6. A single database transaction atomically writes:
   - `transactions` row
   - `users` profile upsert
   - `transaction_entities` entries (Device, IP, Payment, Address)
   - `entity_relationships` edges
   - `risk_evaluations` prediction record
   - `idempotency_records` cache record
7. If an outbound merchant webhook is configured, `MerchantActionModel` and `ActionAttemptModel` records are written.

---

## 3. Ground-Truth Feedback & Fraud Outcomes

When merchants provide chargeback or investigation labels via `POST /api/v1/merchant/outcomes`:
- The label (`CONFIRMED_FRAUD`, `LEGITIMATE`, `CHARGEBACK`) is inserted into `outcomes`.
- The outcome is linked to `transaction_id` and `merchant_id`.
- Model weights remain completely untouched, ensuring zero unexpected runtime drift.

---

## 4. Verification Test Results

All persistence requirements were verified via automated unit and integration tests:
- Transaction Persistence: **PASS**
- Idempotency Deduplication: **PASS**
- Outbound Action & Attempt Tracking: **PASS**
- Outcome Feedback Storage: **PASS**
- Service Restart In-Memory Graph Recovery: **PASS**
