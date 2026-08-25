# Phase 13 — Demo Environment vs. Live Merchant Data Separation Report

**Project**: Abuse-Ring Sentinel  
**Track**: Razorpay Buildathon — Track 02: AI Risk Manager  
**Audit Date**: 2026-08-25T17:56:00Z  
**Author**: Lead Systems Auditor  

---

## 1. Executive Summary

Phase 13 establishes strict separation between the pre-computed historical evaluation benchmark dataset and live runtime merchant operations. This ensures zero data contamination and guarantees that a prospective merchant's live dashboard starts with accurate runtime state ($N=0$) rather than displaying offline research benchmarks.

---

## 2. Environment Comparison Matrix

```
┌──────────────────────────────┬────────────────────────────────┬────────────────────────────────┐
│ Dimension                    │ Demo Environment (/demo)       │ Live Merchant App (/app/*)     │
├──────────────────────────────┼────────────────────────────────┼────────────────────────────────┤
│ Data Origin                  │ Phase 5 Held-out Test Set      │ Active SQLite State Store      │
│ Sample Size (N)              │ Exactly 6,929 Transactions     │ N = 0 (New) → Dynamic Growth   │
│ Approval Count               │ 6,867 (99.11%)                 │ Real evaluated transactions    │
│ Abuse Attacks Intercepted    │ 43 / 43 (100.0% Recall)        │ Real-time Sybil detections     │
│ Entity Graph Topology        │ Curated Sybil cluster demo     │ Dynamic NetworkX tenant graph  │
│ UI Identification Badge      │ ⚠️ DEMO ENVIRONMENT            │ ● LIVE MERCHANT                │
│ Evaluation Mechanism         │ Precomputed Benchmark Array    │ POST /api/v1/risk/evaluate     │
│ Access Control               │ Public / Unauthenticated       │ Protected by AuthGuard         │
└──────────────────────────────┴────────────────────────────────┴────────────────────────────────┘
```

---

## 3. Zero-Data State for New Merchants

When a new merchant registers and logs into the platform:
1. `GET /api/v1/merchant/metrics` returns `zero_data_state: true`, `total_transactions: 0`, `approvals: 0`, `blocks: 0`.
2. `/app/overview` displays the dedicated Zero-Data State banner:
   *"Waiting for your first transaction. Your live merchant account has 0 recorded transactions."*
3. Interactive CTAs (*"Send Live Test Transaction"*, *"Open Risk Analyzer"*, *"View API Docs"*) enable immediate live event submission.
4. As soon as a transaction is evaluated via API or UI, the live metrics, decision distribution, and recent transactions table dynamically populate.

---

## 4. Verification Verdict

All demo dataset elements have been isolated to `/demo`. The live merchant console at `/app/*` interacts exclusively with active runtime tenant state.
