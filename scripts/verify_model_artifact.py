"""
Phase 7 Model Artifact Verification Utility.

Programmatically verifies:
1. File existence of models/model_f.joblib
2. Deserialization integrity
3. Classifier type (HistGradientBoostingClassifier wrapped in TreeRiskModel)
4. Feature schema contract (33 Combined Features)
5. Non-destructive probabilistic inference
6. Probability bounds in [0.0, 1.0]
7. Deterministic repeat evaluation
8. Zero retraining verification
"""

import os
import sys
import joblib
import numpy as np
import pandas as pd

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.features.groups import COMBINED_FEATURES
from src.models.tree_model import TreeRiskModel


def verify_model_artifact(artifact_path: str = "models/model_f.joblib") -> bool:
    print(f"[*] Verifying model artifact at: {artifact_path}")
    if not os.path.exists(artifact_path):
        print(f"[FAIL] Artifact not found at {artifact_path}")
        return False

    initial_mtime = os.path.getmtime(artifact_path)

    # 1. Load model
    try:
        model = joblib.load(artifact_path)
    except Exception as e:
        print(f"[FAIL] Failed to deserialize model: {e}")
        return False

    # 2. Check model type
    if not isinstance(model, TreeRiskModel):
        print(f"[FAIL] Expected TreeRiskModel instance, got {type(model)}")
        return False

    if not hasattr(model, "pipeline") or model.pipeline is None:
        print("[FAIL] Model pipeline is not initialized.")
        return False

    clf = model.pipeline.named_steps.get("classifier")
    clf_type_name = clf.__class__.__name__
    if clf_type_name != "HistGradientBoostingClassifier":
        print(f"[FAIL] Expected HistGradientBoostingClassifier, got {clf_type_name}")
        return False

    # 3. Check expected feature count
    expected_feats = len(COMBINED_FEATURES)
    actual_feats = len(model.feature_names_)
    if actual_feats != expected_feats or actual_feats != 33:
        print(f"[FAIL] Expected 33 features, got {actual_feats}")
        return False

    # 4. Create synthetic test input vector (33 features)
    test_dict = {feat: 0.0 for feat in COMBINED_FEATURES}
    test_dict["product_category"] = "electronics"
    test_dict["email_domain"] = "gmail.com"
    test_dict["amount"] = 125.00
    test_dict["account_age_days"] = 30.0

    df_test = pd.DataFrame([test_dict])

    # 5. Predict probabilities
    try:
        probs = model.predict_proba(df_test)
    except Exception as e:
        print(f"[FAIL] predict_proba failed: {e}")
        return False

    if len(probs) != 1:
        print(f"[FAIL] Expected 1 probability output, got {len(probs)}")
        return False

    p = float(probs[0])
    if not (0.0 <= p <= 1.0):
        print(f"[FAIL] Probability out of bounds [0, 1]: {p}")
        return False

    # 6. Verify deterministic evaluation
    probs2 = model.predict_proba(df_test)
    if not np.isclose(probs[0], probs2[0]):
        print(f"[FAIL] Non-deterministic prediction: {probs[0]} vs {probs2[0]}")
        return False

    # 7. Check that file was not modified (mtime intact)
    final_mtime = os.path.getmtime(artifact_path)
    if initial_mtime != final_mtime:
        print("[FAIL] Model file mtime changed during verification!")
        return False

    print(f"[+] Artifact verified successfully:")
    print(f"    - Type: {clf_type_name}")
    print(f"    - Feature count: {actual_feats}")
    print(f"    - Sample probability output: {p:.6f}")
    print(f"    - Deterministic: True")
    print(f"    - Zero retraining: Verified")
    print(f"\nMODEL_ARTIFACT_REAL = true\n")
    return True


if __name__ == "__main__":
    success = verify_model_artifact()
    if not success:
        sys.exit(1)
