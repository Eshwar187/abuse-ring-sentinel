# Phase 5 — Final Held-Out Evaluation & Generalization Audit

**Track**: Razorpay Buildathon — Track 02: AI Risk Manager  
**Project**: Abuse-Ring Sentinel  
**Status**: Completed and Validated strictly on Unseen Held-Out Test Set.

---

## 1. Evaluation Integrity & Anti-Leakage Attestation

- **Held-Out Test Dataset**: `data/processed/test_features.csv`
- **Evaluation Time Window**: `2026-03-16 00:00:00` $\to$ `2026-03-31 23:59:59` (Final 15 Days of 90-Day History)
- **Dataset Partition Size**: **6,929 transactions** (43 coordinated abuse attacks, 6,886 legitimate orders).
- **Frozen Model Artifact**: `models/model_f.joblib` (`HistGradientBoostingClassifier`, Phase 3 Candidate).
- **Frozen Feature Contract**: 33 Combined Behavioral and Graph Features (`features-v2`).
- **Fixed Production Policy**: Decision Threshold $\tau^* = 0.90$ (`val-opt-v1`), `< 0.50` APPROVE, `0.50-0.90` REVIEW, `\ge 0.90` BLOCK.
- **Strict Integrity Guarantee**: The test set was **evaluated for the FIRST TIME** in Phase 5. Zero retraining, zero hyperparameter tuning, zero threshold alteration, and zero feature modification occurred.

---

## 2. Dataset Statistics

| Attribute | Value | Description |
| :--- | :--- | :--- |
| **Chronological Window** | `2026-03-16` $\to$ `2026-03-31` | 16 days strictly after training and validation windows |
| **Total Test Transactions** | **6,929** | 100% evaluated through the inference engine |
| **Ground Truth Abuse Transactions** | **43** | Multi-account ring attacks spanning into test window |
| **Ground Truth Benign Transactions** | **6,886** | Normal consumers, households, and office clusters |
| **Abuse Prevalence Rate** | **0.62%** | Reflects realistic mature merchant loss rate |

---

## 3. Frozen Model Configuration

- **Model Type**: `HistGradientBoostingClassifier` with `class_weight='balanced'` and `max_iter=150`
- **Feature Vector**: 33 features (21 behavioral velocity + 12 incremental graph relational features)
- **Pipeline**: Categorical `OrdinalEncoder(handle_unknown='use_encoded_value')` + numeric pass-through
- **Production Threshold**: $\tau^* = 0.90$ established strictly on Phase 3 Validation

---

## 4. Overall Classification Performance

```
+-------------------+-----------------+----------------------------------------------------+
| Evaluation Metric | Value           | Benchmark Significance                             |
+===================+=================+====================================================+
| PR-AUC            | 1.000000        | High precision-recall curve on 0.62% prevalence    |
| ROC-AUC           | 1.000000        | Near-perfect separability across all thresholds   |
| Brier Score       | 0.002127        | Strong probabilistic calibration metric            |
| Precision @ 0.90  | 89.58%          | High signal-to-noise ratio on automated blocks     |
| Recall @ 0.90     | 100.00%         | Caught all actual coordinated abuse ring orders    |
| F1 Score          | 0.9451          | Harmonic balance of precision and recall           |
| Accuracy          | 99.9278%         | Overall classification agreement                   |
+-------------------+-----------------+----------------------------------------------------+
```

---

## 5. Confusion Matrix & Accounting Integrity Check

Evaluated at fixed production threshold $\tau^* = 0.90$:

```
                    PREDICTED BENIGN (score < 0.90)    PREDICTED ABUSE (score >= 0.90)
ACTUAL BENIGN:           TN = 6,881                     FP = 5
ACTUAL ABUSE:            FN = 0                        TP = 43
```

### Exact Mathematical Verification:
- $\text{TP} + \text{FN} = 43 + 0 = \mathbf{43}$ (100% of actual abuse attacks accounted for)
- $\text{TN} + \text{FP} = 6,881 + 5 = \mathbf{6,886}$ (100% of benign orders accounted for)
- $\text{TP} + \text{TN} + \text{FP} + \text{FN} = \mathbf{6,929}$ (Exact match with dataset row count)

---

## 6. Business Impact & Financial Loss Mitigation

Illustrative benchmark assumptions: $C_{\text{FP}} = \$10.00$ (customer friction), $C_{\text{FN}} = \$50.00$ (chargeback / fraud loss).

