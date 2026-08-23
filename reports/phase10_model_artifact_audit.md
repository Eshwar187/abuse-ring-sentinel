# Phase 10 — Model Artifact Forensic Audit Report

**Project**: Abuse-Ring Sentinel  
**Track**: Razorpay Buildathon — Track 02: AI Risk Manager  
**Audit Date**: August 23, 2026  
**Auditor**: Lead ML Auditor

---

## 1. Model Artifact Verification Summary

- **Artifact Path**: `models/model_f.joblib`
- **File Size**: 319,786 bytes
- **SHA-256 Hash**: `a288f019a2693c04c5d6a2c454da4e9c9f7c54f1298b5777ab276cbca9a6dd9c`
- **Deserialization Wrapper**: `src.models.tree_model.TreeRiskModel`
- **Core Estimator**: `sklearn.ensemble.HistGradientBoostingClassifier`
- **Input Feature Count**: Exactly 33 features (matching `COMBINED_FEATURES`)

---

## 2. Independent Deterministic Inference Test

Tested against controlled synthetic input vectors:
- **Low-Risk Vector**:
  - Probability output: `0.000099` ($< 0.01\%$)
  - Repeat probability output: `0.000099` (Deterministic: **True**)
  - Decision: **`APPROVE`**
- **High-Risk Vector**:
  - Probability output: `1.000000` ($100.00\%$)
  - Repeat probability output: `1.000000` (Deterministic: **True**)
  - Decision: **`BLOCK`**

---

## 3. Verdict

### **VERDICT: PASS (`MODEL_ARTIFACT_REAL = true`)**
- Zero mock inference.
- Zero hardcoded probabilities.
- Model artifact is valid, genuine, and reproducible.
