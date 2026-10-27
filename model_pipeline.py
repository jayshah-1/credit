"""
FairCredit: Algorithmic Bias Auditing and Mitigation in Digital Micro-Lending
model_pipeline.py — End-to-end preprocessing, training, auditing, and inference pipeline.

Reproduces the exact modeling logic from the reference notebook:
1. Baseline Logistic Regression pipeline (sensitive attribute excluded from features)
2. Pre-processing Mitigation: Reweighed model (sample weights on joint group-outcome distribution)
3. Post-processing Mitigation: Group-specific validation-threshold optimization (learned on train val split)
4. Full fairness audit, confusion matrices, and illustrative business viability estimates.
"""

import os
from typing import Dict, Any, Tuple, List, Optional
import numpy as np
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import confusion_matrix

from fairness_metrics import (
    selection_rate,
    true_positive_rate,
    false_positive_rate,
    safe_roc_auc,
    compute_fairness_summary,
    cramers_v,
    MetricFrame
)

RANDOM_STATE = 42
TARGET_COL = "repayment_success"
DEFAULT_SENSITIVE_COL = "gender"

EXPECTED_COLUMNS = [
    "applicant_id",
    "gender",
    "socioeconomic_group",
    "postal_code",
    "occupation",
    "annual_income",
    "credit_score",
    "debt_to_income_ratio",
    "loan_amount",
    "employment_years",
    "previous_defaults",
    "repayment_success"
]

NUMERIC_FEATURES = [
    "annual_income",
    "credit_score",
    "debt_to_income_ratio",
    "loan_amount",
    "employment_years",
    "previous_defaults"
]

CATEGORICAL_FEATURES = [
    "socioeconomic_group",
    "postal_code",
    "occupation"
]

# Business scenario assumptions from coursework notebook
REVENUE_PER_SUCCESSFUL_LOAN = 1200.0
LOSS_PER_UNSUCCESSFUL_LOAN = 5000.0
OPERATING_COST_PER_APPROVED_LOAN = 250.0


def validate_dataset(df: pd.DataFrame) -> Tuple[bool, str]:
    """Validates whether the uploaded DataFrame contains the necessary columns and types."""
    missing = [c for c in EXPECTED_COLUMNS if c not in df.columns]
    if missing:
        return False, f"Missing required columns: {', '.join(missing)}"
    if df[TARGET_COL].nunique() < 2:
        return False, f"Target column '{TARGET_COL}' must have at least 2 distinct binary classes (0 and 1)."
    return True, "Dataset validated successfully."


def load_dataset(file_path_or_buffer: Any) -> pd.DataFrame:
    """Loads CSV and verifies integrity."""
    df = pd.read_csv(file_path_or_buffer)
    valid, msg = validate_dataset(df)
    if not valid:
        raise ValueError(msg)
    return df


def build_preprocessor(numeric_cols: List[str], categorical_cols: List[str]) -> ColumnTransformer:
    """Creates the standard preprocessing pipeline used across all models."""
    return ColumnTransformer([
        ("num", Pipeline([
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler())
        ]), numeric_cols),
        ("cat", Pipeline([
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("onehot", OneHotEncoder(handle_unknown="ignore", sparse_output=False))
        ]), categorical_cols)
    ])


def build_model_pipeline(preprocessor: ColumnTransformer) -> Pipeline:
    """Instantiates a Logistic Regression pipeline with fixed random state."""
    return Pipeline([
        ("prep", preprocessor),
        ("model", LogisticRegression(max_iter=1500, class_weight=None, random_state=RANDOM_STATE))
    ])


def compute_sample_weights(sensitive_train: np.ndarray, y_train: np.ndarray) -> np.ndarray:
    """
    Computes reweighing sample weights based on the joint distribution of protected group and target:
    w(g, y) = P(g) * P(y) / P(g, y)
    Normalized such that mean(w) == 1.
    """
    train_frame = pd.DataFrame({"group": sensitive_train, "target": y_train})
    n_train = len(train_frame)
    joint = train_frame.groupby(["group", "target"]).size() / n_train
    group_prob = train_frame["group"].value_counts(normalize=True)
    target_prob = train_frame["target"].value_counts(normalize=True)

    weights = []
    for g, yy in zip(sensitive_train, y_train):
        p_joint = joint.loc[(g, yy)]
        w = (group_prob.loc[g] * target_prob.loc[yy]) / p_joint
        weights.append(w)
    weights = np.asarray(weights, dtype=float)
    return weights / weights.mean()


