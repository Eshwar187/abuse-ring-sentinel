# Phase 10 — Model Training Provenance & Lineage Audit

**Project**: Abuse-Ring Sentinel  
**Track**: Razorpay Buildathon — Track 02: AI Risk Manager  
**Audit Date**: August 23, 2026  
**Auditor**: Lead ML Auditor

---

## 1. End-to-End Pipeline Lineage

```
[Raw Synthetic Benchmark]
  ├── data/raw/transactions.csv (27,439 transactions)
  ├── data/raw/users.csv (5,006 user accounts)
  └── data/raw/rings_metadata.json (56 abuse rings across 3 topologies)
              │
              ▼
[Chronological Partitioning & Feature Extraction]
  ├── Train:      2026-01-01 -> 2026-02-28 (N = 15,060) -> data/processed/train_features.csv
  ├── Validation: 2026-03-01 -> 2026-03-15 (N = 5,450)  -> data/processed/validation_features.csv
  └── Test:       2026-03-16 -> 2026-03-31 (N = 6,929)  -> data/processed/test_features.csv (FROZEN)
              │
              ▼
[Phase 3 Ablation & Non-Linear Benchmark]
  ├── Model A: Logistic Regression (Behavioral Only, 21 Feats)
  ├── Model B: Logistic Regression (Graph Only, 12 Feats)
  ├── Model C: Logistic Regression (Combined, 33 Feats)
  ├── Model D: Random Forest (Combined, 33 Feats)
  ├── Model E: Extra Trees (Combined, 33 Feats)
  └── Model F: HistGradientBoosting (Combined, 33 Feats) -> SELECTED
              │
              ▼
[Serialized Production Artifact]
  └── models/model_f.joblib (TreeRiskModel / HistGradientBoostingClassifier)
```

---

## 2. Model Specifications & Hyperparameters

- **Architecture Class**: `src.models.tree_model.TreeRiskModel` wrapping `sklearn.pipeline.Pipeline`
- **Classifier**: `sklearn.ensemble.HistGradientBoostingClassifier`
- **Preprocessing**: `sklearn.compose.ColumnTransformer` applying `OrdinalEncoder(handle_unknown="use_encoded_value", unknown_value=-1)` on categorical columns (`product_category`, `email_domain`).
- **Hyperparameters**:
  - `class_weight`: `"balanced"`
  - `l2_regularization`: `1.0`
  - `learning_rate`: `0.08`
  - `max_iter`: `150`
  - `min_samples_leaf`: `20`
  - `random_state`: `42`
- **Feature Set**: Exactly 33 combined behavioral (21) and graph (12) features defined in `src/features/groups.py:COMBINED_FEATURES`.
- **Operating Policy**: Validation-optimized $\tau^* = 0.90$ (Threshold tuning performed exclusively on `validation_features.csv`).

---

## 3. Retraining Invariant Confirmation

- **Retrained in Phase 10**: **NO**
- **Model File Modified**: **NO**
- **SHA-256 Hash**: `a288f019a2693c04c5d6a2c454da4e9c9f7c54f1298b5777ab276cbca9a6dd9c`
- **Verdict**: **Provenance is 100% verified and reproducible.**
