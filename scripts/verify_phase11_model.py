import sys
import os
sys.path.insert(0, os.path.abspath("."))
import inspect
import joblib
from src.serving.model_service import ModelServingService
from src.decision.engine import RiskDecisionEngine

print("=== 1. CHECK MODEL DESERIALIZATION ===")
service = ModelServingService()
print(f"Model loaded: {service.model is not None}")
print(f"Model class: {service.model.__class__.__name__}")
clf = service.model.pipeline.named_steps["classifier"]
print(f"Underlying classifier: {clf.__class__.__name__}")
print(f"Expected feature count: {len(service.model.feature_names_)}")
print(f"predict_proba available: {hasattr(service.model, 'predict_proba')}")

print("\n=== 2. CHECK STARTUP DOES NOT RETRAIN ===")
init_source = inspect.getsource(service._load_model)
print("Source of _load_model:")
print(init_source)
assert "fit(" not in init_source
assert "fit_transform(" not in init_source
assert "train(" not in init_source
assert "partial_fit(" not in init_source
print("[+] Verified: Zero training or fitting occurs during startup.")
