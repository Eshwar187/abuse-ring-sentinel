# Phase 12 — Model Integrity & Artifact Immutability Report

**Project**: Abuse-Ring Sentinel  
**Track**: Razorpay Buildathon — Track 02: AI Risk Manager  
**Audit Date**: 2026-08-25T14:30:00Z  
**Author**: Antigravity Forensic Auditor  

---

## 1. Executive Summary

Phase 12 converted Abuse-Ring Sentinel into an API-first real merchant integration platform. A strict invariant of Phase 12 is that **the underlying machine learning model artifact (`models/model_f.joblib`) must remain completely frozen, unmodified, and un-retrained**.

This report documents the cryptographic integrity audit proving that the frozen production model artifact and the held-out test dataset remain 100% bit-for-bit identical to the Phase 5/Phase 6 baseline.

---

## 2. Cryptographic Hash Verification

| Artifact Path | Expected Baseline SHA-256 | Actual Verified SHA-256 | Verification Status |
| :--- | :--- | :--- | :--- |
| `models/model_f.joblib` | `a288f019a2693c04c5d6a2c454da4e9c9f7c54f1298b5777ab276cbca9a6dd9c` | `a288f019a2693c04c5d6a2c454da4e9c9f7c54f1298b5777ab276cbca9a6dd9c` | **MATCH (VERIFIED)** |
| `data/processed/test_features.csv` | `be9b9f921948862a9fff52c9d6202bd2f6b1bf9c07a7725844bc2f5dad3a14cd` | `be9b9f921948862a9fff52c9d6202bd2f6b1bf9c07a7725844bc2f5dad3a14cd` | **MATCH (UNTOUCHED)** |

---

## 3. Production Model Metadata & Policy Contract

- **Model Identifier**: `abuse_ring_sentinel`
- **Algorithm**: `HistGradientBoostingClassifier` (Scikit-Learn)
- **Model Version**: `phase3-v1`
- **Feature Version**: `phase2-v1` (33 Combined Features)
- **Production Threshold ($\tau^*$)**: `0.90` (Fixed)
- **Decision Policy**:
  - Probability Score $< 0.50 \implies \mathbf{APPROVE}$
  - Probability Score $0.50 \le P < 0.90 \implies \mathbf{REVIEW}$
  - Probability Score $\ge 0.90 \implies \mathbf{BLOCK}$

---

## 4. Immutability of Post-Decision Outcomes

Merchants submit post-decision outcomes (e.g. `CONFIRMED_FRAUD`, `CHARGEBACK`, `LEGITIMATE`) via `POST /api/v1/outcomes`.

**Audit Proof**:
- Outcome submissions write exclusively to `runtime_outcomes` table in SQLite (`data/runtime/runtime_state.db`).
- Zero automated retraining routines exist in the inference path.
- Post-outcome cryptographic check verified `models/model_f.joblib` hash remained `a288f019a2693c04c5d6a2c454da4e9c9f7c54f1298b5777ab276cbca9a6dd9c`.

**Audit Conclusion**: Model integrity is 100% intact with zero drift, zero refitting, and zero leakage.
