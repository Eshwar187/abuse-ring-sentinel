# Phase 7 Baseline Report

**Project**: Abuse-Ring Sentinel  
**Track**: Razorpay Buildathon — Track 02 (AI Risk Manager)  
**Baseline Date**: August 22, 2026  
**Status**: Pre-Audit Baseline Established

---

## 1. System Environment

- **OS**: Windows
- **Python Version**: 3.14.0
- **Node Version**: v20.20.0 (LTS), npm: 10.8.2
- **Angular Version**: 19.2.27
- **Test Runner**: pytest 9.1.1, pluggy 1.6.0

---

## 2. Component Status

| Layer | Component | Status |
| :--- | :--- | :--- |
| **Data Engine** | `data/generator.py` | Operational (Deterministic synthetic benchmark: 27,439 tx, 5,006 users) |
| **Feature Pipeline** | `src/features/pipeline.py` | Operational (33 point-in-time features with temporal causality) |
| **Model Registry** | `models/model_f.joblib` | Operational (`HistGradientBoostingClassifier`, frozen Phase 3) |
| **Decision Engine** | `src/decision/engine.py` | Operational ($\tau^* = 0.90$, APPROVE / REVIEW / BLOCK) |
| **Explainability** | `src/explanation/explainer.py` | Operational (15 deterministic reason codes + evidence mappings) |
| **Audit Logging** | `src/audit/logger.py` | Operational (`reports/audit_log.jsonl` append-only) |
| **FastAPI Backend** | `api/main.py` | Operational (`GET /health`, `POST /predict`, Static SPA mount) |
| **Angular Frontend** | `frontend/` | Operational (Angular 19, Tailwind CSS, ECharts, Cytoscape.js) |

---

## 3. Existing Test Baseline

- **Total Test Cases**: 38
- **Passed**: 38 (100.0%)
- **Failed**: 0
- **Warnings**: 12 (standard asyncio deprecation warnings in python 3.14)
- **Execution Time**: ~95s - 406s
- **All 38 Unit & Integration Tests Pass**:
  - `test_ablation.py`: 5 passed
  - `test_api.py`: 4 passed
  - `test_decision.py`: 5 passed
  - `test_explainer.py`: 3 passed
  - `test_features.py`: 3 passed
  - `test_generator.py`: 8 passed
  - `test_graph_temporal.py`: 2 passed
  - `test_phase5.py`: 7 passed
  - `test_temporal_leakage.py`: 1 passed

---

## 4. Frozen Production Model Specifications

- **Model Artifact Path**: `models/model_f.joblib`
- **Model Algorithm**: `HistGradientBoostingClassifier`
- **Model Version**: `phase3-v1`
- **Feature Version**: `features-v2` (33 features)
- **Policy Version**: `val-opt-v1`
- **Validation-Selected Threshold**: $\tau^* = 0.90$
- **Held-Out Test Set**: `data/processed/test_features.csv` (Frozen: $N=6,929$, Mar 16–31, 2026)
