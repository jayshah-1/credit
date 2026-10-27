export interface DatasetStats {
  total_records: number;
  total_columns: number;
  columns: string[];
  dtypes: Record<string, string>;
  missing_counts: Record<string, number>;
  duplicate_count: number;
  summary_stats: Record<string, {
    mean: number;
    std: number;
    min: number;
    "25%": number;
    "50%": number;
    "75%": number;
    max: number;
  }>;
  target_distribution: Record<string, number>;
  gender_distribution: Record<string, number>;
  socio_distribution: Record<string, number>;
  postal_distribution: Record<string, number>;
  occupation_distribution: Record<string, number>;
  target_by_gender: Record<string, number>;
  target_by_socio: Record<string, number>;
  correlation_matrix: {
    columns: string[];
    values: number[][];
  };
  cramers_v_matrix: {
    columns: string[];
    values: number[][];
  };
  sample_records: Record<string, any>[];
}

export interface ModelComparisonRow {
  model: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  roc_auc: number;
  selection_rate_gap: number;
  disparate_impact_ratio: number;
  TPR_gap: number;
  FPR_gap: number;
  equalized_odds_gap_max: number;
}

export interface GroupFairnessRow {
  group: string;
  selection_rate: number;
  TPR: number;
  FPR: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
}

export interface BusinessImpactRow {
  model: string;
  predicted_positive_count: number;
  predicted_positive_rate: number;
  observed_success_rate_among_positive: number;
  illustrative_net_value: number;
}

export interface AuditData {
  sensitive_column: string;
  comparison_table: ModelComparisonRow[];
  group_tables: Record<string, GroupFairnessRow[]>;
  confusion_matrices: Record<string, number[][]>;
  business_table: BusinessImpactRow[];
  validation_thresholds: Record<string, number>;
  test_predictions_sample: Record<string, any>[];
  test_set_size: number;
}

export interface PredictionResult {
  model_type: string;
  probability_repayment_success: number;
  decision_threshold: number;
  predicted_class: number;
  predicted_outcome: string;
  sensitive_attribute: string;
  is_research_prototype: boolean;
  disclaimer: string;
}
