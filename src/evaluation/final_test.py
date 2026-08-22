"""
Final Held-Out Test Evaluation Module.

Evaluates the frozen Phase 3 Model F on the unseen held-out test partition
(data/processed/test_features.csv, 2026-03-16 -> 2026-03-31) strictly without retraining,
refitting, or post-hoc threshold adjustment.
"""

from __future__ import annotations
import os
import json
from typing import Dict, Any, List, Tuple, Optional
import numpy as np
import pandas as pd
from sklearn.metrics import (
    precision_recall_curve,
    auc,
    roc_auc_score,
    precision_score,
    recall_score,
    f1_score,
    accuracy_score,
    brier_score_loss,
)

from src.features.groups import COMBINED_FEATURES, METADATA_COLUMNS
from src.serving.model_service import ModelServingService
from src.decision.engine import RiskDecisionEngine
from src.decision.policy import DecisionPolicy


class FinalHeldOutEvaluator:
    """
    Evaluator for the final frozen production model on the held-out test dataset.
    """

    DEFAULT_TEST_PATH = "data/processed/test_features.csv"
    RAW_TX_PATH = "data/raw/transactions.csv"

    def __init__(
        self,
        test_path: Optional[str] = None,
        model_path: Optional[str] = None,
        production_threshold: float = 0.90,
        cost_fp: float = 10.0,
        cost_fn: float = 50.0,
    ):
        self.test_path = test_path or self.DEFAULT_TEST_PATH
        self.production_threshold = production_threshold
        self.cost_fp = cost_fp
        self.cost_fn = cost_fn

        # Load serving engine & model artifact
        self.model_service = ModelServingService(model_path=model_path)
        self.decision_engine = RiskDecisionEngine(
            model_service=self.model_service,
            policy=DecisionPolicy(review_threshold=0.50, block_threshold=self.production_threshold),
        )

        self.test_df: Optional[pd.DataFrame] = None
        self.raw_tx_df: Optional[pd.DataFrame] = None
        self.predictions_df: Optional[pd.DataFrame] = None
        self.y_true: Optional[np.ndarray] = None
        self.y_prob: Optional[np.ndarray] = None

    def load_and_validate_data(self) -> pd.DataFrame:
        """Loads and validates test features and offline evaluation metadata."""
        if not os.path.exists(self.test_path):
            raise FileNotFoundError(f"Held-out test set not found at: {self.test_path}")

        self.test_df = pd.read_csv(self.test_path)

        # Validate required feature contract
        missing_features = [f for f in COMBINED_FEATURES if f not in self.test_df.columns]
        if missing_features:
            raise ValueError(f"Test dataset is missing required features: {missing_features}")

        if "is_abuse_ring" not in self.test_df.columns:
            raise ValueError("Test dataset must contain ground truth target 'is_abuse_ring' for evaluation.")

        self.y_true = self.test_df["is_abuse_ring"].values.astype(int)

        # Load raw transactions offline for ring topology and demographic slicing (never passed to model)
        if os.path.exists(self.RAW_TX_PATH):
            self.raw_tx_df = pd.read_csv(self.RAW_TX_PATH)
        else:
            self.raw_tx_df = None

        return self.test_df

    def run_inference(self) -> pd.DataFrame:
        """Runs batch inference using frozen Model F and Phase 4 Decision Engine."""
        if self.test_df is None:
            self.load_and_validate_data()

        # Extract strictly the 33 observable features for model inference
        X_test = self.test_df[COMBINED_FEATURES]
        self.y_prob = self.model_service.predict_batch(X_test)

        pred_records = []
        for idx, row in self.test_df.iterrows():
            tx_dict = {k: v for k, v in row.to_dict().items() if k not in ("is_abuse_ring", "user_population_type", "ring_type", "ring_id")}
            tx_id = str(tx_dict.get("transaction_id", f"tx_test_{idx:06d}"))

            # Evaluate through decision engine
            res = self.decision_engine.evaluate_features(tx_dict, transaction_id=tx_id)
            reasons = res["reason_codes"]

            r1 = reasons[0]["code"] if len(reasons) > 0 else ""
            r2 = reasons[1]["code"] if len(reasons) > 1 else ""
            r3 = reasons[2]["code"] if len(reasons) > 2 else ""

            pred_records.append({
                "transaction_id": tx_id,
                "timestamp": row.get("timestamp", ""),
                "is_abuse_ring": int(row["is_abuse_ring"]),
                "risk_score": res["risk_score"],
                "risk_level": res["risk_level"],
                "decision": res["decision"],
                "is_blocked": int(res["decision"] == "BLOCK"),
                "top_reason_1": r1,
                "top_reason_2": r2,
                "top_reason_3": r3,
                "model_version": res["model_metadata"]["model_version"],
            })

        self.predictions_df = pd.DataFrame(pred_records)
        return self.predictions_df

    def compute_metrics(self) -> Dict[str, Any]:
        """Calculates full classification, confusion matrix, and business loss metrics."""
        if self.predictions_df is None:
            self.run_inference()

        y_true = self.y_true
        y_prob = self.y_prob
        y_pred = (y_prob >= self.production_threshold).astype(int)

        # 1. PR-AUC and ROC-AUC
        precision_curve, recall_curve, _ = precision_recall_curve(y_true, y_prob)
        pr_auc = float(auc(recall_curve, precision_curve))
        roc_auc = float(roc_auc_score(y_true, y_prob))
        brier = float(brier_score_loss(y_true, y_prob))

        # 2. Confusion Matrix @ threshold = 0.90
        tp = int(np.sum((y_pred == 1) & (y_true == 1)))
        tn = int(np.sum((y_pred == 0) & (y_true == 0)))
        fp = int(np.sum((y_pred == 1) & (y_true == 0)))
        fn = int(np.sum((y_pred == 0) & (y_true == 1)))

        total_tx = len(y_true)
        total_abuse = int(np.sum(y_true))
        total_benign = int(total_tx - total_abuse)

        # Mathematical Accounting Integrity Check
        if (tp + fn) != total_abuse:
            raise ValueError(f"Accounting Error: TP ({tp}) + FN ({fn}) != Total Abuse ({total_abuse})")
        if (tn + fp) != total_benign:
            raise ValueError(f"Accounting Error: TN ({tn}) + FP ({fp}) != Total Benign ({total_benign})")
        if (tp + tn + fp + fn) != total_tx:
            raise ValueError(f"Accounting Error: TP+TN+FP+FN ({tp+tn+fp+fn}) != Total ({total_tx})")

        # 3. Standard Classification Metrics
        prec = float(precision_score(y_true, y_pred, zero_division=0))
        rec = float(recall_score(y_true, y_pred, zero_division=0))
        f1 = float(f1_score(y_true, y_pred, zero_division=0))
        acc = float(accuracy_score(y_true, y_pred))

        # 4. Business Impact Metrics
        baseline_loss = float(total_abuse * self.cost_fn)
        model_loss = float(fp * self.cost_fp + fn * self.cost_fn)
        net_savings = float(baseline_loss - model_loss)
        cost_reduction_pct = float((net_savings / baseline_loss) * 100.0) if baseline_loss > 0 else 0.0

        # 5. Production Decision Distribution
        decision_counts = self.predictions_df["decision"].value_counts().to_dict()
        app_count = int(decision_counts.get("APPROVE", 0))
        rev_count = int(decision_counts.get("REVIEW", 0))
        blk_count = int(decision_counts.get("BLOCK", 0))

        return {
            "dataset_statistics": {
                "test_period": "2026-03-16 -> 2026-03-31",
                "total_transactions": total_tx,
                "abuse_transactions": total_abuse,
                "benign_transactions": total_benign,
                "abuse_prevalence_pct": round((total_abuse / total_tx) * 100.0, 4),
            },
            "model_metadata": {
                "model_name": self.model_service.metadata["model_name"],
                "model_type": self.model_service.metadata["model_type"],
                "model_version": self.model_service.metadata["model_version"],
                "feature_version": self.model_service.metadata["feature_version"],
                "policy_version": self.decision_engine.policy.policy_version,
                "production_threshold": self.production_threshold,
            },
            "classification_metrics": {
                "pr_auc": round(pr_auc, 6),
                "roc_auc": round(roc_auc, 6),
                "brier_score": round(brier, 6),
                "precision": round(prec, 4),
                "recall": round(rec, 4),
                "f1": round(f1, 4),
                "accuracy": round(acc, 6),
            },
            "confusion_matrix": {
                "tp": tp,
                "tn": tn,
                "fp": fp,
                "fn": fn,
            },
            "business_impact": {
                "cost_fp": self.cost_fp,
                "cost_fn": self.cost_fn,
                "baseline_unmitigated_loss": baseline_loss,
                "model_loss": model_loss,
                "net_merchant_savings": net_savings,
                "cost_reduction_percentage": round(cost_reduction_pct, 2),
            },
            "decision_distribution": {
                "approve_count": app_count,
                "approve_pct": round((app_count / total_tx) * 100.0, 2),
                "review_count": rev_count,
                "review_pct": round((rev_count / total_tx) * 100.0, 2),
                "block_count": blk_count,
                "block_pct": round((blk_count / total_tx) * 100.0, 2),
            },
        }

    def compute_threshold_diagnostics(self) -> pd.DataFrame:
        """Post-hoc diagnostic analysis across candidate thresholds (diagnostic only)."""
        if self.predictions_df is None:
            self.run_inference()

        y_true = self.y_true
        y_prob = self.y_prob

        thresholds = [0.50, 0.60, 0.70, 0.80, 0.90, 0.95]
        records = []
        for tau in thresholds:
            y_pred = (y_prob >= tau).astype(int)
            tp = int(np.sum((y_pred == 1) & (y_true == 1)))
            fp = int(np.sum((y_pred == 1) & (y_true == 0)))
            fn = int(np.sum((y_pred == 0) & (y_true == 1)))
            tn = int(np.sum((y_pred == 0) & (y_true == 0)))

            prec = precision_score(y_true, y_pred, zero_division=0)
            rec = recall_score(y_true, y_pred, zero_division=0)
            f1 = f1_score(y_true, y_pred, zero_division=0)
            loss = fp * self.cost_fp + fn * self.cost_fn

            records.append({
                "threshold": tau,
                "precision": round(prec, 4),
                "recall": round(rec, 4),
                "f1": round(f1, 4),
                "tp": tp,
                "fp": fp,
                "fn": fn,
                "tn": tn,
                "business_loss": loss,
                "is_production": (tau == self.production_threshold),
            })
        return pd.DataFrame(records)

    def compute_score_distributions(self) -> Dict[str, Any]:
        """Calculates risk score distribution statistics for benign vs abuse populations."""
        if self.predictions_df is None:
            self.run_inference()

        benign_scores = self.y_prob[self.y_true == 0]
        abuse_scores = self.y_prob[self.y_true == 1]

        return {
            "benign_distribution": {
                "count": len(benign_scores),
                "mean": round(float(np.mean(benign_scores)), 6),
                "median": round(float(np.median(benign_scores)), 6),
                "p95": round(float(np.percentile(benign_scores, 95)), 6),
                "p99": round(float(np.percentile(benign_scores, 99)), 6),
                "max": round(float(np.max(benign_scores)), 6),
                "false_positives_ge_0_90": int(np.sum(benign_scores >= 0.90)),
            },
            "abuse_distribution": {
                "count": len(abuse_scores),
                "min": round(float(np.min(abuse_scores)), 6),
                "p05": round(float(np.percentile(abuse_scores, 5)), 6),
                "p25": round(float(np.percentile(abuse_scores, 25)), 6),
                "median": round(float(np.median(abuse_scores)), 6),
                "p75": round(float(np.percentile(abuse_scores, 75)), 6),
                "mean": round(float(np.mean(abuse_scores)), 6),
                "max": round(float(np.max(abuse_scores)), 6),
                "false_negatives_lt_0_90": int(np.sum(abuse_scores < 0.90)),
            },
        }

    def compute_temporal_stability(self) -> pd.DataFrame:
        """Analyzes performance stability across 4 sequential temporal slices of the test period."""
        if self.predictions_df is None:
            self.run_inference()

        df = self.predictions_df.copy()
        df["dt"] = pd.to_datetime(df["timestamp"])

        slices = [
            ("2026-03-16", "2026-03-18 23:59:59", "2026-03-16 -> 2026-03-18"),
            ("2026-03-19", "2026-03-22 23:59:59", "2026-03-19 -> 2026-03-22"),
            ("2026-03-23", "2026-03-26 23:59:59", "2026-03-23 -> 2026-03-26"),
            ("2026-03-27", "2026-03-31 23:59:59", "2026-03-27 -> 2026-03-31"),
        ]

        records = []
        for start_str, end_str, label in slices:
            sub = df[(df["dt"] >= start_str) & (df["dt"] <= end_str)]
            total = len(sub)
            if total == 0:
                continue

            y_t = sub["is_abuse_ring"].values
            y_p = sub["is_blocked"].values
            scores = sub["risk_score"].values

            abuse_count = int(np.sum(y_t))
            fp = int(np.sum((y_p == 1) & (y_t == 0)))
            fn = int(np.sum((y_p == 0) & (y_t == 1)))
            prec = float(precision_score(y_t, y_p, zero_division=0))
            rec = float(recall_score(y_t, y_p, zero_division=0)) if abuse_count > 0 else 1.0

            records.append({
                "time_slice": label,
                "transactions": total,
                "abuse_transactions": abuse_count,
                "abuse_rate_pct": round((abuse_count / total) * 100.0, 3),
                "fp": fp,
                "fn": fn,
                "precision": round(prec, 4),
                "recall": round(rec, 4),
                "mean_risk_score": round(float(np.mean(scores)), 6),
            })
        return pd.DataFrame(records)

    def compute_ring_generalization(self) -> pd.DataFrame:
        """Evaluates detection performance sliced by abuse-ring topology."""
        if self.predictions_df is None:
            self.run_inference()

        if self.raw_tx_df is None:
            return pd.DataFrame()

        merged = pd.merge(
            self.predictions_df,
            self.raw_tx_df[["transaction_id", "user_population_type", "ring_type", "ring_id"]],
            on="transaction_id",
            how="left",
        )

        records = []
        for ptype, group in merged.groupby("user_population_type"):
            total = len(group)
            abuse_count = int(group["is_abuse_ring"].sum())
            detected = int(((group["is_blocked"] == 1) & (group["is_abuse_ring"] == 1)).sum())
            missed = int(((group["is_blocked"] == 0) & (group["is_abuse_ring"] == 1)).sum())
            fp = int(((group["is_blocked"] == 1) & (group["is_abuse_ring"] == 0)).sum())
            rec = (detected / abuse_count) if abuse_count > 0 else 1.0

            records.append({
                "population_category": ptype,
                "total_transactions": total,
                "actual_abuse": abuse_count,
                "detected_abuse (TP)": detected,
                "missed_abuse (FN)": missed,
                "false_positives (FP)": fp,
                "recall": round(rec, 4),
            })

        # Breakdown by specific ring topology
        for rtype, group in merged[merged["is_abuse_ring"] == 1].groupby("ring_type"):
            total = len(group)
            detected = int((group["is_blocked"] == 1).sum())
            missed = int((group["is_blocked"] == 0).sum())
            rec = (detected / total) if total > 0 else 1.0

            records.append({
                "population_category": f"ABUSE_TOPOLOGY: {rtype}",
                "total_transactions": total,
                "actual_abuse": total,
                "detected_abuse (TP)": detected,
                "missed_abuse (FN)": missed,
                "false_positives (FP)": 0,
                "recall": round(rec, 4),
            })

        return pd.DataFrame(records)

    def compute_calibration(self) -> pd.DataFrame:
        """Calculates 10 standard reliability bins for calibration analysis."""
        if self.predictions_df is None:
            self.run_inference()

        bins = np.linspace(0.0, 1.0, 11)
        records = []
        for i in range(len(bins) - 1):
            low, high = bins[i], bins[i + 1]
            if i == len(bins) - 2:
                mask = (self.y_prob >= low) & (self.y_prob <= high)
            else:
                mask = (self.y_prob >= low) & (self.y_prob < high)

            count = int(np.sum(mask))
            if count > 0:
                mean_pred = float(np.mean(self.y_prob[mask]))
                actual_rate = float(np.mean(self.y_true[mask]))
            else:
                mean_pred = (low + high) / 2.0
                actual_rate = 0.0

            records.append({
                "bin_range": f"{low:.1f}-{high:.1f}",
                "transaction_count": count,
                "mean_predicted_risk": round(mean_pred, 4),
                "actual_abuse_rate": round(actual_rate, 4),
            })
        return pd.DataFrame(records)

    def extract_false_positives(self) -> pd.DataFrame:
        """Extracts all false positive transactions with observable feature evidence."""
        if self.predictions_df is None:
            self.run_inference()

        fp_tx_ids = self.predictions_df[
            (self.predictions_df["is_blocked"] == 1) & (self.predictions_df["is_abuse_ring"] == 0)
        ]["transaction_id"].values

        fp_df = self.test_df[self.test_df["transaction_id"].isin(fp_tx_ids)].copy()

        # Join predictions
        fp_merged = pd.merge(
            fp_df,
            self.predictions_df[["transaction_id", "risk_score", "top_reason_1", "top_reason_2", "top_reason_3"]],
            on="transaction_id",
            how="left"
        )
        return fp_merged

    def extract_false_negatives(self) -> pd.DataFrame:
        """Extracts all false negative transactions with observable feature evidence."""
        if self.predictions_df is None:
            self.run_inference()

        fn_tx_ids = self.predictions_df[
            (self.predictions_df["is_blocked"] == 0) & (self.predictions_df["is_abuse_ring"] == 1)
        ]["transaction_id"].values

        fn_df = self.test_df[self.test_df["transaction_id"].isin(fn_tx_ids)].copy()
        if len(fn_df) == 0:
            return pd.DataFrame()

        fn_merged = pd.merge(
            fn_df,
            self.predictions_df[["transaction_id", "risk_score", "decision", "top_reason_1", "top_reason_2"]],
            on="transaction_id",
            how="left"
        )
        return fn_merged
