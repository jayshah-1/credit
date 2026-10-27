"""
FairCredit: Algorithmic Bias Auditing and Mitigation in Digital Micro-Lending
app.py — Streamlit Interactive Web Application

A complete, working academic research prototype for auditing and mitigating
algorithmic bias in loan repayment risk modeling.

Run locally:
    streamlit run app.py
"""

import os
import io
import numpy as np
import pandas as pd
import streamlit as st
import plotly.express as px
import plotly.graph_objects as go

from model_pipeline import (
    load_dataset,
    validate_dataset,
    FairCreditExperiment,
    TARGET_COL,
    DEFAULT_SENSITIVE_COL,
    EXPECTED_COLUMNS,
    NUMERIC_FEATURES,
    CATEGORICAL_FEATURES,
    cramers_v,
    REVENUE_PER_SUCCESSFUL_LOAN,
    LOSS_PER_UNSUCCESSFUL_LOAN,
    OPERATING_COST_PER_APPROVED_LOAN
)

# Page configuration
st.set_page_config(
    page_title="FairCredit: AI Lending Bias Audit & Mitigation",
    page_icon="⚖️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom FinTech styling
st.markdown("""
<style>
    .main-title {
        font-size: 2.1rem;
        font-weight: 700;
        color: #0f172a;
        margin-bottom: 0.2rem;
    }
    .sub-title {
        font-size: 1.05rem;
        color: #475569;
        margin-bottom: 1.2rem;
    }
    .prototype-banner {
        background-color: #f0fdf4;
        border: 1px solid #bbf7d0;
        color: #166534;
        padding: 0.6rem 1rem;
        border-radius: 8px;
        font-size: 0.9rem;
        font-weight: 600;
        margin-bottom: 1.2rem;
        display: inline-block;
    }
    .metric-card {
        background-color: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 1rem;
        text-align: center;
    }
    .metric-val {
        font-size: 1.8rem;
        font-weight: 700;
        color: #0284c7;
    }
    .metric-label {
        font-size: 0.85rem;
        color: #64748b;
        font-weight: 500;
    }
    .definition-box {
        background-color: #f1f5f9;
        border-left: 4px solid #0284c7;
        padding: 0.75rem 1rem;
        border-radius: 0 8px 8px 0;
        font-size: 0.9rem;
        color: #334155;
        margin: 0.8rem 0;
    }
</style>
""", unsafe_allow_html=True)


@st.cache_data
def get_default_data() -> pd.DataFrame:
    """Loads the bundled synthetic loan dataset from local paths."""
    candidates = [
        "faircredit_synthetic_loan_dataset.csv",
        "public/assets/aistudio/faircredit_synthetic_loan_dataset_7e091947.csv",
        "/kaggle/input/faircredit-dataset/faircredit_synthetic_loan_dataset.csv"
    ]
    for p in candidates:
        if os.path.exists(p):
            return load_dataset(p)
    raise FileNotFoundError("Could not locate faircredit_synthetic_loan_dataset.csv")


@st.cache_resource
def get_trained_experiment(df: pd.DataFrame, sensitive_col: str) -> FairCreditExperiment:
    """Trains and audits the 3 models on the specified sensitive attribute."""
    exp = FairCreditExperiment(df, sensitive_col=sensitive_col)
    exp.fit_and_evaluate_all()
    return exp


# Load dataset and initialize experiment
try:
    df_raw = get_default_data()
except Exception as e:
    st.error(f"Error loading synthetic dataset: {e}")
    st.stop()

# Sidebar Navigation
with st.sidebar:
    st.title("⚖️ FairCredit Platform")
    st.markdown("**Algorithmic Bias Auditing & Mitigation in Digital Micro-Lending**")
    
    st.markdown('<div class="prototype-banner">Research Prototype (Synthetic Data)</div>', unsafe_allow_html=True)
    
    selected_page = st.radio(
        "Navigation",
        [
            "1. Overview & Home",
            "2. Dataset Explorer",
            "3. Applicant Prediction",
            "4. Model Performance",
            "5. Algorithmic Bias Audit",
            "6. Bias Mitigation Comparison",
            "7. Proxy Analysis",
            "8. Reports & Downloads"
        ],
        index=0
    )

    st.markdown("---")
    st.markdown("### Audit Configuration")
    sensitive_choice = st.selectbox(
        "Primary Sensitive Attribute:",
        ["gender", "socioeconomic_group"],
        index=0,
        help="Attribute to disaggregate metrics against (default matches reference notebook: gender)."
    )

    st.markdown("---")
    st.caption("Target variable: `repayment_success` (1 = Repaid, 0 = Defaulted).")
    st.caption("No Fairlearn import. Evaluated offline on held-out test split.")

# Train models using cached resource
experiment = get_trained_experiment(df_raw, sensitive_choice)

# -------------------------------------------------------------
# PAGE 1: HOME DASHBOARD
# -------------------------------------------------------------
if selected_page == "1. Overview & Home":
    st.markdown('<div class="main-title">FairCredit AI Lending Bias Audit & Mitigation</div>', unsafe_allow_html=True)
    st.markdown(
        '<div class="sub-title">Algorithmic Auditing, Demographic Parity, Equalized Odds, and Mitigation '
        'Strategies for Machine Learning Credit Scoring</div>',
        unsafe_allow_html=True
    )

    st.markdown('<div class="prototype-banner">⚠️ Synthetic Dataset — Academic Research Prototype</div>', unsafe_allow_html=True)

    st.info(
        "**Context & Research Goal:** Traditional and algorithmic credit scoring systems can encode or amplify historical "
        "inequities when proxies for sensitive characteristics (gender, neighborhood, economic group) correlate with credit signals. "
        "This platform inspects a baseline Logistic Regression model predicting micro-loan repayment, quantifies algorithmic bias "
        "across groups, tests pre-processing (reweighing) and post-processing (threshold adjustment) mitigations, and compares "
        "fairness-accuracy trade-offs against an illustrative business impact model."
    )

    # Key Metrics KPI Row
    col1, col2, col3, col4, col5 = st.columns(5)
    with col1:
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-val">{len(df_raw):,}</div>
            <div class="metric-label">Dataset Records</div>
        </div>
        """, unsafe_allow_html=True)
    with col2:
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-val">{len(experiment.X.columns)}</div>
            <div class="metric-label">Model Input Features</div>
        </div>
        """, unsafe_allow_html=True)
    with col3:
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-val">3</div>
            <div class="metric-label">Models Evaluated</div>
        </div>
        """, unsafe_allow_html=True)
    with col4:
        base_acc = experiment.summaries["Baseline"]["accuracy"]
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-val">{base_acc:.1%}</div>
            <div class="metric-label">Baseline Accuracy</div>
        </div>
        """, unsafe_allow_html=True)
    with col5:
        di_ratio = experiment.summaries["Baseline"]["disparate_impact_ratio"]
        status_color = "#e11d48" if di_ratio < 0.8 else "#16a34a"
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-val" style="color: {status_color}">{di_ratio:.2f}</div>
            <div class="metric-label">Baseline DI Ratio</div>
        </div>
        """, unsafe_allow_html=True)

    st.markdown("### Quick Navigation to Modules")
    nav_col1, nav_col2, nav_col3, nav_col4 = st.columns(4)
    with nav_col1:
        st.markdown("#### 📊 Dataset Explorer")
        st.write("Inspect distributions, target class imbalance, categorical frequencies, and correlation patterns.")
    with nav_col2:
        st.markdown("#### 🔮 Applicant Prediction")
        st.write("Run real single-applicant predictions across all three trained models with risk probability breakdowns.")
    with nav_col3:
        st.markdown("#### ⚖️ Bias Audit & Mitigation")
        st.write("Examine selection rates, TPR/FPR disparities, equalized odds gaps, and pre/post mitigation metrics.")
    with nav_col4:
        st.markdown("#### 📑 Reports & Downloads")
        st.write("Download full test prediction CSVs, group fairness tables, and an executive audit markdown report.")

# -------------------------------------------------------------
# PAGE 2: DATASET EXPLORER
# -------------------------------------------------------------
elif selected_page == "2. Dataset Explorer":
    st.markdown('<div class="main-title">Dataset Explorer</div>', unsafe_allow_html=True)
    st.markdown('<div class="sub-title">Inspect dataset distributions, summary statistics, and target representation</div>', unsafe_allow_html=True)

    # Optional CSV uploader
    with st.expander("Upload Alternative Compatible CSV"):
        uploaded_file = st.file_uploader("Upload CSV file", type=["csv"])
        if uploaded_file is not None:
            try:
                uploaded_df = load_dataset(uploaded_file)
                st.success(f"Successfully loaded uploaded dataset with {len(uploaded_df)} rows!")
            except Exception as e:
                st.error(f"Incompatible CSV format: {e}")

    tab1, tab2, tab3 = st.tabs(["Overview & Summary", "Categorical Distributions", "Numeric Distributions & Heatmaps"])

    with tab1:
        col1, col2, col3, col4 = st.columns(4)
        col1.metric("Total Records", f"{len(df_raw):,}")
        col2.metric("Total Columns", f"{len(df_raw.columns)}")
        col3.metric("Missing Values", f"{df_raw.isna().sum().sum()}")
        col4.metric("Duplicate Rows", f"{df_raw.duplicated().sum()}")

        st.subheader("Dataset Preview (First 10 Rows)")
        st.dataframe(df_raw.head(10), use_container_width=True)

        st.subheader("Summary Statistics")
        st.dataframe(df_raw.describe(include="all").T, use_container_width=True)

    with tab2:
        st.subheader("Target and Protected Group Representations")
        c1, c2 = st.columns(2)
        with c1:
            target_counts = df_raw[TARGET_COL].value_counts().reset_index()
            target_counts.columns = ["Repayment Success", "Count"]
            target_counts["Outcome"] = target_counts["Repayment Success"].map({1: "Repaid (1)", 0: "Defaulted (0)"})
            fig_target = px.bar(
                target_counts,
                x="Outcome",
                y="Count",
                color="Outcome",
                title="Target Variable Distribution (repayment_success)",
                color_discrete_sequence=["#0284c7", "#f43f5e"]
            )
            st.plotly_chart(fig_target, use_container_width=True)

        with c2:
            fig_gender = px.histogram(
                df_raw,
                x="gender",
                color=TARGET_COL,
                barmode="group",
                title="Target Representation Disaggregated by Gender",
                color_discrete_sequence=["#94a3b8", "#0284c7"]
            )
            st.plotly_chart(fig_gender, use_container_width=True)

        c3, c4 = st.columns(2)
        with c3:
            fig_socio = px.histogram(
                df_raw,
                x="socioeconomic_group",
                color=TARGET_COL,
                barmode="group",
                title="Socioeconomic Group Representation",
                category_orders={"socioeconomic_group": ["Lower", "Middle", "Higher"]},
                color_discrete_sequence=["#94a3b8", "#0d9488"]
            )
            st.plotly_chart(fig_socio, use_container_width=True)
        with c4:
            fig_occ = px.histogram(
                df_raw,
                x="occupation",
                color=TARGET_COL,
                barmode="group",
                title="Occupation Representation",
                color_discrete_sequence=["#94a3b8", "#6366f1"]
            )
            st.plotly_chart(fig_occ, use_container_width=True)

    with tab3:
        st.subheader("Numeric Features Correlation Matrix")
        numeric_cols = [c for c in NUMERIC_FEATURES if c in df_raw.columns]
        corr_matrix = df_raw[numeric_cols].corr()
        fig_corr = px.imshow(
            corr_matrix,
            text_auto=".2f",
            aspect="auto",
            color_continuous_scale="RdBu_r",
            zmin=-1,
            zmax=1,
            title="Pearson Correlation Matrix (Numeric Features)"
        )
        st.plotly_chart(fig_corr, use_container_width=True)

        st.subheader("Feature Distributions")
        selected_num = st.selectbox("Select numeric feature to inspect:", numeric_cols)
        h_col1, h_col2 = st.columns(2)
        with h_col1:
            fig_hist = px.histogram(
                df_raw,
                x=selected_num,
                color="gender",
                marginal="box",
                title=f"Histogram & Boxplot for {selected_num} by Gender",
                color_discrete_sequence=["#0284c7", "#f43f5e"]
            )
            st.plotly_chart(fig_hist, use_container_width=True)
        with h_col2:
            fig_kde = px.box(
                df_raw,
                x="socioeconomic_group",
                y=selected_num,
                color="gender",
                title=f"{selected_num} by Socioeconomic Group & Gender",
                category_orders={"socioeconomic_group": ["Lower", "Middle", "Higher"]},
                color_discrete_sequence=["#0284c7", "#f43f5e"]
            )
            st.plotly_chart(fig_kde, use_container_width=True)

# -------------------------------------------------------------
# PAGE 3: APPLICANT PREDICTION
# -------------------------------------------------------------
elif selected_page == "3. Applicant Prediction":
    st.markdown('<div class="main-title">Interactive Applicant Prediction</div>', unsafe_allow_html=True)
    st.markdown('<div class="sub-title">Test single-applicant inference across the trained Baseline, Reweighted, and Threshold-adjusted models</div>', unsafe_allow_html=True)

    st.markdown(
        '<div class="definition-box"><b>Feature Neutrality Rule:</b> In accordance with the reference project design, '
        'sensitive attributes (such as <code>gender</code>) are strictly excluded from the baseline model inputs during training and prediction. '
        'However, sensitive group membership is retained for threshold evaluation and auditing.</div>',
        unsafe_allow_html=True
    )

    with st.form("applicant_form"):
        st.subheader("Applicant Profile")
        col_a, col_b, col_c = st.columns(3)
        with col_a:
            in_gender = st.selectbox("Gender (Sensitive Attribute):", ["Male", "Female"], index=1)
            in_socio = st.selectbox("Socioeconomic Group:", ["Lower", "Middle", "Higher"], index=1)
            in_postal = st.selectbox("Postal Code:", ["P1", "P2", "P3", "P4", "P5"], index=2)
            in_occup = st.selectbox("Occupation:", ["Manual", "Service", "Professional", "Self-employed"], index=1)
        with col_b:
            in_income = st.number_input("Annual Income ($):", min_value=5000.0, max_value=250000.0, value=48000.0, step=1000.0)
            in_credit = st.slider("Credit Score:", min_value=300, max_value=850, value=630, step=1)
            in_dti = st.slider("Debt-to-Income (DTI) Ratio:", min_value=0.0, max_value=1.0, value=0.28, step=0.01)
        with col_c:
            in_loan = st.number_input("Loan Amount Requested ($):", min_value=500.0, max_value=50000.0, value=12000.0, step=500.0)
            in_emp = st.slider("Employment Length (Years):", min_value=0.0, max_value=40.0, value=5.5, step=0.5)
            in_defaults = st.selectbox("Previous Defaults Count:", [0, 1, 2], index=0)

        model_select = st.selectbox(
            "Evaluation Model Variant:",
            ["Baseline", "Reweighted", "Threshold-adjusted"],
            index=0,
            help="Choose which mitigation approach to apply to the applicant."
        )

        submitted = st.form_submit_button("Predict Repayment Outcome", use_container_width=True)

    if submitted:
        applicant_payload = {
            "gender": in_gender,
            "socioeconomic_group": in_socio,
            "postal_code": in_postal,
            "occupation": in_occup,
            "annual_income": in_income,
            "credit_score": in_credit,
            "debt_to_income_ratio": in_dti,
            "loan_amount": in_loan,
            "employment_years": in_emp,
            "previous_defaults": in_defaults
        }

        result = experiment.predict_single_applicant(applicant_payload, model_type=model_select)
        prob = result["probability_repayment_success"]
        pred_class = result["predicted_class"]
        threshold = result["decision_threshold"]

        st.markdown("---")
        st.subheader("Prediction Result & Risk Analysis")
        res_col1, res_col2, res_col3 = st.columns(3)

        with res_col1:
            st.metric("Estimated Repayment Probability", f"{prob:.1%}")
        with res_col2:
            st.metric("Decision Threshold Applied", f"{threshold:.2f}")
        with res_col3:
            outcome_label = "✅ High Repayment Likelihood (Approved)" if pred_class == 1 else "⚠️ High Default Risk (Flagged)"
            st.metric("Model Classification", outcome_label)

        # Visual Probability Bar
        gauge_color = "#16a34a" if pred_class == 1 else "#dc2626"
        st.progress(prob)

        st.write(f"**Classification Mechanism:** Probability ({prob:.3f}) vs Applied Threshold ({threshold:.3f}) under the **{model_select}** model.")
        if model_select == "Threshold-adjusted":
            st.info(
                f"Notice: The Threshold-adjusted model applied a group-specific threshold of **{threshold:.3f}** "
                f"for group '{in_gender}', selected during the validation search to equalize error rates."
            )

        st.warning(result["disclaimer"])

# -------------------------------------------------------------
# PAGE 4: MODEL PERFORMANCE
# -------------------------------------------------------------
elif selected_page == "4. Model Performance":
    st.markdown('<div class="main-title">Model Training & Performance Comparison</div>', unsafe_allow_html=True)
    st.markdown('<div class="sub-title">Evaluation on the held-out test split (25% = 1,250 records)</div>', unsafe_allow_html=True)

    comp_df = experiment.get_comparison_table()

    st.subheader("Performance Metrics Summary Table")
    perf_cols = ["accuracy", "precision", "recall", "f1", "roc_auc"]
    st.dataframe(comp_df[perf_cols].style.format("{:.3f}").highlight_max(axis=0, color="#dcfce7"), use_container_width=True)

    c1, c2 = st.columns(2)
    with c1:
        fig_perf = px.bar(
            comp_df[perf_cols].reset_index(),
            x="model",
            y=perf_cols,
            barmode="group",
            title="Predictive Performance Comparison",
            color_discrete_sequence=["#0284c7", "#0d9488", "#f59e0b", "#6366f1", "#ec4899"]
        )
        fig_perf.update_layout(yaxis=dict(range=[0, 1.05]))
        st.plotly_chart(fig_perf, use_container_width=True)

    with c2:
        st.subheader("Confusion Matrices (Test Set)")
        cm_model = st.selectbox("Select model confusion matrix to view:", ["Baseline", "Reweighted", "Threshold-adjusted"])
        cm = experiment.confusion_matrices[cm_model]
        cm_df = pd.DataFrame(cm, index=["Actual 0 (Default)", "Actual 1 (Repaid)"], columns=["Pred 0", "Pred 1"])
        fig_cm = px.imshow(
            cm_df,
            text_auto=True,
            color_continuous_scale="Blues",
            title=f"Confusion Matrix: {cm_model}"
        )
        st.plotly_chart(fig_cm, use_container_width=True)

    st.markdown("---")
    st.subheader("Illustrative Business Viability Analysis")
    st.markdown(
        '<div class="definition-box"><b>Illustrative Financial Scenario:</b> Revenue per successful loan = $1,200 | '
        'Loss per defaulted loan = -$5,000 | Operating cost per approved applicant = $250. '
        'This is a simplified retrospective scenario on test outcomes, not a bank earnings forecast.</div>',
        unsafe_allow_html=True
    )
    biz_df = experiment.get_business_comparison_table()
    st.dataframe(
        biz_df.style.format({
            "predicted_positive_count": "{:,}",
            "predicted_positive_rate": "{:.2%}",
            "observed_success_rate_among_positive": "{:.2%}",
            "illustrative_net_value": "${:,.2f}"
        }),
        use_container_width=True
    )

# -------------------------------------------------------------
# PAGE 5: ALGORITHMIC BIAS AUDIT
# -------------------------------------------------------------
elif selected_page == "5. Algorithmic Bias Audit":
    st.markdown('<div class="main-title">Algorithmic Bias Audit</div>', unsafe_allow_html=True)
    st.markdown(f'<div class="sub-title">Disaggregated Fairness Metrics Across Protected Groups ({sensitive_choice.upper()})</div>', unsafe_allow_html=True)

    st.markdown("""
    ### Definitions of Evaluated Fairness Criteria:
    - **Selection Rate:** Proportion of applicants in a demographic group assigned a positive model classification (predicted repayment success).
    - **Selection Rate Gap:** $\max(\text{Selection Rate}) - \min(\text{Selection Rate})$. Measures demographic parity violation.
    - **Disparate Impact Ratio (DI):** $\min(\text{Selection Rate}) / \max(\text{Selection Rate})$. An 80% (0.80) threshold is often used illustratively as an industry benchmark.
    - **True Positive Rate (TPR) / Recall:** Proportion of actually successful applicants correctly identified by the model.
    - **False Positive Rate (FPR):** Proportion of actually defaulting applicants mistakenly classified as successful repayers.
    - **Equalized Odds Gap:** $\max(|\Delta \text{TPR}|, |\Delta \text{FPR}|)$. Measures equality of error rates across protected groups.
    """)

    st.subheader(f"Group-Level Breakdown: Baseline Model (by {sensitive_choice})")
    base_group_df = experiment.group_tables["Baseline"]
    st.dataframe(base_group_df.style.format("{:.3f}"), use_container_width=True)

    audit_col1, audit_col2 = st.columns(2)
    with audit_col1:
        fig_sr = px.bar(
            base_group_df.reset_index(),
            x="group",
            y="selection_rate",
            color="group",
            title=f"Selection Rate by {sensitive_choice.title()} (Baseline)",
            color_discrete_sequence=["#0284c7", "#f43f5e", "#0d9488"]
        )
        fig_sr.update_layout(yaxis=dict(range=[0, 1.05]))
        st.plotly_chart(fig_sr, use_container_width=True)

    with audit_col2:
        tpr_fpr_df = base_group_df[["TPR", "FPR"]].reset_index()
        fig_rates = px.bar(
            tpr_fpr_df,
            x="group",
            y=["TPR", "FPR"],
            barmode="group",
            title=f"TPR and FPR by {sensitive_choice.title()} (Baseline)",
            color_discrete_sequence=["#10b981", "#ef4444"]
        )
        fig_rates.update_layout(yaxis=dict(range=[0, 1.05]))
        st.plotly_chart(fig_rates, use_container_width=True)

    st.markdown("---")
    st.subheader("Baseline Fairness Gaps")
    base_summary = experiment.summaries["Baseline"]
    g1, g2, g3, g4 = st.columns(4)
    g1.metric("Selection Rate Gap", f"{base_summary['selection_rate_gap']:.3f}")
    g2.metric("Disparate Impact Ratio", f"{base_summary['disparate_impact_ratio']:.3f}")
    g3.metric("TPR Gap", f"{base_summary['TPR_gap']:.3f}")
    g4.metric("Equalized Odds Max Gap", f"{base_summary['equalized_odds_gap_max']:.3f}")

# -------------------------------------------------------------
# PAGE 6: BIAS MITIGATION COMPARISON
# -------------------------------------------------------------
elif selected_page == "6. Bias Mitigation Comparison":
    st.markdown('<div class="main-title">Bias Mitigation Comparison</div>', unsafe_allow_html=True)
    st.markdown('<div class="sub-title">Evaluating Pre-Processing (Reweighing) and Post-Processing (Threshold Adjustment)</div>', unsafe_allow_html=True)

    comp_df = experiment.get_comparison_table()

    st.subheader("Before and After Mitigation Comparison")
    gap_cols = ["disparate_impact_ratio", "selection_rate_gap", "TPR_gap", "FPR_gap", "equalized_odds_gap_max"]
    st.dataframe(comp_df[gap_cols].style.format("{:.3f}"), use_container_width=True)

    m_col1, m_col2 = st.columns(2)
    with m_col1:
        fig_di = px.bar(
            comp_df.reset_index(),
            x="model",
            y="disparate_impact_ratio",
            color="model",
            title="Disparate Impact Ratio (Higher is closer to parity = 1.0)",
            color_discrete_sequence=["#64748b", "#0284c7", "#0d9488"]
        )
        fig_di.add_hline(y=0.80, line_dash="dot", line_color="red", annotation_text="Illustrative 0.80 Threshold")
        fig_di.update_layout(yaxis=dict(range=[0, 1.15]))
        st.plotly_chart(fig_di, use_container_width=True)

    with m_col2:
        fig_gaps = px.bar(
            comp_df.reset_index(),
            x="model",
            y=["selection_rate_gap", "TPR_gap", "FPR_gap", "equalized_odds_gap_max"],
            barmode="group",
            title="Fairness Gaps Across Models (Lower is smaller disparity)",
            color_discrete_sequence=["#38bdf8", "#34d399", "#fbbf24", "#f87171"]
        )
        st.plotly_chart(fig_gaps, use_container_width=True)

    st.markdown("### Algorithmic Mitigation Insights")
    st.markdown(f"""
    1. **Pre-Processing (Reweighing):** Assigns inverse joint frequency weights $w(g, y) = P(g)P(y)/P(g, y)$ to training rows.
       This directly reduces historical association between demographic membership and target labels in the training loss,
       adjusting the learned coefficient slopes without requiring sensitive attribute inputs during inference.
    2. **Post-Processing (Group-Specific Thresholds):** Learns calibrated thresholds on a separate validation split:
       `{experiment.val_thresholds}`. This directly minimizes TPR/FPR disparities.
    3. **Fairness Trade-offs:** Notice that equalizing TPR/FPR can impact disparate impact ratios or precision.
       No single mitigation technique satisfies every mathematical definition of fairness simultaneously.
    """)

# -------------------------------------------------------------
# PAGE 7: FEATURE & PROXY ANALYSIS
# -------------------------------------------------------------
elif selected_page == "7. Proxy Analysis":
    st.markdown('<div class="main-title">Feature & Proxy Analysis</div>', unsafe_allow_html=True)
    st.markdown('<div class="sub-title">Investigating Proxy Redundancy and Categorical Associations with Protected Features</div>', unsafe_allow_html=True)

    st.markdown(
        '<div class="definition-box"><b>Responsible AI Note:</b> A statistical correlation or association between a feature '
        '(such as postal code or occupation) and a protected class (such as gender or socioeconomic group) does <b>not</b> '
        'by itself establish intentional discrimination or causal bias. It serves as a diagnostic signal for possible proxy leakage.</div>',
        unsafe_allow_html=True
    )

    cat_cols = ["gender", "socioeconomic_group", "postal_code", "occupation"]
    assoc_df = pd.DataFrame(index=cat_cols, columns=cat_cols, dtype=float)
    for a in cat_cols:
        for b in cat_cols:
            assoc_df.loc[a, b] = 1.0 if a == b else cramers_v(df_raw[a], df_raw[b])

    c1, c2 = st.columns([1.2, 1])
    with c1:
        st.subheader("Categorical Association Matrix (Cramér's V)")
        fig_assoc = px.imshow(
            assoc_df.astype(float),
            text_auto=".3f",
            color_continuous_scale="Blues",
            zmin=0,
            zmax=1,
            title="Cramér's V Association (0 = Independent, 1 = Redundant)"
        )
        st.plotly_chart(fig_assoc, use_container_width=True)

    with c2:
        st.subheader("Cramér's V Data Table")
        st.dataframe(assoc_df.style.format("{:.3f}"), use_container_width=True)
        st.markdown("""
        **Interpretation Guidelines:**
        - **V < 0.10:** Negligible association
        - **0.10 ≤ V < 0.30:** Low to moderate association
        - **0.30 ≤ V < 0.50:** Moderate to high association
        - **V ≥ 0.50:** Strong association (potential strong proxy)
        """)

# -------------------------------------------------------------
# PAGE 8: REPORTS & DOWNLOADS
# -------------------------------------------------------------
elif selected_page == "8. Reports & Downloads":
    st.markdown('<div class="main-title">Reports & Data Exports</div>', unsafe_allow_html=True)
    st.markdown('<div class="sub-title">Download all computed model predictions, fairness tables, and the audit report</div>', unsafe_allow_html=True)

    st.info("All download files are generated on demand from actual computed model states and held-out test splits.")

    d_col1, d_col2 = st.columns(2)
    with d_col1:
        st.markdown("#### 1. Model Comparison Metrics CSV")
        comp_df = experiment.get_comparison_table()
        comp_csv = comp_df.to_csv().encode("utf-8")
        st.download_button(
            label="Download model_comparison_metrics.csv",
            data=comp_csv,
            file_name="model_comparison_metrics.csv",
            mime="text/csv",
            use_container_width=True
        )

        st.markdown("#### 2. Group Fairness Metrics CSV")
        base_group_df = experiment.group_tables["Baseline"]
        group_csv = base_group_df.to_csv().encode("utf-8")
        st.download_button(
            label="Download group_fairness_metrics.csv",
            data=group_csv,
            file_name="group_fairness_metrics.csv",
            mime="text/csv",
            use_container_width=True
        )

    with d_col2:
        st.markdown("#### 3. Full Held-Out Test Predictions CSV")
        preds_df = experiment.get_test_predictions_dataframe()
        preds_csv = preds_df.to_csv(index=False).encode("utf-8")
        st.download_button(
            label="Download test_predictions.csv",
            data=preds_csv,
            file_name="test_predictions.csv",
            mime="text/csv",
            use_container_width=True
        )

        st.markdown("#### 4. Illustrative Business Comparison CSV")
        biz_df = experiment.get_business_comparison_table()
        biz_csv = biz_df.to_csv().encode("utf-8")
        st.download_button(
            label="Download illustrative_business_comparison.csv",
            data=biz_csv,
            file_name="illustrative_business_comparison.csv",
            mime="text/csv",
            use_container_width=True
        )

    st.markdown("---")
    st.subheader("Auditing Report Summary (Markdown Export)")

    comp = experiment.get_comparison_table()
    report_md = f"""# FairCredit Algorithmic Bias Audit & Mitigation Report
