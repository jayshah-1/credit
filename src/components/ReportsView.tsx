import React, { useState } from "react";
import { AuditData } from "../types";
import {
  FileDown,
  FileSpreadsheet,
  FileText,
  Copy,
  Check,
  Terminal,
  Download,
  Code
} from "lucide-react";

interface ReportsViewProps {
  audit: AuditData | null;
  sensitiveCol: string;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ audit, sensitiveCol }) => {
  const [copied, setCopied] = useState(false);
  const [activeCodeFile, setActiveCodeFile] = useState<string>("app.py");
  const [fileContent, setFileContent] = useState<string>("");
  const [loadingFile, setLoadingFile] = useState(false);

  const fetchCode = async (fileName: string) => {
    setActiveCodeFile(fileName);
    setLoadingFile(true);
    try {
      const res = await fetch(`/api/file-content?file=${fileName}`);
      if (res.ok) {
        const text = await res.text();
        setFileContent(text);
      } else {
        setFileContent("// Unable to load file content.");
      }
    } catch {
      setFileContent("// Network error loading file.");
    } finally {
      setLoadingFile(false);
    }
  };

  React.useEffect(() => {
    fetchCode("app.py");
  }, []);

  const baseline = audit?.comparison_table.find((m) => m.model === "Baseline");
  const reweighted = audit?.comparison_table.find((m) => m.model === "Reweighted");
  const threshold = audit?.comparison_table.find((m) => m.model === "Threshold-adjusted");

  const markdownReport = `# FairCredit Algorithmic Bias Audit & Mitigation Report
**Dataset Status:** Synthetic Dataset — Academic Research Prototype
**Target Variable:** \`repayment_success\` (1 = Repaid, 0 = Defaulted)
**Evaluated Protected Attribute:** \`${sensitiveCol}\`
**Test Split:** 25% held-out test data (N=${audit?.test_set_size || 1250})

---

## 1. Executive Summary & Model Comparison

| Model Pipeline | Accuracy | Precision | Recall (TPR) | F1-Score | ROC-AUC | Selection Rate Gap | Disparate Impact Ratio | Equalized Odds Max Gap |
|---|---|---|---|---|---|---|---|---|
| **Baseline** | ${baseline ? (baseline.accuracy * 100).toFixed(1) + "%" : "..."} | ${baseline ? (baseline.precision * 100).toFixed(1) + "%" : "..."} | ${baseline ? (baseline.recall * 100).toFixed(1) + "%" : "..."} | ${baseline ? baseline.f1.toFixed(3) : "..."} | ${baseline ? baseline.roc_auc.toFixed(3) : "..."} | ${baseline ? baseline.selection_rate_gap.toFixed(3) : "..."} | ${baseline ? baseline.disparate_impact_ratio.toFixed(3) : "..."} | ${baseline ? baseline.equalized_odds_gap_max.toFixed(3) : "..."} |
| **Reweighted** | ${reweighted ? (reweighted.accuracy * 100).toFixed(1) + "%" : "..."} | ${reweighted ? (reweighted.precision * 100).toFixed(1) + "%" : "..."} | ${reweighted ? (reweighted.recall * 100).toFixed(1) + "%" : "..."} | ${reweighted ? reweighted.f1.toFixed(3) : "..."} | ${reweighted ? reweighted.roc_auc.toFixed(3) : "..."} | ${reweighted ? reweighted.selection_rate_gap.toFixed(3) : "..."} | ${reweighted ? reweighted.disparate_impact_ratio.toFixed(3) : "..."} | ${reweighted ? reweighted.equalized_odds_gap_max.toFixed(3) : "..."} |
| **Threshold-adjusted** | ${threshold ? (threshold.accuracy * 100).toFixed(1) + "%" : "..."} | ${threshold ? (threshold.precision * 100).toFixed(1) + "%" : "..."} | ${threshold ? (threshold.recall * 100).toFixed(1) + "%" : "..."} | ${threshold ? threshold.f1.toFixed(3) : "..."} | ${threshold ? threshold.roc_auc.toFixed(3) : "..."} | ${threshold ? threshold.selection_rate_gap.toFixed(3) : "..."} | ${threshold ? threshold.disparate_impact_ratio.toFixed(3) : "..."} | ${threshold ? threshold.equalized_odds_gap_max.toFixed(3) : "..."} |

---

## 2. Learned Validation Thresholds
${audit ? JSON.stringify(audit.validation_thresholds, null, 2) : "..."}

---

## 3. Methodology & Evaluation Rigor
1. **Train/Test Split:** Stratified 75%/25% split on target with fixed seed (random_state=42).
2. **Preprocessing:** Standard scalers and median/most frequent imputers fit strictly on training partitions to prevent data leakage.
3. **Threshold Calibration:** Tuned on an internal training validation partition, evaluated post-hoc on held-out test data.
4. **Fairlearn Independence:** All formulas implemented in pure NumPy and pandas.

---

## 4. Key Limitations & Regulatory Disclosures
- **Synthetic Status:** Data was artificially generated for coursework demonstration.
- **Fair Lending Law:** Commercial deployment of group-specific decision cutoffs is legally restricted in several jurisdictions.
- **Metric Tension:** Equalizing error rates can cause shifts in positive prediction volume and precision.
`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(markdownReport);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Download Action Cards */}
      <div>
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
          Download Computed Results & Datasets
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <a
            href={`/api/export/model_comparison_metrics.csv?sensitive=${sensitiveCol}`}
            download="model_comparison_metrics.csv"
            className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-teal-500 hover:shadow-md transition-all flex flex-col justify-between group"
          >
            <div>
              <FileSpreadsheet className="w-5 h-5 text-teal-600 mb-2" />
              <h4 className="text-xs font-bold text-slate-900 group-hover:text-teal-600 transition-colors">
                Model Metrics CSV
              </h4>
              <p className="text-[11px] text-slate-500 mt-1">
                Accuracy, F1, ROC-AUC, Disparate Impact, and TPR/FPR gaps.
              </p>
            </div>
            <div className="mt-4 pt-2 border-t border-slate-100 flex items-center gap-1.5 text-xs text-teal-600 font-semibold">
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV</span>
            </div>
          </a>

          <a
            href={`/api/export/group_fairness_metrics.csv?sensitive=${sensitiveCol}`}
            download="group_fairness_metrics.csv"
            className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-teal-500 hover:shadow-md transition-all flex flex-col justify-between group"
          >
            <div>
              <FileSpreadsheet className="w-5 h-5 text-indigo-600 mb-2" />
              <h4 className="text-xs font-bold text-slate-900 group-hover:text-teal-600 transition-colors">
                Group Fairness CSV
              </h4>
              <p className="text-[11px] text-slate-500 mt-1">
                Disaggregated group metrics by {sensitiveCol}.
              </p>
            </div>
            <div className="mt-4 pt-2 border-t border-slate-100 flex items-center gap-1.5 text-xs text-indigo-600 font-semibold">
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV</span>
            </div>
          </a>

          <a
            href={`/api/export/business_comparison.csv?sensitive=${sensitiveCol}`}
            download="illustrative_business_comparison.csv"
            className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-teal-500 hover:shadow-md transition-all flex flex-col justify-between group"
          >
            <div>
              <FileSpreadsheet className="w-5 h-5 text-emerald-600 mb-2" />
              <h4 className="text-xs font-bold text-slate-900 group-hover:text-teal-600 transition-colors">
                Financial Impact CSV
              </h4>
              <p className="text-[11px] text-slate-500 mt-1">
                Net value scenarios, positive counts, and success rates.
              </p>
            </div>
            <div className="mt-4 pt-2 border-t border-slate-100 flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV</span>
            </div>
          </a>

          <a
            href={`/api/export/faircredit_audit_report.md?sensitive=${sensitiveCol}`}
            download="faircredit_audit_report.md"
            className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-teal-500 hover:shadow-md transition-all flex flex-col justify-between group"
          >
            <div>
              <FileText className="w-5 h-5 text-amber-600 mb-2" />
              <h4 className="text-xs font-bold text-slate-900 group-hover:text-teal-600 transition-colors">
                Audit Report (Markdown)
              </h4>
              <p className="text-[11px] text-slate-500 mt-1">
                Complete research methodology and findings summary.
              </p>
            </div>
            <div className="mt-4 pt-2 border-t border-slate-100 flex items-center gap-1.5 text-xs text-amber-600 font-semibold">
              <Download className="w-3.5 h-3.5" />
              <span>Download MD</span>
            </div>
          </a>
        </div>
      </div>

      {/* Markdown Audit Report Preview */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-teal-600" />
            <span>Audit Report Live Preview</span>
          </h4>
          <button
            onClick={copyToClipboard}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-md border border-slate-300 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied!" : "Copy Markdown"}</span>
          </button>
        </div>
        <div className="p-5 font-mono text-xs text-slate-800 bg-slate-900 text-slate-200 max-h-80 overflow-y-auto leading-relaxed whitespace-pre-wrap">
          {markdownReport}
        </div>
      </div>

      {/* Python Source Code Inspection Hub */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Terminal className="w-4 h-4 text-slate-700" />
              <span>Python Project Files (Standalone Runnable Source)</span>
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Run locally via <code>streamlit run app.py</code> with zero Fairlearn or external API dependencies.
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {["app.py", "model_pipeline.py", "fairness_metrics.py", "requirements.txt", "README.md"].map((f) => (
              <button
                key={f}
                onClick={() => fetchCode(f)}
                className={`px-2.5 py-1 text-xs font-mono rounded-md transition-colors ${
                  activeCodeFile === f
                    ? "bg-slate-900 text-white font-bold"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto max-h-96">
          {loadingFile ? (
            <div className="p-6 text-center text-slate-400">Loading {activeCodeFile}...</div>
          ) : (
            <pre className="leading-relaxed">{fileContent}</pre>
          )}
        </div>
      </div>
    </div>
  );
};
