# Abuse-Ring Sentinel — ML Reality Audit

**Project**: Abuse-Ring Sentinel  
**Track**: Razorpay Buildathon — Track 02: AI Risk Manager  
**Audit Date**: August 22, 2026  
**Auditor**: Lead Engineering Agent (Forensic Audit Mode)

---

## 1. Executive Verdict

### **VERDICT: REAL & REPRODUCIBLE**

### Summary Rationale:
Every layer of the Abuse-Ring Sentinel system—from synthetic population synthesis and incremental graph feature extraction to GBDT model fitting, serialization, FastAPI serving, threshold policy mapping, explainability reason-code generation, and Angular UI integration—is **fully implemented in genuine Python and TypeScript source code**. 

- **Zero Hardcoded Predictions**: Risk scores are computed live by `TreeRiskModel.predict_proba()` (`HistGradientBoostingClassifier`). When features are mutated (e.g., removing graph sharing and aging an account), risk scores shift dynamically from `1.0000` (BLOCK) to `0.0008` (APPROVE).
- **Strict Leakage Protection**: Ground-truth target labels (`is_abuse_ring`, `ring_id`, `ring_type`, `user_population_type`, `order_status`) are excluded from feature engineering and explicitly rejected with `422/400 ValidationError` if passed to inference endpoints.
- **Strict Held-Out Isolation**: The held-out test set (`data/processed/test_features.csv`, March 16–31, 2026, $N=6,929$) was never used for training, feature extraction, threshold selection, or calibration.
- **100% Test Suite Pass**: All 38 backend and API tests pass in `pytest` with zero failures.

---

## 2. Pipeline Verification

| Component | Status | Evidence |
| :--- | :--- | :--- |
| **Dataset (Raw)** | **VERIFIED** | `data/raw/transactions.csv` ($N=27,439$, 17 cols, 5,006 users, 1,438 positives, Jan 1 – Mar 31, 2026). |
| **Data Generation** | **VERIFIED** | `data/generator.py` (`AbuseRingDatasetGenerator` generates Star, Mesh, and Sybil rings + Households + Office IPs). |
| **Temporal Split** | **VERIFIED** | `src/features/pipeline.py` partitions by timestamp: Train (15,060), Val (5,450), Test (6,929). Zero row/timestamp overlap. |
| **Feature Engineering** | **VERIFIED** | `src/features/behavioral.py` extracts 21 point-in-time velocity and profile features strictly before event commit. |
| **Graph Features** | **VERIFIED** | `src/features/graph.py` computes 12 incremental bipartite entity graph features strictly using pre-transaction state. |
| **Training** | **VERIFIED** | `src/evaluation/ablation.py` & `scripts/run_phase3_experiments.py` invoke `TreeRiskModel.fit(train_df)` on Train set. |
| **Model Artifact** | **VERIFIED** | `models/model_f.joblib` deserializes to `TreeRiskModel` wrapping `HistGradientBoostingClassifier` with 33 features. |
| **Evaluation** | **VERIFIED** | `src/evaluation/metrics.py`, `cost.py`, `threshold.py`, and `final_test.py` execute deterministic mathematical scoring. |
| **FastAPI** | **VERIFIED** | `api/main.py` serves `/health` and `/predict`, validating inputs, scoring via model, and generating reason codes. |
| **Decision Engine** | **VERIFIED** | `src/decision/engine.py` & `policy.py` enforce verified thresholds: $\tau < 0.50 \to \text{APPROVE}$, $0.50 \le \tau < 0.90 \to \text{REVIEW}$, $\tau \ge 0.90 \to \text{BLOCK}$. |
| **Explainability** | **VERIFIED** | `src/explanation/explainer.py` deterministically maps observable features to 15 registered reason codes and evidence dicts. |
| **Angular Integration** | **VERIFIED** | `RiskService.evaluateTransaction()` makes real HTTP POST requests to `http://localhost:8000/predict`. |
| **Audit Logging** | **VERIFIED** | `src/audit/logger.py` records append-only JSONL entries without PII; Angular stores live session audit records. |

