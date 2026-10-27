"""
FairCredit: api_backend.py
Bridge between Express server and Python ML pipeline.
Outputs JSON for dataset analysis, model auditing, and single-applicant prediction.
"""

import sys
import json
import argparse
import pandas as pd
import numpy as np

from model_pipeline import (
    load_dataset,
    FairCreditExperiment,
    cramers_v,
    TARGET_COL,
    EXPECTED_COLUMNS,
    NUMERIC_FEATURES,
    CATEGORICAL_FEATURES
)

def get_dataset_analysis(df: pd.DataFrame) -> dict:
    """Computes comprehensive dataset statistics, distributions, correlations, and Cramer's V."""
    num_cols = [c for c in NUMERIC_FEATURES if c in df.columns]
    cat_cols = ["gender", "socioeconomic_group", "postal_code", "occupation"]

    # Missing counts
    missing_counts = {col: int(df[col].isna().sum()) for col in df.columns}
    
    # Summary statistics
    summary_stats = {}
    for col in num_cols:
        s = df[col]
        summary_stats[col] = {
            "mean": float(round(s.mean(), 2)),
            "std": float(round(s.std(), 2)),
            "min": float(round(s.min(), 2)),
            "25%": float(round(s.quantile(0.25), 2)),
            "50%": float(round(s.median(), 2)),
            "75%": float(round(s.quantile(0.75), 2)),
            "max": float(round(s.max(), 2)),
        }

    # Distributions
    target_counts = df[TARGET_COL].value_counts().to_dict()
    target_dist = {str(k): int(v) for k, v in target_counts.items()}

    gender_dist = {str(k): int(v) for k, v in df["gender"].value_counts().to_dict().items()}
    socio_dist = {str(k): int(v) for k, v in df["socioeconomic_group"].value_counts().to_dict().items()}
    postal_dist = {str(k): int(v) for k, v in df["postal_code"].value_counts().to_dict().items()}
    occupation_dist = {str(k): int(v) for k, v in df["occupation"].value_counts().to_dict().items()}

    # Disaggregated target rates by group
    target_by_gender = df.groupby("gender")[TARGET_COL].mean().round(3).to_dict()
    target_by_socio = df.groupby("socioeconomic_group")[TARGET_COL].mean().round(3).to_dict()

    # Numeric Correlation Matrix
    corr_df = df[num_cols].corr().round(3)
    corr_matrix = {
        "columns": num_cols,
        "values": corr_df.values.tolist()
    }

    # Cramer's V matrix
    cramers_matrix = []
    for r in cat_cols:
        row = []
        for c in cat_cols:
            if r == c:
                row.append(1.0)
            else:
                val = cramers_v(df[r], df[c])
                row.append(float(round(val, 3)) if not np.isnan(val) else 0.0)
        cramers_matrix.append(row)

    cramers_data = {
        "columns": cat_cols,
        "values": cramers_matrix
    }

    # Sample rows for preview (first 10)
    sample_records = df.head(10).to_dict(orient="records")

    return {
        "total_records": len(df),
        "total_columns": len(df.columns),
        "columns": list(df.columns),
        "dtypes": {col: str(df[col].dtype) for col in df.columns},
        "missing_counts": missing_counts,
        "duplicate_count": int(df.duplicated().sum()),
        "summary_stats": summary_stats,
        "target_distribution": target_dist,
        "gender_distribution": gender_dist,
        "socio_distribution": socio_dist,
        "postal_distribution": postal_dist,
        "occupation_distribution": occupation_dist,
        "target_by_gender": target_by_gender,
        "target_by_socio": target_by_socio,
        "correlation_matrix": corr_matrix,
        "cramers_v_matrix": cramers_data,
        "sample_records": sample_records
    }

def run_experiment_audit(df: pd.DataFrame, sensitive_col: str) -> dict:
    """Trains all 3 models and computes complete auditing, fairness, and financial outputs."""
    exp = FairCreditExperiment(df, sensitive_col=sensitive_col)
    exp.fit_and_evaluate_all()

    # Model comparison table
    comp_df = exp.get_comparison_table()
    comp_table = comp_df.reset_index().to_dict(orient="records")

    # Group fairness tables
    group_tables = {}
    for m_name, g_df in exp.group_tables.items():
        g_data = g_df.reset_index().round(3)
        # convert numpy types
        group_tables[m_name] = g_data.to_dict(orient="records")

    # Confusion matrices
    confusion_matrices = {}
    for m_name, cm in exp.confusion_matrices.items():
        confusion_matrices[m_name] = cm.tolist()

    # Business impact table
    biz_df = exp.get_business_comparison_table()
    biz_table = biz_df.reset_index().to_dict(orient="records")

    # Predictions sample
    preds_sample = exp.get_test_predictions_dataframe().head(20).to_dict(orient="records")

    return {
        "sensitive_column": sensitive_col,
        "comparison_table": comp_table,
        "group_tables": group_tables,
        "confusion_matrices": confusion_matrices,
        "business_table": biz_table,
        "validation_thresholds": exp.val_thresholds,
        "test_predictions_sample": preds_sample,
        "test_set_size": len(exp.y_test)
    }

def predict_applicant(df: pd.DataFrame, sensitive_col: str, applicant_data: dict, model_type: str) -> dict:
    """Generates real model prediction for single applicant."""
    exp = FairCreditExperiment(df, sensitive_col=sensitive_col)
    exp.fit_and_evaluate_all()
    return exp.predict_single_applicant(applicant_data, model_type=model_type)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--action", required=True, choices=["dataset", "audit", "predict"])
    parser.add_argument("--sensitive", default="gender")
    parser.add_argument("--model", default="Baseline")
    parser.add_argument("--data", default="{}")
    parser.add_argument("--csv", default="faircredit_synthetic_loan_dataset.csv")
    args = parser.parse_args()

    df = load_dataset(args.csv)

    if args.action == "dataset":
        res = get_dataset_analysis(df)
        print(json.dumps(res))
    elif args.action == "audit":
        res = run_experiment_audit(df, sensitive_col=args.sensitive)
        print(json.dumps(res))
    elif args.action == "predict":
        applicant_dict = json.loads(args.data)
        res = predict_applicant(df, args.sensitive, applicant_dict, model_type=args.model)
        print(json.dumps(res))

if __name__ == "__main__":
    main()
