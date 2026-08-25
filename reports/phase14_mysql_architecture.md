# Phase 14 — Real MySQL Database Architecture & Production Persistence Layer

## 1. Executive Summary

Phase 14 transitions Abuse-Ring Sentinel from a local SQLite proof-of-concept into a production-grade **MySQL 8.x relational persistence layer** managed via **SQLAlchemy 2.0 Declarative ORM** and **Alembic Migrations**.

Every inbound transaction, historical feature lookback, bipartite graph entity relationship, frozen model evaluation score, idempotency lock, and outbound merchant action attempt is persisted in a fully normalized relational schema with strict multi-tenant isolation and point-in-time temporal causality (`timestamp < T`).

---

## 2. Schema Architecture & 13 Normalized Tables

```
                    ┌─────────────────────────┐
                    │        merchants        │
                    └────────────┬────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │ 1:N                   │ 1:1                   │ 1:1
┌────────▼──────────────┐ ┌──────▼──────────────┐ ┌──────▼──────────────┐
│  merchant_credentials │ │merchant_integrations│ │   merchant_users    │
└───────────────────────┘ └─────────────────────┘ └─────────────────────┘
         │
         │ 1:N
┌────────▼──────────────┐         1:N           ┌────────────────────────┐
│     transactions      ├───────────────────────►  transaction_entities  │
└────────┬──────────────┘                       └───────────┬────────────┘
         │                                                  │
         │ 1:1                                              │ 1:N
┌────────▼──────────────┐                       ┌───────────▼────────────┐
│    risk_evaluations   │                       │  entity_relationships  │
└────────┬──────────────┘                       └────────────────────────┘
         │
         │ 1:1
┌────────▼──────────────┐
│   merchant_actions    │
└────────┬──────────────┘
         │
         │ 1:N
┌────────▼──────────────┐
│    action_attempts    │
└───────────────────────┘
```

### Table Definitions:

1. **`merchants`**:
   - Primary key: `merchant_id` (VARCHAR(64))
   - Attributes: `name`, `status`, `environment`, `created_at`, `updated_at`.
2. **`merchant_credentials`**:
   - Stores hashed API keys (`api_key_hash`), salt, and masked previews.
3. **`merchant_integrations`**:
   - Outbound action webhook URL (`action_endpoint_url`), `auth_header_name`, `auth_token_encrypted`, `webhook_secret_encrypted`, retry policy (`max_retries`, `timeout_seconds`).
4. **`users`**:
   - Account profiles per merchant (`merchant_id`, `user_id`, `first_seen_timestamp`, `email_domain`, `status`). Unique index on `(merchant_id, user_id)`.
5. **`transactions`**:
   - Inbound checkout records (`merchant_id`, `transaction_id`, `user_id`, `amount`, `currency`, `timestamp`, `product_category`, `device_id`, `ip_address`, `payment_method_id`, `billing_address_id`, `shipping_address_id`, `email_domain`, `is_promo_used`, `promo_code`, `billing_shipping_match`).
   - Indexes on `(merchant_id, timestamp)`, `(merchant_id, user_id, timestamp)`.
6. **`transaction_entities`**:
   - Maps each transaction to its constituent entity identifiers (`entity_type`: `DEVICE`, `IP`, `PAYMENT`, `ADDRESS`).
7. **`entity_relationships`**:
   - Bipartite user-to-entity edge records (`merchant_id`, `user_id`, `entity_type`, `entity_value`, `first_seen`, `last_seen`, `link_count`).
   - Unique constraint on `(merchant_id, user_id, entity_type, entity_value)`.
8. **`risk_evaluations`**:
   - Frozen Model F scores (`risk_score`, `risk_level`, `decision`), reason codes (JSON), evidence (JSON), and raw feature vector (JSON).
9. **`merchant_actions`**:
   - Outbound dispatch status (`action`, `status`, `http_status`, `latency_ms`, `attempt_count`).
10. **`action_attempts`**:
    - Audit log for individual HTTP webhook delivery attempts with latency, status codes, and error messages.
11. **`outcomes`**:
    - Ground truth chargeback / fraud confirmation labels (`CONFIRMED_FRAUD`, `LEGITIMATE`, `CHARGEBACK`).
12. **`idempotency_records`**:
    - Unique `(merchant_id, idempotency_key)` locks preventing duplicate inference and duplicate webhook execution.
13. **`audit_events`**:
    - Immutable audit ledger of all API security events, key rotations, and model predictions.

---

## 3. Connection Pooling & Production Resilience

- **Dialect**: MySQL 8.x via `pymysql` driver.
- **Engine Config**:
  - `pool_size`: 10 persistent connections
  - `max_overflow`: 20 burst connections
  - `pool_timeout`: 30 seconds
  - `pool_recycle`: 3600 seconds (prevents stale connection termination)
  - `pool_pre_ping`: Enabled (proactively validates connection liveness with `SELECT 1` before dispatching queries).
- **Session Lifecycle**:
  - Context-managed `get_db_session()` providing atomic commits and automatic rollbacks upon unhandled exceptions.

---

## 4. Multi-Tenant Isolation Guarantees

Every query across all 8 repositories enforces:
```sql
WHERE merchant_id = :merchant_id
```
Entities associated with Merchant A are strictly partitioned from Merchant B. Even if an attacker uses the exact same `device_id` or `payment_method_id` across two different merchants, graph expansion and feature lookups are isolated to each merchant tenant.

---

## 5. Temporal Causality Contract

In accordance with strict point-in-time rules, historical features are extracted strictly using:
```sql
WHERE merchant_id = :merchant_id 
  AND user_id = :user_id 
  AND timestamp < :tx_timestamp
```
Transactions occurring at `t >= T` are strictly excluded, eliminating any prospective data leakage into Model F's inference pipeline.
