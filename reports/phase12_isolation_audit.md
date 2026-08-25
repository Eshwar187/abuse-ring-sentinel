# Phase 12 — Multi-Tenant Merchant Isolation Audit Report

**Project**: Abuse-Ring Sentinel  
**Track**: Razorpay Buildathon — Track 02: AI Risk Manager  
**Audit Date**: 2026-08-25T14:45:00Z  
**Auditor**: Infrastructure Security Engineer  

---

## 1. Multi-Tenancy Architecture & Privacy Invariant

In multi-merchant risk infrastructure, privacy and compliance mandate that:
> **Merchant A's transactions, customers, devices, and entity graphs MUST NEVER contaminate or influence Merchant B's feature extraction or risk scores.**

---

## 2. Partitioning Mechanisms

1. **API Authentication & Tenant Context**:
   - `X-API-Key` or `Authorization: Bearer <key>` resolves to a deterministic `merchant_id` (e.g. `ars_live_test_merchant_01` $\to$ `merchant_dev_01`).
   - Requests with missing or unrecognized keys are rejected with HTTP 401 Unauthorized before reaching state or inference layers.

2. **Database Partitioning Key**:
   - All SQLite runtime tables (`runtime_transactions`, `runtime_users`, `runtime_outcomes`, `idempotency_records`) use `merchant_id` as the leading composite primary key / foreign key column.
   - All database queries bind `WHERE merchant_id = ?`.

3. **Graph Partitioning**:
   - In-memory entity graphs are stored in a merchant-keyed dictionary: `Dict[str, nx.Graph]`.
   - Adding a node/edge for `merchant_dev_01` operates strictly on `self.merchant_graphs['merchant_dev_01']`.

---

## 3. Empirical Multi-Tenant Isolation Test

We simulated a cross-tenant collision attack:
1. **Merchant A (`merchant_dev_01`)**:
   - Ingested 3 colluding user accounts sharing device `dev_sybil_farm_rig_99` and card `pm_sybil_compromised_card_99`.
   - Merchant A's device prior sharing reached `3 prior users`.
2. **Merchant B (`merchant_dev_02`)**:
   - Ingested a user account using the identical device `dev_sybil_farm_rig_99` and card `pm_sybil_compromised_card_99`.
   - **Observed Metrics in Merchant B's Evaluation**:
     - `device_prior_user_count`: `0`
     - `payment_prior_user_count`: `0`
     - `number_of_prior_connected_users`: `0`
     - `data_quality.status`: `cold_start`
3. **Cross-Tenant Querying**:
   - Attempting to query Merchant A's transaction using Merchant B's API key via `GET /api/v1/risk/{tx_id}` returns HTTP 404 Not Found.

**Audit Status**: **PASSED (100% ISOLATED)**.