**Dataset Status:** Synthetic Dataset — Academic Research Prototype
**Primary Target Variable:** `repayment_success` (Binary: 1 = Repaid, 0 = Defaulted)
**Sensitive Attribute Audited:** `{sensitive_choice}`

---

## 1. Executive Summary & Model Comparison

| Model | Accuracy | Precision | Recall | F1 | ROC-AUC | Selection Rate Gap | DI Ratio | TPR Gap | FPR Gap | Eq. Odds Max Gap |
|---|---|---|---|---|---|---|---|---|---|---|
| **Baseline** | {comp.loc['Baseline', 'accuracy']:.3f} | {comp.loc['Baseline', 'precision']:.3f} | {comp.loc['Baseline', 'recall']:.3f} | {comp.loc['Baseline', 'f1']:.3f} | {comp.loc['Baseline', 'roc_auc']:.3f} | {comp.loc['Baseline', 'selection_rate_gap']:.3f} | {comp.loc['Baseline', 'disparate_impact_ratio']:.3f} | {comp.loc['Baseline', 'TPR_gap']:.3f} | {comp.loc['Baseline', 'FPR_gap']:.3f} | {comp.loc['Baseline', 'equalized_odds_gap_max']:.3f} |
| **Reweighted** | {comp.loc['Reweighted', 'accuracy']:.3f} | {comp.loc['Reweighted', 'precision']:.3f} | {comp.loc['Reweighted', 'recall']:.3f} | {comp.loc['Reweighted', 'f1']:.3f} | {comp.loc['Reweighted', 'roc_auc']:.3f} | {comp.loc['Reweighted', 'selection_rate_gap']:.3f} | {comp.loc['Reweighted', 'disparate_impact_ratio']:.3f} | {comp.loc['Reweighted', 'TPR_gap']:.3f} | {comp.loc['Reweighted', 'FPR_gap']:.3f} | {comp.loc['Reweighted', 'equalized_odds_gap_max']:.3f} |
| **Threshold-adjusted** | {comp.loc['Threshold-adjusted', 'accuracy']:.3f} | {comp.loc['Threshold-adjusted', 'precision']:.3f} | {comp.loc['Threshold-adjusted', 'recall']:.3f} | {comp.loc['Threshold-adjusted', 'f1']:.3f} | {comp.loc['Threshold-adjusted', 'roc_auc']:.3f} | {comp.loc['Threshold-adjusted', 'selection_rate_gap']:.3f} | {comp.loc['Threshold-adjusted', 'disparate_impact_ratio']:.3f} | {comp.loc['Threshold-adjusted', 'TPR_gap']:.3f} | {comp.loc['Threshold-adjusted', 'FPR_gap']:.3f} | {comp.loc['Threshold-adjusted', 'equalized_odds_gap_max']:.3f} |

