# Phase 13 — Merchant Onboarding & Integration Report

**Project**: Abuse-Ring Sentinel  
**Track**: Razorpay Buildathon — Track 02: AI Risk Manager  
**Audit Date**: 2026-08-25T17:57:00Z  
**Author**: Lead Product & Developer Experience Engineer  

---

## 1. Executive Summary

Phase 13 introduces a 5-step guided onboarding wizard (`/onboarding`) enabling merchant developers to provision their tenant environment, configure transaction defaults, retrieve API credentials, and execute their first live risk evaluation through the real pipeline in under 2 minutes.

---

## 2. 5-Step Guided Onboarding Breakdown

### Step 1: Configure Merchant Profile
- Merchant business vertical selection (Electronics & Digital Goods, Fashion, Travel, Gaming, Marketplaces).
- Settlement currency selection (INR, USD, EUR).
- Display of the production decision policy (Fixed Threshold $\tau^* = 0.90$).

### Step 2: API Credentials & Authentication
- Presentation of the merchant's active API key.
- One-click copy functionality.
- Security guidance regarding `X-API-Key` and `Authorization: Bearer <key>` headers.

### Step 3: Select Integration SDK / Method
- Live, formatted code snippets in **cURL**, **TypeScript / Node.js**, and **Python**.
- Snippets pre-populated with the merchant's active API key and endpoint target (`POST /api/v1/risk/evaluate`).

### Step 4: Send First Live Risk Evaluation
- Interactive checkout simulator that constructs a valid raw checkout payload.
- Submits payload directly to `POST /api/v1/risk/evaluate`.
- Displays real inference output: Policy Decision, Risk Probability, Latency (ms), and Point-in-time feature validation (33 / 33 OK).

### Step 5: Verification & Complete
- Checklist confirming Tenant Identity, API Authentication, 33-Feature Adapter, and Sub-5ms Frozen Model Inference.
- Direct launch button routing to `/app/overview`.
