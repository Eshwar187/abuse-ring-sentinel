# Phase 10 — Repository Inventory & Forensic Classification

**Project**: Abuse-Ring Sentinel  
**Track**: Razorpay Buildathon — Track 02: AI Risk Manager  
**Audit Date**: August 23, 2026  
**Auditor**: Lead Buildathon Judge & Security Reviewer

---

## 1. Repository File Classification

| Category | File Paths / Directories | Purpose & Retention Policy |
| :--- | :--- | :--- |
| **Core Model Artifacts** | `models/model_f.joblib` | **MUST KEEP (FROZEN)**. Serialized `HistGradientBoostingClassifier` model candidate from Phase 3. |
| **Processed Data** | `data/processed/train_features.csv`<br>`data/processed/validation_features.csv`<br>`data/processed/test_features.csv` | **MUST KEEP (FROZEN)**. Point-in-time feature partitions. `test_features.csv` is read-only. |
| **Raw Synthetic Data** | `data/raw/transactions.csv`<br>`data/raw/users.csv`<br>`data/raw/rings_metadata.json` | **MUST KEEP**. 90-day multi-topology synthetic benchmark dataset. |
| **Demo Assets** | `data/demo/demo_transactions.csv`<br>`data/demo/phase7_controls/low_risk_control.json`<br>`data/demo/phase7_controls/high_risk_control.json` | **MUST KEEP**. Curated test scenarios for the live Interactive Risk Studio. |
| **Backend & Serving** | `api/main.py`<br>`src/config.py`<br>`src/decision/`<br>`src/explanation/`<br>`src/features/`<br>`src/models/`<br>`src/audit/`<br>`src/monitoring/` | **MUST KEEP**. Production FastAPI service, feature engineering, decision policy, and audit logger. |
| **Frontend SPA** | `frontend/src/app/`<br>`frontend/src/environments/`<br>`frontend/angular.json`<br>`frontend/package.json`<br>`frontend/tailwind.config.js` | **MUST KEEP**. Angular 19 merchant risk management web console. |
| **Automated Tests** | `tests/test_generator.py`<br>`tests/test_features.py`<br>`tests/test_temporal_leakage.py`<br>`tests/test_graph_temporal.py`<br>`tests/test_ablation.py`<br>`tests/test_decision.py`<br>`tests/test_explainer.py`<br>`tests/test_api.py`<br>`tests/test_phase5.py`<br>`tests/test_phase7.py`<br>`tests/test_phase8_security.py` | **MUST KEEP**. Complete 54-test regression test suite. |
| **Packaging & Docker** | `Dockerfile`<br>`.dockerignore`<br>`requirements.txt`<br>`.env.example`<br>`.gitignore` | **MUST KEEP**. Container deployment and environment configuration files. |
| **Documentation & Reports** | `README.md`<br>`reports/phase3_ablation.md`<br>`reports/phase4_architecture.md`<br>`reports/phase5_final_report.md`<br>`reports/phase6_5_reality_audit.md`<br>`reports/phase7_end_to_end_audit.md`<br>`reports/phase8_production_audit.md`<br>`reports/phase9_final_product_audit.md`<br>`reports/audit_log.jsonl` | **MUST KEEP**. Milestone engineering proofs, evaluation logs, and audit trails. |

---

## 2. Suspicious & Stale Files Analysis

- **Temporary/Debug Files**: None found.
- **Accidental `.env` Files**: Verified `.env` is absent and excluded by `.gitignore`.
- **Node Modules / Caches**: `node_modules/`, `.angular/`, and `__pycache__/` are strictly ignored by `.gitignore`.
- **Verdict**: **Repository hygiene is 100% clean and submission-ready.**