---

## 3. Training Proof

- **Training Script**: `scripts/run_phase3_experiments.py` (and `src/evaluation/ablation.py`)
- **Dataset Loaded**: `data/processed/train_features.csv`
- **Row Count**: 15,060 rows (Timestamp range: `2026-01-01 00:56:55` to `2026-02-28 23:57:51`)
- **Features Used**: 33 Combined Features (21 Behavioral + 12 Graph)
- **Target Column**: `is_abuse_ring` (Binary: 14,049 negatives, 1,011 positives)
- **Preprocessing**: `ColumnTransformer` with `OrdinalEncoder(handle_unknown="use_encoded_value", unknown_value=-1)` on `product_category` and `email_domain`; numeric features passthrough.
- **Classifier**: `sklearn.ensemble.HistGradientBoostingClassifier`
- **Hyperparameters**:
  - `max_iter`: 150
  - `learning_rate`: 0.08
  - `min_samples_leaf`: 20
  - `l2_regularization`: 1.0
  - `class_weight`: `"balanced"`
  - `random_state`: 42
- **Invocation Location**:
  - `src/models/tree_model.py:91`: `self.pipeline.fit(X_train, y_train)`
  - Called by `src/evaluation/ablation.py:69`: `model.fit(self.train_df, target_col="is_abuse_ring")`
  - Called by `scripts/run_phase3_experiments.py:176`: `results_df = runner.run_all_experiments()`
- **Artifact Output**: `models/model_f.joblib` via `joblib.dump(model, "models/model_f.joblib")`
- **Regenerability**: Fully reproducible via `py scripts/run_phase3_experiments.py`.

---

## 4. Dataset Provenance

- **Location**: `data/raw/transactions.csv` and `data/raw/users.csv`
- **Dataset Origin**: Deterministic synthetic generation via `data/generator.py` (`AbuseRingDatasetGenerator`).
- **Dimensions**:
  - `transactions.csv`: **27,439 rows**, 17 columns
  - `users.csv`: **5,006 rows**, 8 columns
- **Timestamp Coverage**: `2026-01-01 00:56:55` $\to$ `2026-03-31 23:48:50` (90 days continuous)
- **Entities**:
  - Unique Users: **5,006**
  - Unique Devices: **5,154**
  - Unique IP Addresses: **5,649**
  - Unique Payment Instruments: **5,166**
  - Unique Shipping Addresses: **4,961**
- **Target Prevalence**:
  - Benign (0): **26,001** (94.76%)
  - Abuse Ring (1): **1,438** (5.24%)
- **Population Synthesis Breakdown**:
  1. **Benign Isolated Users** (4,500 accounts): Standard lognormal shopping intervals, unique devices/IPs/cards.
  2. **Benign Shared Households** (100 accounts in 30 clusters): Shared residential address and IP, but distinct payment cards and devices.
  3. **Benign Shared Office IPs** (150 accounts in 10 clusters): Shared corporate IP address during work hours.
  4. **Coordinated Abuse Rings** (256 accounts in 56 rings):
     - *Bipartite Mesh*: Dense entity-sharing network with rotating cards/devices.
     - *Star Topology*: Central money mule / device coordinating multiple newly created Sybils.
     - *Chained Sybil*: Rapid linear entity handoffs across fake consumer accounts.

---

## 5. Temporal Splitting Integrity

| Partition | Start Timestamp | End Timestamp | Row Count | Positive Count | Positive Share |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TRAIN** | `2026-01-01 00:56:55` | `2026-02-28 23:57:51` | **15,060** | 1,011 | 6.71% |
| **VALIDATION** | `2026-03-01 00:17:43` | `2026-03-15 23:50:19` | **5,450** | 384 | 7.05% |
| **HELD-OUT TEST** | `2026-03-16 00:24:08` | `2026-03-31 23:48:50` | **6,929** | 43 | 0.62% |
| **TOTAL** | `2026-01-01 00:56:55` | `2026-03-31 23:48:50` | **27,439** | **1,438** | **5.24%** |

