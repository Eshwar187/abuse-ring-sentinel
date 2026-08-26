# Phase 14 MySQL Reality Audit Report

**Generated:** 2026-08-26T08:12:33.484098

**Overall Status:** PASS

## 1. Non-Negotiable Invariants

- Model SHA-256 (`models/model_f.joblib`): `PASS`
- Test Features SHA-256 (`data/processed/test_features.csv`): `PASS`
- 33-Feature Contract: `PASS` (Count: 33)

## 2. Database Architecture & Health

- Configured Engine: `mysql`
- Database Connection Probe: `connected`
- Latency: `105.96 ms`
- Schema Normalized Tables: `13`
  - `merchants`
  - `merchant_credentials`
  - `transactions`
  - `users`
  - `transaction_entities`
  - `entity_relationships`
  - `risk_evaluations`
  - `merchant_actions`
  - `action_attempts`
  - `outcomes`
  - `idempotency_records`
  - `audit_events`
  - `merchant_integrations`