def search_validation_thresholds(
    X_train: pd.DataFrame,
    y_train: pd.Series,
    s_train: pd.Series,
    preprocessor: ColumnTransformer
) -> Tuple[Dict[str, float], float]:
    """
    Post-processing mitigation:
    Splits training data into a sub-train (75%) and validation (25%) set.
    Fits a validation model on sub-train, then performs grid search over thresholds [0.20, 0.80]
    to minimize max(TPR_gap, FPR_gap) + 0.02 * (|t0 - 0.5| + |t1 - 0.5|) on the validation split.
    NEVER touches the test set for threshold selection.
    """
    X_fit, X_val, y_fit, y_val, s_fit, s_val = train_test_split(
        X_train, y_train, s_train, test_size=0.25, random_state=RANDOM_STATE, stratify=y_train
    )
    val_model = build_model_pipeline(preprocessor)
    val_model.fit(X_fit, y_fit)
    p_val = val_model.predict_proba(X_val)[:, 1]

    groups_unique = sorted(s_val.unique())
    threshold_grid = np.arange(0.20, 0.81, 0.02)

    def rates(y_true_arr: np.ndarray, y_pred_arr: np.ndarray) -> Tuple[float, float]:
        cm = confusion_matrix(y_true_arr, y_pred_arr, labels=[0, 1])
        tn, fp, fn, tp = cm.ravel()
        tpr = float(tp / (tp + fn)) if (tp + fn) > 0 else 0.0
        fpr = float(fp / (fp + tn)) if (fp + tn) > 0 else 0.0
        return tpr, fpr

    best_pair: Dict[str, float] = {g: 0.50 for g in groups_unique}
    best_obj = np.inf

    if len(groups_unique) == 2:
        g0, g1 = groups_unique[0], groups_unique[1]
        s_val_arr = s_val.to_numpy()
        y_val_arr = y_val.to_numpy()
        mask0 = (s_val_arr == g0)
        mask1 = (s_val_arr == g1)
        y0 = y_val_arr[mask0]
        y1 = y_val_arr[mask1]
        p0 = p_val[mask0]
        p1 = p_val[mask1]

        for t0 in threshold_grid:
            pred0 = (p0 >= t0).astype(int)
            tpr0, fpr0 = rates(y0, pred0)
            for t1 in threshold_grid:
                pred1 = (p1 >= t1).astype(int)
                tpr1, fpr1 = rates(y1, pred1)
                tpr_gap = abs(tpr0 - tpr1)
                fpr_gap = abs(fpr0 - fpr1)
                obj = max(tpr_gap, fpr_gap) + 0.02 * (abs(t0 - 0.5) + abs(t1 - 0.5))
                if obj < best_obj:
                    best_obj = obj
                    best_pair = {g0: float(round(t0, 3)), g1: float(round(t1, 3))}
    else:
        # Default fallback if more than 2 groups
        for g in groups_unique:
            best_pair[g] = 0.50

    return best_pair, float(best_obj)


def calculate_business_impact(model_name: str, y_true: np.ndarray, y_pred: np.ndarray) -> Dict[str, Any]:
    """
    Computes illustrative net business value based on synthetic outcomes.
    Positive model prediction (1) indicates loan approval in this toy scenario.
    """
    approved = (y_pred == 1)
    n_approved = int(approved.sum())
    if n_approved == 0:
        observed_success_rate = np.nan
        expected_value = 0.0
    else:
        observed_success_rate = float(np.mean(y_true[approved]))
        values = np.where(
            y_true[approved] == 1,
            REVENUE_PER_SUCCESSFUL_LOAN,
            -LOSS_PER_UNSUCCESSFUL_LOAN
        ) - OPERATING_COST_PER_APPROVED_LOAN
        expected_value = float(values.sum())

    return {
        "model": model_name,
        "predicted_positive_count": n_approved,
        "predicted_positive_rate": float(np.mean(approved)),
        "observed_success_rate_among_positive": observed_success_rate,
        "illustrative_net_value": expected_value
    }