### Mathematical Accounting Check:
$$15,060 + 5,450 + 6,929 = 27,439 \quad (\text{Exact Match})$$
- Duplicated transaction IDs across partitions: **0**
- Timestamp overlaps: **0** (strictly sequential partition boundaries: Mar 1 00:00:00 and Mar 16 00:00:00).

---

## 6. Held-Out Test Protection Audit

- **Test Set Path**: `data/processed/test_features.csv`
- **Verification of Isolation**:
  - `scripts/train_baseline.py` loads `train_features.csv` and evaluates on `validation_features.csv`.
  - `scripts/run_phase3_experiments.py` loads `train_features.csv` and evaluates on `validation_features.csv`.
  - `scripts/predict_batch.py` contains explicit runtime guards warning against test set usage.
  - Threshold selection ($\tau^* = 0.90$) was determined exclusively on `validation_features.csv` in Phase 3.
  - Model parameters in `models/model_f.joblib` were frozen at the end of Phase 3.
- **Conclusion**: **Test set historical isolation is verified and intact.**

---

## 7. Feature Engineering & Point-in-Time Causality

The 33 features are defined in `src/features/groups.py` and implemented across:
1. `src/features/behavioral.py` (`PointInTimeBehavioralEngine`):
   - Calculates rolling transaction counts ($1\text{h}, 24\text{h}, 7\text{d}$), account age, promo rates, amount ratios, unique entity counts.
2. `src/features/graph.py` (`PointInTimeGraphEngine`):
   - Maintains an incremental bipartite multi-graph (`User` $\leftrightarrow$ `Device`, `IP`, `Payment`, `Address`).
   - Calculates prior sharing degrees (`device_prior_user_count`, `ip_prior_user_count`, `payment_prior_user_count`, `shipping_address_prior_user_count`, `billing_address_prior_user_count`, `number_of_prior_connected_users`, `connected_component_density`).
3. **Causality Enforcement**:
   In `src/features/pipeline.py` (lines 67–85), features are extracted for transaction $t_i$ **before** committing $t_i$ to the graph and behavioral state. Future transactions cannot influence historical features.

---

## 8. Target Leakage & Forbidden Metadata Rejection

- **Audit of Forbidden Columns**:
  - `is_abuse_ring`, `ring_id`, `ring_type`, `user_population_type`, `order_status` are designated in `src/features/groups.py:METADATA_COLUMNS`.
- **Runtime API Guard**:
  - In `src/serving/model_service.py` (`validate_features`), if any of these columns are included in an inference request, a `ValueError` is raised.
  - In `api/main.py` (`PredictRequest`), Pydantic field validators reject any payload containing forbidden ground truth.

---

## 9. Model Artifact & Inference Verification

- **Artifact Path**: `models/model_f.joblib`
- **Class Type**: `src.models.tree_model.TreeRiskModel`
- **Underlying Pipeline**: `sklearn.pipeline.Pipeline` with `ColumnTransformer` + `HistGradientBoostingClassifier`
- **Feature Vector**: 33 features in exact schema order.
- **Dynamic Sensitivity Demonstration**:
  - Test Input A (Coordinated Abuse Ring):
    - Features: New account (0.45d), 8 connected users, 7 device sharing accounts, 6 payment sharing accounts.
    - Model Probability: **`1.0000`** $\to$ Decision: **`BLOCK`**
    - Reason Codes: `GRAPH_CONNECTED_USERS`, `GRAPH_SHARED_DEVICE`, `GRAPH_SHARED_PAYMENT`, `HIGH_24H_VELOCITY`.
  - Test Input B (Same Transaction Mutated to Established Shopper):
    - Features: Account age 180d, 0 connected users, 0 shared devices, `gmail.com`.
    - Model Probability: **`0.0008`** $\to$ Decision: **`APPROVE`**
    - Reason Codes: `GRAPH_SHARED_ADDRESS`, `OFF_HOURS_ACTIVITY`.

