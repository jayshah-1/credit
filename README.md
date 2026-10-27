# FairCredit: Algorithmic Bias Auditing and Mitigation in Digital Micro-Lending

An academic research platform for auditing, measuring, and mitigating algorithmic bias in loan repayment risk models using synthetic micro-lending data.

> **Status Notice:** Synthetic Dataset — Academic Research Prototype. Not for real commercial or banking credit underwriting decisions. The target variable is `repayment_success` (1 = Repaid, 0 = Defaulted), not historical loan approval.

---

## 1. Project Overview

Algorithmic lending systems can inadvertently perpetuate historical disparities if training data reflects structural inequities. When sensitive attributes (e.g., gender, race, socioeconomic class) correlate with features such as postal code or occupation, models can learn indirect proxy bias even if the sensitive attribute is omitted from the training features.

The **FairCredit** platform implements:
1. **Baseline Model:** Logistic Regression with strict separation of sensitive attributes, median/most-frequent imputation, standard scaling, and one-hot encoding.
2. **Pre-Processing Mitigation (Reweighed Model):** Calculates inverse joint frequency sample weights $w(g, y) = \frac{P(g)P(y)}{P(g, y)}$ on training data to counter joint group-outcome imbalances.
3. **Post-Processing Mitigation (Group-Specific Threshold Model):** Performs threshold calibration on a held-out validation split of the training set to minimize Equalized Odds disparities ($\max(|\Delta\text{TPR}|, |\Delta\text{FPR}|)$), evaluating post-hoc on the test set.
4. **Fairness Auditing:** Locally calculates selection rate disparities, Disparate Impact (4/5ths rule), True Positive Rate (Recall) gaps, False Positive Rate gaps, and Equalized Odds max gaps.
5. **Proxy Variable Association:** Computes bias-corrected Cramér's V across categorical features and correlation matrices across numeric features.
6. **Illustrative Business Impact:** Retrospective evaluation of positive predictions under simple economic assumptions ($1,200 revenue, -$5,000 default cost, $250 processing cost).

---

## 2. Project File Structure

- `app.py`: Interactive Streamlit application covering all 8 functional pages.
- `model_pipeline.py`: Pure logic for data loading, validation, preprocessing, model training, threshold search, single-applicant inference, and business calculations.
- `fairness_metrics.py`: Standalone mathematical implementations of selection rate, TPR, FPR, Disparate Impact ratio, Equalized Odds gap, and the `MetricFrame` class (zero Fairlearn dependencies).
- `faircredit_synthetic_loan_dataset.csv`: 5,000 synthetic micro-loan applicant records.
- `requirements.txt`: Python package dependencies.
- `README.md`: System documentation, methodology, model comparison, and reproduction instructions.

---

## 3. Setup and Execution

### Local Python Environment Setup

1. **Clone or navigate to the repository directory:**
   ```bash
   cd faircredit-platform
   ```

2. **Create and activate a virtual environment (Python 3.10+ recommended):**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the Streamlit application:**
   ```bash
   streamlit run app.py
   ```

5. **Open your browser:**
   Navigate to `http://localhost:8501`.

---

## 4. Model Comparison & Differences

| Dimension | Model 1: Baseline | Model 2: Reweighted (Pre-Processing) | Model 3: Threshold-Adjusted (Post-Processing) |
|---|---|---|---|
| **Intervention Point** | None (Unconstrained baseline) | Training data sample weighting | Decision threshold selection |
| **Sensitive Attribute in Features** | Excluded | Excluded | Excluded |
| **Training Mechanism** | Standard maximum likelihood on train data | Sample weights $w(g,y)$ passed to `sample_weight` in fitting | Baseline model fitted; separate validation split used to tune thresholds |
| **Decision Threshold** | Fixed at 0.50 | Fixed at 0.50 | Calibrated per group (e.g., Male vs Female thresholds) |
| **Primary Fairness Target** | Natural baseline benchmark | Balances joint demographic-outcome frequency | Minimizes $\max(\Delta\text{TPR}, \Delta\text{FPR})$ |
| **Legal / Policy Considerations** | Standard risk scoring | Generally permissible in internal model development | Group-specific thresholds may violate fair lending regulations (e.g., ECOA in US) |

---

## 5. Machine Learning Correctness & Verification

- **Train/Test Integrity:** 75% training (3,750 records) and 25% testing (1,250 records), stratified by target label using `random_state=42`.
- **Zero Test Leakage:** Preprocessing imputers and scalers are fitted exclusively on training records. Threshold calibration is performed on a sub-split of training data, never on the held-out test split.
- **Fairlearn-Free:** All metrics are implemented with pure NumPy and pandas.
- **Safety Handling:** Undefined metric cases (e.g., zero denominators in subgroup confusion matrices) return `NaN` or 0 safely without crashing.

---

## 6. Implementation Notes & Limitations

1. **Synthetic Data Status:** This dataset was synthetically generated for academic exploration. Distributions do not mirror actual banking portfolios.
2. **Target Label:** `repayment_success` indicates whether a synthetic loan was repaid. It is not an approval decision.
3. **Correlation vs Causation:** Cramér's V associations between geographic or occupational features and sensitive attributes highlight potential proxies, but statistical correlation does not prove illegal discrimination or causal harm.
4. **Regulatory Advisory:** Group-specific decision cutoffs are demonstrated as an academic post-processing technique; commercial deployment of differential underwriting thresholds by demographic class is legally restricted in many jurisdictions.