class FairCreditExperiment:
    """Holds all trained models, evaluation metrics, and test datasets."""

    def __init__(self, df: pd.DataFrame, sensitive_col: str = DEFAULT_SENSITIVE_COL):
        self.df = df.copy()
        self.sensitive_col = sensitive_col
        self.target_col = TARGET_COL

        # Feature separation
        drop_cols = ["applicant_id", self.target_col, self.sensitive_col]
        self.X = self.df.drop(columns=[c for c in drop_cols if c in self.df.columns])
        self.y = self.df[self.target_col].astype(int)
        self.sensitive = self.df[self.sensitive_col].astype(str)

        self.num_features = [c for c in NUMERIC_FEATURES if c in self.X.columns]
        self.cat_features = [c for c in CATEGORICAL_FEATURES if c in self.X.columns]

        # Stratified train/test split (75% / 25%)
        self.X_train, self.X_test, self.y_train, self.y_test, self.s_train, self.s_test = train_test_split(
            self.X, self.y, self.sensitive, test_size=0.25, random_state=RANDOM_STATE, stratify=self.y
        )

        self.preprocessor = build_preprocessor(self.num_features, self.cat_features)

        # Trained models
        self.baseline_pipeline: Optional[Pipeline] = None
        self.reweighted_pipeline: Optional[Pipeline] = None
        self.val_thresholds: Dict[str, float] = {}

        # Predictions
        self.p_base: Optional[np.ndarray] = None
        self.pred_base: Optional[np.ndarray] = None
        self.p_rew: Optional[np.ndarray] = None
        self.pred_rew: Optional[np.ndarray] = None
        self.p_cal: Optional[np.ndarray] = None
        self.pred_cal: Optional[np.ndarray] = None

        # Summaries & Group tables
        self.summaries: Dict[str, Dict[str, Any]] = {}
        self.group_tables: Dict[str, pd.DataFrame] = {}
        self.confusion_matrices: Dict[str, np.ndarray] = {}
        self.business_impact: Dict[str, Dict[str, Any]] = {}

    def fit_and_evaluate_all(self) -> None:
        """Trains Baseline, Reweighted, and Threshold-adjusted models and audits fairness."""
        # 1. Baseline Model
        self.baseline_pipeline = build_model_pipeline(self.preprocessor)
        self.baseline_pipeline.fit(self.X_train, self.y_train)
        self.p_base = self.baseline_pipeline.predict_proba(self.X_test)[:, 1]
        self.pred_base = (self.p_base >= 0.50).astype(int)

        base_summary, base_groups = compute_fairness_summary(
            "Baseline", self.y_test, self.pred_base, self.p_base, self.s_test
        )
        self.summaries["Baseline"] = base_summary
        self.group_tables["Baseline"] = base_groups
        self.confusion_matrices["Baseline"] = confusion_matrix(self.y_test, self.pred_base, labels=[0, 1])
        self.business_impact["Baseline"] = calculate_business_impact("Baseline", self.y_test.to_numpy(), self.pred_base)

        # 2. Reweighted Model (Sample weighting)
        weights = compute_sample_weights(self.s_train.to_numpy(), self.y_train.to_numpy())
        self.reweighted_pipeline = build_model_pipeline(self.preprocessor)
        self.reweighted_pipeline.fit(self.X_train, self.y_train, model__sample_weight=weights)
        self.p_rew = self.reweighted_pipeline.predict_proba(self.X_test)[:, 1]
        self.pred_rew = (self.p_rew >= 0.50).astype(int)

        rew_summary, rew_groups = compute_fairness_summary(
            "Reweighted", self.y_test, self.pred_rew, self.p_rew, self.s_test
        )
        self.summaries["Reweighted"] = rew_summary
        self.group_tables["Reweighted"] = rew_groups
        self.confusion_matrices["Reweighted"] = confusion_matrix(self.y_test, self.pred_rew, labels=[0, 1])
        self.business_impact["Reweighted"] = calculate_business_impact("Reweighted", self.y_test.to_numpy(), self.pred_rew)

        # 3. Group-Specific Threshold Model
        self.val_thresholds, _ = search_validation_thresholds(
            self.X_train, self.y_train, self.s_train, self.preprocessor
        )
        self.p_cal = self.p_base  # Applies group thresholds to baseline test probabilities
        self.pred_cal = np.array([
            int(score >= self.val_thresholds.get(g, 0.50))
            for score, g in zip(self.p_cal, self.s_test)
        ])

        cal_summary, cal_groups = compute_fairness_summary(
            "Threshold-adjusted", self.y_test, self.pred_cal, self.p_cal, self.s_test
        )
        self.summaries["Threshold-adjusted"] = cal_summary
        self.group_tables["Threshold-adjusted"] = cal_groups
        self.confusion_matrices["Threshold-adjusted"] = confusion_matrix(self.y_test, self.pred_cal, labels=[0, 1])
        self.business_impact["Threshold-adjusted"] = calculate_business_impact("Threshold-adjusted", self.y_test.to_numpy(), self.pred_cal)

    def get_comparison_table(self) -> pd.DataFrame:
        """Returns side-by-side comparison table of all 3 models."""
        df_comp = pd.DataFrame([
            self.summaries["Baseline"],
            self.summaries["Reweighted"],
            self.summaries["Threshold-adjusted"]
        ]).set_index("model")
        return df_comp

    def get_business_comparison_table(self) -> pd.DataFrame:
        """Returns business impact comparison table."""
        df_biz = pd.DataFrame([
            self.business_impact["Baseline"],
            self.business_impact["Reweighted"],
            self.business_impact["Threshold-adjusted"]
        ]).set_index("model")
        return df_biz

    def get_test_predictions_dataframe(self) -> pd.DataFrame:
        """Constructs full test predictions dataframe for export."""
        return pd.DataFrame({
            "actual_repayment_success": self.y_test.to_numpy(),
            "sensitive_group": self.s_test.to_numpy(),
            "baseline_probability": np.round(self.p_base, 4),
            "baseline_prediction": self.pred_base,
            "reweighted_probability": np.round(self.p_rew, 4),
            "reweighted_prediction": self.pred_rew,
            "threshold_adjusted_probability": np.round(self.p_cal, 4),
            "threshold_adjusted_prediction": self.pred_cal
        })

    def predict_single_applicant(
        self,
        applicant_data: Dict[str, Any],
        model_type: str = "Baseline"
    ) -> Dict[str, Any]:
        """
        Runs applicant input through the trained model pipeline.
        Sensitive attribute is excluded from feature inputs, preserving notebook architecture.
        """
        if self.baseline_pipeline is None:
            raise RuntimeError("Models have not been trained yet.")

        # Construct input DataFrame matching feature columns
        input_row = {
            col: [applicant_data.get(col)]
            for col in self.X.columns
        }
        df_input = pd.DataFrame(input_row)

        sensitive_val = str(applicant_data.get(self.sensitive_col, "Unknown"))

        if model_type == "Reweighted":
            prob = float(self.reweighted_pipeline.predict_proba(df_input)[0, 1])
            threshold = 0.50
            pred = int(prob >= threshold)
        elif model_type == "Threshold-adjusted":
            prob = float(self.baseline_pipeline.predict_proba(df_input)[0, 1])
            threshold = float(self.val_thresholds.get(sensitive_val, 0.50))
            pred = int(prob >= threshold)
        else:  # Baseline
            prob = float(self.baseline_pipeline.predict_proba(df_input)[0, 1])
            threshold = 0.50
            pred = int(prob >= threshold)

        return {
            "model_type": model_type,
            "probability_repayment_success": float(round(prob, 4)),
            "decision_threshold": float(round(threshold, 3)),
            "predicted_class": pred,
            "predicted_outcome": "Likely to Repay (1)" if pred == 1 else "High Repayment Risk (0)",
            "sensitive_attribute": sensitive_val,
            "is_research_prototype": True,
            "disclaimer": (
                "Academic Research Prototype Warning: This model was trained on synthetic micro-lending data. "
                "Predictions indicate estimated repayment success probability in an experimental environment and "
                "must NOT be used as the sole basis or formal determination for real-world credit decisions."
            )
        }