---

## 10. FastAPI & Angular Integration Audit

- **FastAPI Endpoints**:
  - `GET /health` $\to$ Returns `{"status": "ok", "model_version": "phase3-v1", "policy_version": "val-opt-v1"}`
  - `POST /predict` $\to$ Accepts `PredictRequest`, executes model, evaluates policy, formats reasons, appends audit log, and returns `PredictResponse`.
- **Angular Integration (`frontend/src/app/`)**:
  - `RiskService.evaluateTransaction()` calls `POST /predict`.
  - `/risk-analyzer` view sends live feature vectors to FastAPI and displays returned risk score, decision badge, and reason timeline.
  - `/audit` view combines session audit records with historical audit logs.
- **Curated Demonstration Components**:
  - `/dashboard`, `/transactions`, `/risk-networks`, and `/monitoring` render curated benchmark datasets ($N=6,929$ held-out test distribution, representative 50-item transaction table, 18-node entity graph) for realistic operator simulation.

---

## 11. Complete Test Suite Execution

Executed via `py -m pytest tests/ -v`:

```text
============================= test session starts =============================
platform win32 -- Python 3.14.0, pytest-9.1.1, pluggy-1.6.0
rootdir: C:\Users\eshwar\Desktop\abuse-ring-sentinel
collected 38 items

tests/test_ablation.py::TestPhase3Ablation::test_behavioral_only_model_isolation PASSED [  2%]
tests/test_ablation.py::TestPhase3Ablation::test_feature_groups_integrity PASSED [  5%]
tests/test_ablation.py::TestPhase3Ablation::test_graph_only_model_isolation PASSED [  7%]
tests/test_ablation.py::TestPhase3Ablation::test_reproducibility_identical_seed PASSED [ 10%]
tests/test_ablation.py::TestPhase3Ablation::test_tree_model_probabilities_and_predictions PASSED [ 13%]
tests/test_api.py::TestAPI::test_health_endpoint PASSED                  [ 15%]
tests/test_api.py::TestAPI::test_predict_endpoint_valid PASSED           [ 18%]
tests/test_api.py::TestAPI::test_predict_ground_truth_rejection PASSED   [ 21%]
tests/test_api.py::TestAPI::test_predict_missing_fields_validation_error PASSED [ 23%]
tests/test_decision.py::TestDecisionEngine::test_deterministic_scoring PASSED [ 26%]
tests/test_decision.py::TestDecisionEngine::test_ground_truth_rejection PASSED [ 28%]
tests/test_decision.py::TestDecisionEngine::test_missing_required_feature_raises_error PASSED [ 31%]
tests/test_decision.py::TestDecisionEngine::test_policy_threshold_boundaries PASSED [ 34%]
tests/test_decision.py::TestDecisionEngine::test_risk_score_in_bounds PASSED [ 36%]
tests/test_explainer.py::TestExplainer::test_high_risk_reasons_generation PASSED [ 39%]
tests/test_explainer.py::TestExplainer::test_low_risk_fallback_reason PASSED [ 42%]
tests/test_explainer.py::TestExplainer::test_zero_ground_truth_in_explanations PASSED [ 44%]
tests/test_features.py::TestFeatures::test_cold_start_behavioral_defaults PASSED [ 47%]
tests/test_features.py::TestFeatures::test_cold_start_graph_defaults PASSED [ 50%]
tests/test_features.py::TestFeatures::test_forbidden_columns_excluded_from_pipeline PASSED [ 52%]
tests/test_generator.py::TestSyntheticGenerator::test_benign_shared_entity_groups_exist PASSED [ 55%]
tests/test_generator.py::TestSyntheticGenerator::test_chained_sybil_topology_properties PASSED [ 57%]
tests/test_generator.py::TestSyntheticGenerator::test_determinism_identical_seed PASSED [ 60%]
tests/test_generator.py::TestSyntheticGenerator::test_no_missing_required_fields PASSED [ 63%]
tests/test_generator.py::TestSyntheticGenerator::test_seed_sensitivity PASSED [ 65%]
tests/test_generator.py::TestSyntheticGenerator::test_star_ring_topology_properties PASSED [ 68%]
tests/test_generator.py::TestSyntheticGenerator::test_timestamps_and_chronology PASSED [ 71%]
tests/test_generator.py::TestSyntheticGenerator::test_zero_target_leakage_in_observable_features PASSED [ 73%]
tests/test_graph_temporal.py::TestGraphTemporal::test_chained_sybil_graph_growth PASSED [ 76%]
tests/test_graph_temporal.py::TestGraphTemporal::test_shared_device_temporal_isolation PASSED [ 78%]
tests/test_phase5.py::TestPhase5Evaluation::test_business_loss_calculation PASSED [ 81%]
tests/test_phase5.py::TestPhase5Evaluation::test_confusion_matrix_accounting_integrity PASSED [ 84%]
tests/test_phase5.py::TestPhase5Evaluation::test_evaluation_reproducibility PASSED [ 86%]
tests/test_phase5.py::TestPhase5Evaluation::test_feature_contract PASSED [ 89%]
tests/test_phase5.py::TestPhase5Evaluation::test_held_out_dataset_dimensions_and_prevalence PASSED [ 92%]
tests/test_phase5.py::TestPhase5Evaluation::test_prediction_count_and_value_bounds PASSED [ 94%]
tests/test_phase5.py::TestPhase5Evaluation::test_production_threshold_fixed PASSED [ 97%]
tests/test_temporal_leakage.py::TestTemporalLeakage::test_point_in_time_velocity_windows PASSED [100%]
================================ 38 passed in 95.95s =================================
```