---

## 2. Methodology & Validation Rules
- **Split Strategy:** 75% training / 25% held-out test split, stratified by repayment success with random seed 42.
- **Preprocessing:** Median imputation and StandardScaler for numeric variables; Most frequent imputation and OneHotEncoder for categoricals. Preprocessing is fit strictly on training data.
- **Sensitive Features:** Excluded from baseline model features to prevent direct demographic disparate treatment.
- **Post-Processing Calibration:** Threshold grid search was performed exclusively on a sub-validation split of the training data. The held-out test set was evaluated post-facto.

---

## 3. Findings & Limitations
1. **Trade-offs:** Pre-processing reweighing successfully altered sample weighting to mitigate label imbalance, while threshold adjustment directly targeted error rate parity.
2. **Proxy Associations:** Cramér's V tests indicate non-trivial associations with postal codes and occupation.
3. **Legal Disclaimer:** Group-specific decision thresholds may raise legal and regulatory restrictions in commercial lending jurisdictions. This report reflects an educational research prototype.
"""

    st.text_area("Audit Report Preview", report_md, height=280)
    st.download_button(
        label="Download Full Audit Report (Markdown)",
        data=report_md.encode("utf-8"),
        file_name="faircredit_audit_report.md",
        mime="text/markdown",
        use_container_width=True
    )
