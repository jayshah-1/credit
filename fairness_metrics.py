"""
FairCredit: Algorithmic Bias Auditing and Mitigation in Digital Micro-Lending
fairness_metrics.py — Locally implemented fairness metric calculations

Avoids requiring Fairlearn or external network access.
Implements selection rate, True Positive Rate (TPR), False Positive Rate (FPR),
Disparate Impact ratio, Equalized Odds gap, and MetricFrame group aggregation.
"""

from typing import Callable, Dict, Any, Optional
import numpy as np
import pandas as pd
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix


def selection_rate(y_true: Any, y_pred: Any) -> float:
    """
    Computes the selection rate: proportion of applicants predicted positive (1).
    In this research context, positive outcome means predicted repayment success,
    not an actual commercial loan approval decision.
    """
    y_pred = np.asarray(y_pred)
    if len(y_pred) == 0:
        return float(np.nan)
    return float(np.mean(y_pred == 1))


def true_positive_rate(y_true: Any, y_pred: Any) -> float:
    """
    TPR / Sensitivity / Recall: P(Y_hat = 1 | Y = 1).
    Proportion of actual successful repayers who are correctly predicted as successful.
    """
    y_true, y_pred = np.asarray(y_true), np.asarray(y_pred)
    positives = (y_true == 1)
    if not positives.any():
        return float(np.nan)
    return float(np.mean(y_pred[positives] == 1))


def false_positive_rate(y_true: Any, y_pred: Any) -> float:
    """
    FPR / Fall-out: P(Y_hat = 1 | Y = 0).
    Proportion of actual defaulters (unsuccessful repayers) who are incorrectly predicted as successful.
    """
    y_true, y_pred = np.asarray(y_true), np.asarray(y_pred)
    negatives = (y_true == 0)
    if not negatives.any():
        return float(np.nan)
    return float(np.mean(y_pred[negatives] == 1))


def safe_roc_auc(y_true: Any, scores: Any) -> float:
    """Computes ROC-AUC safely if both positive and negative classes are present."""
    y_true = np.asarray(y_true)
    if len(np.unique(y_true)) > 1:
        return float(roc_auc_score(y_true, scores))
    return float(np.nan)


class MetricFrame:
    """
    Local stand-in for Fairlearn's MetricFrame.
    Calculates specified metrics disaggregated across groups defined by sensitive_features.
    """
    def __init__(
        self,
        metrics: Dict[str, Callable[[Any, Any], float]],
        y_true: Any,
        y_pred: Any,
        sensitive_features: Any
    ):
        self.metrics = metrics
        self.y_true = np.asarray(y_true)
        self.y_pred = np.asarray(y_pred)
        self.sensitive_features = np.asarray(sensitive_features)
        
        rows = {}
        unique_groups = pd.unique(self.sensitive_features)
        for group in unique_groups:
            mask = self.sensitive_features == group
            y_t = self.y_true[mask]
            y_p = self.y_pred[mask]
            group_metrics = {}
            for name, metric_fn in self.metrics.items():
                try:
                    val = metric_fn(y_t, y_p)
                except Exception:
                    val = np.nan
                group_metrics[name] = val
            rows[group] = group_metrics
            
        self.by_group = pd.DataFrame.from_dict(rows, orient="index")
        self.by_group.index.name = "group"


def compute_fairness_summary(
    model_name: str,
    y_true: Any,
    y_pred: Any,
    y_score: Any,
    groups: Any
) -> tuple[Dict[str, Any], pd.DataFrame]:
    """
    Calculates overall performance and demographic/group-level fairness metrics.
    Returns (summary_dict, by_group_df).
    """
    y_true = np.asarray(y_true)
    y_pred = np.asarray(y_pred)
    groups = np.asarray(groups)

    mf = MetricFrame(
        metrics={
            "selection_rate": selection_rate,
            "TPR": true_positive_rate,
            "FPR": false_positive_rate,
            "accuracy": accuracy_score,
            "precision": lambda yt, yp: precision_score(yt, yp, zero_division=0),
            "recall": lambda yt, yp: recall_score(yt, yp, zero_division=0),
            "f1": lambda yt, yp: f1_score(yt, yp, zero_division=0)
        },
        y_true=y_true,
        y_pred=y_pred,
        sensitive_features=groups
    )
    by_group = mf.by_group

    tpr_series = by_group["TPR"].dropna()
    fpr_series = by_group["FPR"].dropna()
    sr_series = by_group["selection_rate"].dropna()

    tpr_gap = float(tpr_series.max() - tpr_series.min()) if len(tpr_series) >= 2 else np.nan
    fpr_gap = float(fpr_series.max() - fpr_series.min()) if len(fpr_series) >= 2 else np.nan
    sr_gap = float(sr_series.max() - sr_series.min()) if len(sr_series) >= 2 else np.nan

    # Disparate impact ratio = min(SR) / max(SR)
    if len(sr_series) >= 2 and sr_series.max() > 0:
        di_ratio = float(sr_series.min() / sr_series.max())
    else:
        di_ratio = np.nan

    eq_odds_gap = max(tpr_gap, fpr_gap) if not (np.isnan(tpr_gap) or np.isnan(fpr_gap)) else np.nan

    summary = {
        "model": model_name,
        "accuracy": float(accuracy_score(y_true, y_pred)),
        "precision": float(precision_score(y_true, y_pred, zero_division=0)),
        "recall": float(recall_score(y_true, y_pred, zero_division=0)),
        "f1": float(f1_score(y_true, y_pred, zero_division=0)),
        "roc_auc": safe_roc_auc(y_true, y_score),
        "selection_rate_gap": sr_gap,
        "disparate_impact_ratio": di_ratio,
        "TPR_gap": tpr_gap,
        "FPR_gap": fpr_gap,
        "equalized_odds_gap_max": eq_odds_gap
    }
    return summary, by_group


def cramers_v(x: Any, y: Any) -> float:
    """
    Calculates bias-corrected Cramér's V correlation for two categorical series.
    Ranges from 0 (no association) to 1 (complete association).
    Does not prove causation or illegal discrimination.
    """
    tab = pd.crosstab(x, y)
    if tab.empty or min(tab.shape) < 2:
        return float(np.nan)
    observed = tab.to_numpy()
    n_obs = observed.sum()
    if n_obs <= 1:
        return float(np.nan)
    expected = np.outer(observed.sum(axis=1), observed.sum(axis=0)) / n_obs
    chi2 = (((observed - expected) ** 2) / np.where(expected == 0, 1, expected)).sum()
    phi2 = chi2 / n_obs
    r, k = tab.shape
    # Bias-corrected Cramer's V formulation
    phi2corr = max(0, phi2 - ((k - 1) * (r - 1)) / (n_obs - 1))
    rcorr = r - ((r - 1) ** 2) / (n_obs - 1)
    kcorr = k - ((k - 1) ** 2) / (n_obs - 1)
    denom = min((kcorr - 1), (rcorr - 1))
    if denom <= 0:
        return float(np.nan)
    return float(np.sqrt(phi2corr / denom))