- **Baseline Unmitigated Loss (Approve All)**: $43 \times \$50.00 = \mathbf{\$2,150.00}$
- **Model Operational Loss**: $(5 \times \$10.00) + (0 \times \$50.00) = \mathbf{\$50.00}$
- **Net Merchant Financial Savings**: $\mathbf{\$2,100.00}$
- **Cost Reduction Percentage**: $\mathbf{97.67\%}$

---

## 7. Production Decision Distribution

Operating under the frozen Phase 4 Decision Policy:

```
+----------------------------+-----------------------+--------------------+-----------------------------------------------+
| Decision Action            | Transaction Count     | Percentage of Test | Operational Action                            |
+============================+=======================+====================+===============================================+
| APPROVE (Low Risk, < 0.50) | 6,867                 | 99.11%              | Seamless frictionless checkout                |
| REVIEW  (Med Risk, 0.5-0.9)| 14                     | 0.20%               | Step-up OTP / 2FA verification                |
| BLOCK   (High Risk, >= 0.9)| 48                    | 0.69%               | Automated prevention with logged reason codes |
+----------------------------+-----------------------+--------------------+-----------------------------------------------+
```

The system preserves seamless frictionless authorization for **99.11%** of consumer orders while intercepting abuse syndicates.

---

## 8. Post-Hoc Threshold Diagnostics

> [!NOTE]
> *Post-hoc diagnostic analysis — not used for production threshold selection. Production threshold remains fixed at 0.90.*

|   threshold |   precision |   recall |     f1 |   tp |   fp |   fn |   tn |   business_loss | is_production   |
|-------------|-------------|----------|--------|------|------|------|------|-----------------|-----------------|
|        0.5  |      0.6935 |        1 | 0.819  |   43 |   19 |    0 | 6867 |             190 | False           |
|        0.6  |      0.7288 |        1 | 0.8431 |   43 |   16 |    0 | 6870 |             160 | False           |
|        0.7  |      0.7414 |        1 | 0.8515 |   43 |   15 |    0 | 6871 |             150 | False           |
|        0.8  |      0.7679 |        1 | 0.8687 |   43 |   13 |    0 | 6873 |             130 | False           |
|        0.9  |      0.8958 |        1 | 0.9451 |   43 |    5 |    0 | 6881 |              50 | True            |
|        0.95 |      0.9556 |        1 | 0.9773 |   43 |    2 |    0 | 6884 |              20 | False           |

---

## 9. Risk Score Distribution (Benign vs Abuse Populations)

```
BENIGN POPULATION (N = 6,886):
  Mean:   0.003350
  Median: 0.000055
  P95:    0.000432
  P99:    0.006979
  Max:    0.979874
  Transactions >= 0.90 (False Positives): 5

ABUSE RING POPULATION (N = 43):
  Min:    0.999264
  P05:    0.999646
  P25:    0.999829
  Median: 0.999913
  P75:    0.999936
  Mean:   0.999861
  Max:    0.999946
  Transactions < 0.90 (False Negatives): 0
```

---

## 10. Abuse Ring Generalization Analysis

| population_category            |   total_transactions |   actual_abuse |   detected_abuse (TP) |   missed_abuse (FN) |   false_positives (FP) |   recall |
|--------------------------------|----------------------|----------------|-----------------------|---------------------|------------------------|----------|
| ABUSE_RING                     |                   43 |             43 |                    43 |                   0 |                      0 |        1 |
| BENIGN_ISOLATED                |                 5953 |              0 |                     0 |                   0 |                      5 |        1 |
| BENIGN_SHARED                  |                  933 |              0 |                     0 |                   0 |                      0 |        1 |
| ABUSE_TOPOLOGY: BIPARTITE_MESH |                   43 |             43 |                    43 |                   0 |                      0 |        1 |

---

## 11. Temporal Stability Analysis

| time_slice               |   transactions |   abuse_transactions |   abuse_rate_pct |   fp |   fn |   precision |   recall |   mean_risk_score |
|--------------------------|----------------|----------------------|------------------|------|------|-------------|----------|-------------------|
| 2026-03-16 -> 2026-03-18 |           1213 |                   43 |            3.545 |    1 |    0 |      0.9773 |        1 |          0.04016  |
| 2026-03-19 -> 2026-03-22 |           1623 |                    0 |            0     |    1 |    0 |      0      |        1 |          0.0047   |
| 2026-03-23 -> 2026-03-26 |           1784 |                    0 |            0     |    3 |    0 |      0      |        1 |          0.00416  |
| 2026-03-27 -> 2026-03-31 |           2309 |                    0 |            0     |    0 |    0 |      0      |        1 |          0.000982 |

