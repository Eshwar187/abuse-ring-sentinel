"""
Ablation Study and Comparative Risk Model Evaluation.

Orchestrates:
1. 3-Way Ablation (Behavioral-Only vs Graph-Only vs Combined)
2. Shortcut-Feature Ablation (No Account Age, No Age/Email)
3. Non-Linear Tree Model Comparison (HistGradientBoosting vs Logistic Regression)
4. Benign Shared-Entity False Positive Diagnostics
"""

from __future__ import annotations
from typing import Dict, Any, List, Tuple, Optional
import numpy as np
import pandas as pd

from src.features.groups import (
    BEHAVIORAL_FEATURES,
    GRAPH_FEATURES,
    COMBINED_FEATURES,
    NO_AGE_FEATURES,
    NO_AGE_NO_EMAIL_FEATURES,
)
from src.models.baseline import BaselineLogisticRegression
from src.models.tree_model import TreeRiskModel
from src.evaluation.metrics import evaluate_classification_metrics
from src.evaluation.cost import CostMatrixConfig, compute_business_loss
from src.evaluation.threshold import evaluate_threshold_curve, find_optimal_threshold


class AblationExperimentRunner:
    """
    Executes controlled, reproducible ablation studies strictly on Train and Validation data.
    """

    def __init__(
        self,
        train_df: pd.DataFrame,
        val_df: pd.DataFrame,
        cost_config: Optional[CostMatrixConfig] = None,
        random_state: int = 42
    ):
        self.train_df = train_df
        self.val_df = val_df
        self.cost_config = cost_config or CostMatrixConfig()
        self.random_state = random_state

        self.fitted_models: Dict[str, Any] = {}
        self.validation_results: Dict[str, Dict[str, Any]] = {}
        self.threshold_sweeps: Dict[str, pd.DataFrame] = {}

    def run_all_experiments(self) -> pd.DataFrame:
        """
        Fits and evaluates all 6 experimental models on Validation data.
        """
        experiments = [
            ("Model A: Behavioral-Only (LogReg)", BaselineLogisticRegression(feature_list=BEHAVIORAL_FEATURES, random_state=self.random_state)),
            ("Model B: Graph-Only (LogReg)", BaselineLogisticRegression(feature_list=GRAPH_FEATURES, random_state=self.random_state)),
            ("Model C: Combined (LogReg)", BaselineLogisticRegression(feature_list=COMBINED_FEATURES, random_state=self.random_state)),
            ("Model D: No Account Age (LogReg)", BaselineLogisticRegression(feature_list=NO_AGE_FEATURES, random_state=self.random_state)),
            ("Model E: No Age & No Email (LogReg)", BaselineLogisticRegression(feature_list=NO_AGE_NO_EMAIL_FEATURES, random_state=self.random_state)),
            ("Model F: Combined (Tree-GBDT)", TreeRiskModel(feature_list=COMBINED_FEATURES, random_state=self.random_state)),
        ]

        y_val = self.val_df["is_abuse_ring"].values
        records: List[Dict[str, Any]] = []

        for name, model in experiments:
            # 1. Fit strictly on train_df
            model.fit(self.train_df, target_col="is_abuse_ring")
            self.fitted_models[name] = model

            # 2. Predict on val_df
            y_prob = model.predict_proba(self.val_df)

            # 3. Default Metrics (tau = 0.50)
            metrics_50 = evaluate_classification_metrics(y_val, y_prob, threshold=0.50)
            loss_50 = compute_business_loss(
                fp_count=metrics_50["false_positives"],
                fn_count=metrics_50["false_negatives"],
                tp_count=metrics_50["true_positives"],
                tn_count=metrics_50["true_negatives"],
                config=self.cost_config,
            )

            # 4. Threshold Sweep & Optimal Threshold Selection
            thresholds = np.linspace(0.05, 0.95, 19)
            sweep_df = evaluate_threshold_curve(y_val, y_prob, thresholds=thresholds, cost_config=self.cost_config)
            self.threshold_sweeps[name] = sweep_df

            opt_cost = find_optimal_threshold(sweep_df, criterion="min_cost")

            res = {
                "experiment": name,
                "feature_count": len(model.feature_list) if hasattr(model, "feature_list") and model.feature_list else len(COMBINED_FEATURES),
                "pr_auc": metrics_50["pr_auc"],
                "roc_auc": metrics_50["roc_auc"],
                "brier_score": metrics_50["brier_score"],
                "precision_at_50": metrics_50["precision"],
                "recall_at_50": metrics_50["recall"],
                "f1_at_50": metrics_50["f1"],
                "fp_at_50": metrics_50["false_positives"],
                "fn_at_50": metrics_50["false_negatives"],
                "total_loss_at_50": loss_50["total_estimated_loss"],
                "optimal_tau": opt_cost["threshold"],
                "opt_precision": opt_cost["precision"],
                "opt_recall": opt_cost["recall"],
                "opt_f1": opt_cost["f1"],
                "opt_fp": int(opt_cost["false_positives"]),
                "opt_fn": int(opt_cost["false_negatives"]),
                "opt_total_loss": opt_cost["total_estimated_loss"],
                "opt_net_savings": opt_cost["net_savings"],
            }
            self.validation_results[name] = res
            records.append(res)

        return pd.DataFrame(records)

    def calculate_marginal_graph_lift(self) -> Dict[str, Any]:
        """
        Computes marginal lift of Combined (Model C) over Behavioral-Only (Model A).
        """
        a = self.validation_results["Model A: Behavioral-Only (LogReg)"]
        b = self.validation_results["Model B: Graph-Only (LogReg)"]
        c = self.validation_results["Model C: Combined (LogReg)"]

        return {
            "behavioral_pr_auc": a["pr_auc"],
            "graph_only_pr_auc": b["pr_auc"],
            "combined_pr_auc": c["pr_auc"],
            "delta_pr_auc_lift": round(c["pr_auc"] - a["pr_auc"], 4),
            "behavioral_opt_fp": a["opt_fp"],
            "combined_opt_fp": c["opt_fp"],
            "delta_fp_reduction": a["opt_fp"] - c["opt_fp"],
            "behavioral_opt_loss": a["opt_total_loss"],
            "combined_opt_loss": c["opt_total_loss"],
            "financial_loss_reduction": round(a["opt_total_loss"] - c["opt_total_loss"], 2),
        }

    def analyze_benign_shared_false_positives(
        self,
        model_name: str,
        raw_tx_path: str = "data/raw/transactions.csv"
    ) -> Dict[str, Any]:
        """
        Maps false positive transactions back to population metadata to quantify
        impact on benign households vs benign isolated users.
        """
        model = self.fitted_models[model_name]
        opt_tau = self.validation_results[model_name]["optimal_tau"]

        y_val = self.val_df["is_abuse_ring"].values
        y_prob = model.predict_proba(self.val_df)
        y_pred = (y_prob >= opt_tau).astype(int)

        # Identify FP indices in validation set
        fp_mask = (y_pred == 1) & (y_val == 0)
        fp_tx_ids = self.val_df.loc[fp_mask, "transaction_id"].tolist()

        raw_df = pd.read_csv(raw_tx_path)
        fp_raw = raw_df[raw_df["transaction_id"].isin(fp_tx_ids)]

        pop_counts = fp_raw["user_population_type"].value_counts().to_dict()
        ring_type_counts = fp_raw["ring_type"].value_counts().to_dict()

        total_fp = len(fp_tx_ids)
        isolated_fp = pop_counts.get("BENIGN_ISOLATED", 0)
        shared_fp = pop_counts.get("BENIGN_SHARED", 0)
        household_fp = ring_type_counts.get("HOUSEHOLD", 0)
        office_fp = ring_type_counts.get("SHARED_IP_OFFICE", 0)

        return {
            "model_name": model_name,
            "optimal_threshold": opt_tau,
            "total_false_positives": total_fp,
            "benign_isolated_fp_count": isolated_fp,
            "benign_isolated_fp_share": round(isolated_fp / total_fp * 100.0, 1) if total_fp > 0 else 0.0,
            "benign_shared_fp_count": shared_fp,
            "benign_shared_fp_share": round(shared_fp / total_fp * 100.0, 1) if total_fp > 0 else 0.0,
            "household_fp_count": household_fp,
            "shared_office_ip_fp_count": office_fp,
        }
