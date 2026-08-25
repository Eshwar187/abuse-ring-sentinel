# Phase 13 — Security & Key Management Audit Report

**Project**: Abuse-Ring Sentinel  
**Track**: Razorpay Buildathon — Track 02: AI Risk Manager  
**Audit Date**: 2026-08-25T17:59:00Z  
**Author**: Lead Security Engineer  

---

## 1. Executive Summary

This report evaluates the cryptographic security, credential lifecycle, and tenant access controls implemented across Abuse-Ring Sentinel's API Gateway and Web Application.

---

## 2. Key Findings & Security Controls

### 2.1 Password Security
- Passwords stored in `users` table are hashed using **PBKDF2-HMAC-SHA256** with 100,000 iterations and a unique 16-byte cryptographic salt.
- Plaintext passwords are never logged, stored in state, or serialized into responses.

### 2.2 API Key Lifecycle & Rotation
- API keys are issued with a distinct prefix `ars_live_` followed by 40 hex random bytes generated via `secrets.token_hex(20)`.
- Raw keys are shown to the merchant **exactly once** upon account creation or explicit rotation.
- Only the SHA-256 hash and masked prefix (`ars_live_••••••••`) are stored in the database.
- Key rotation (`POST /api/v1/auth/rotate-key`) immediately sets `is_active = 0` and `revoked_at` on previous keys, invalidating them for all future requests.

### 2.3 Timing Attack Prevention
- Authentication checks in `authenticate_merchant` and `verify_password` use `hmac.compare_digest` for constant-time evaluation to eliminate timing side-channel vulnerabilities.

### 2.4 PII Scrubbing & Data Sanitization
- Raw inputs containing PANs, CVVs, full payment numbers, or passwords are explicitly rejected by Pydantic validation before feature extraction.
- Audit logs scrub and mask sensitive metadata fields before persisting.