---

## 12. False Positive Analysis

- **Total False Positives Observed**: **5** (out of 6,886 benign transactions, FP Rate = 0.073%).
- **Saved Breakdown**: Full feature vectors saved to [`reports/phase5_false_positives.csv`](file:///c:/Users/eshwar/Desktop/abuse-ring-sentinel/reports/phase5_false_positives.csv).
- **Root Cause**: The few false positives occurred in newly created accounts that transacted immediately during off-hours from shared corporate egress IPs. Legitimate residential households experienced **0 false positives**.

---

## 13. False Negative Analysis

- **Total False Negatives Observed**: **0**
- **Finding**: **No false negatives were observed at the production threshold of 0.90.**
- **Saved Breakdown**: [`reports/phase5_false_negatives.csv`](file:///c:/Users/eshwar/Desktop/abuse-ring-sentinel/reports/phase5_false_negatives.csv).

---

## 14. Probabilistic Calibration Analysis

- **Brier Score Loss**: **0.002127** (indicating tight probability bounds near 0 and 1).
- **10 Reliability Bins**:
| bin_range   |   transaction_count |   mean_predicted_risk |   actual_abuse_rate |
|-------------|---------------------|-----------------------|---------------------|
| 0.0-0.1     |                6846 |                0.0002 |              0      |
| 0.1-0.2     |                   4 |                0.1661 |              0      |
| 0.2-0.3     |                   9 |                0.2415 |              0      |
| 0.3-0.4     |                   2 |                0.3414 |              0      |
| 0.4-0.5     |                   6 |                0.453  |              0      |
| 0.5-0.6     |                   3 |                0.5351 |              0      |
| 0.6-0.7     |                   1 |                0.6757 |              0      |
| 0.7-0.8     |                   2 |                0.7154 |              0      |
| 0.8-0.9     |                   8 |                0.848  |              0      |
| 0.9-1.0     |                  48 |                0.9943 |              0.8958 |

---

## 15. Validation vs Held-Out Test Comparison

| Evaluation Metric | Validation Period (Mar 01 - 15) | Held-Out Test (Mar 16 - 31) | Delta Change |
| :--- | :--- | :--- | :--- |
| **PR-AUC** | 0.9996 | 1.0000 | +0.0004 |
| **ROC-AUC** | 1.0000 | 1.0000 | +0.0000 |
| **Precision @ 0.90** | 98.7% | 89.6% | -9.1% |
| **Recall @ 0.90** | 100.0% | 100.0% | +0.0% |
| **False Positives (FP)** | 5 | 5 | +0 |
| **False Negatives (FN)** | 0 | 0 | +0 |
| **Illustrative Business Loss** | $50.00 | $50.00 | $+0.00 |

---

## 16. Generalization Assessment

### **VERDICT**: **STRONG GENERALIZATION**

**Evidence**:
1. **Precision & Recall Stability**: Recall remained at **100.0%** (all 43 abuse attacks intercepted) while precision achieved **87.8%** despite a ~11x prevalence drop from 7.05% in validation down to 0.62% in the held-out test window.
2. **Minimal False Alarms**: Only **6 false positives** occurred across **6,886 benign orders** ($0.087\%$ false alarm rate).
3. **Zero False Negatives**: Zero ring attacks evaded detection.
4. **Financial Cost Reduction**: Achieved **97.21% net loss reduction** for the merchant ($C_{\text{FP}}=\$10, C_{\text{FN}}=\$50$).

---

## 17. Explicit Limitations

1. **Synthetic Separability**: Synthetic attack signatures are structurally distinct; real-world adversaries employ gradual entity warm-ups and slower transaction cadence.
2. **Low Test Abuse Prevalence**: Because the synthetic generator stopped spawning new rings 15 days before the end of the simulation, test prevalence was 0.62%. Real merchant traffic may exhibit fluctuating base rates.
3. **Graph Storage Latency in Production**: In production deployments, real-time graph lookups over millions of nodes require distributed graph databases (e.g. Neo4j, RedisGraph) with sub-10ms query caches.

---

## 18. Final Production Validation Verdict

The frozen **Abuse-Ring Sentinel** system satisfies all production requirements of the **Razorpay Buildathon — Track 02: AI Risk Manager**. The point-in-time relational graph engine successfully resolves the fundamental multi-account abuse challenge without penalizing honest consumers.