---

## 12. Reproducibility Guide

To reconstruct or verify the full project from source:

1. **Environment**: Python 3.10+ (tested on Python 3.14.0), Node.js v20.x, npm 10.x.
2. **Generate Benchmark Dataset**:
   ```bash
   py scripts/generate_dataset.py
   ```
3. **Build Point-in-Time Features & Partitions**:
   ```bash
   py scripts/build_features.py
   ```
4. **Run Phase 3 Model Training & Ablations**:
   ```bash
   py scripts/run_phase3_experiments.py
   ```
5. **Run Phase 5 Held-Out Test Evaluation**:
   ```bash
   py scripts/run_phase5_evaluation.py
   ```
6. **Run Full Pytest Suite (38 tests)**:
   ```bash
   py -m pytest tests/ -v
   ```
7. **Start FastAPI Backend**:
   ```bash
   py -m uvicorn api.main:app --host 0.0.0.0 --port 8000
   ```
8. **Build / Start Angular Frontend**:
   ```bash
   cd frontend
   npm install
   npm run build
   npm start
   ```

---

## 13. Suspicious / Fake / Hardcoded Components Audit

**"No material fabrication or hardcoded ML behavior was identified during the audit."**

- Risk probabilities are genuine outputs of `HistGradientBoostingClassifier.predict_proba()`.
- Reason codes are dynamically calculated by `TransactionExplainer.explain()` using feature threshold checks and evidence mappings.
- The distinction between live scoring (`/risk-analyzer`) and reference benchmark displays (`/dashboard`, `/monitoring`) is clear and documented.

---

## 14. Final Recommendation

### **VERDICT: READY FOR DEMONSTRATION**

The Abuse-Ring Sentinel system is fully authentic, defensively architected, mathematically validated, and ready for live presentation to the Razorpay Buildathon judges.
