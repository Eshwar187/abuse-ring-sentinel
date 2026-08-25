# Phase 13 Security & Isolation Audit

## 1. Threat Modeling & Controls Summary

| Security Domain | Threat Vector | Mitigation Strategy | Test Verification |
| :--- | :--- | :--- | :--- |
| **SSRF (Server-Side Request Forgery)** | Malicious webhook target pointing to cloud metadata (169.254.169.254) or local services in production | Strict IP/hostname resolution, protocol scheme restriction (`https://` in prod), and private subnet blocking | `test_ssrf_url_validation` in Pytest |
| **Webhook Tampering / Spoofing** | Attacker forging risk decision payloads to bypass merchant security | HMAC-SHA256 request signing using `X-Abuse-Sentinel-Signature` header with constant-time verification (`hmac.compare_digest`) | `test_hmac_signature_generation_and_verification` |
| **Secret Leakage** | API tokens and HMAC secrets exposed in logs, error traces, or UI responses | Automated secret masking (`••••••••1234`), DB secret separation (`include_secrets=False` by default for API endpoints) | `test_integration_settings_crud_and_masking` |
| **Replay & Duplicate Attacks** | Replaying same webhook multiple times | Deterministic SHA-256 idempotency keying and SQLite unique constraints | `test_idempotency_prevents_duplicate_action_dispatch` |
| **Multi-Tenant Cross-Access** | Merchant A viewing or triggering actions for Merchant B | Scoped SQL queries with `merchant_id` filter and token authorization checks | `test_cross_tenant_action_isolation` |

---

## 2. Cryptographic Signing Standard

All outbound webhooks from Sentinel compute the signature:
$$\text{Signature} = \text{HMAC-SHA256}(\text{UTF-8 encoded JSON body}, \text{webhook\_secret})$$

Sent via:
```http
X-Abuse-Sentinel-Signature: sha256=4f8b9e67a1c3d...
X-Abuse-Sentinel-Request-ID: req_3f9011ab...
Idempotency-Key: ord_1001_block
Content-Type: application/json
```

---

## 3. Multi-Tenant State Isolation
- Every table in SQLite (`raw_transactions`, `canonical_transactions`, `feature_records`, `evaluation_records`, `merchant_integrations`, `merchant_actions`) contains a required `merchant_id` foreign key.
- Endpoints enforcing session tokens verify `current_user.merchant_id == resource.merchant_id`. Cross-tenant queries return HTTP 404.
