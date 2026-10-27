import React, { useState } from "react";
import { AuditData } from "../types";
import {
  TrendingUp,
  Award,
  Layers,
  Coins,
  DollarSign,
  AlertCircle
} from "lucide-react";

interface ModelPerformanceProps {
  audit: AuditData | null;
}

export const ModelPerformance: React.FC<ModelPerformanceProps> = ({ audit }) => {
  const [selectedConfusionModel, setSelectedConfusionModel] = useState<string>("Baseline");

  if (!audit) {
    return (
      <div className="bg-white p-12 rounded-xl border border-slate-200 text-center">
        <div className="inline-block animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full mb-3" />
        <p className="text-sm font-medium text-slate-600">Computing model training and evaluation metrics...</p>
      </div>
    );
  }

  const cm = audit.confusion_matrices[selectedConfusionModel] || [
    [0, 0],
    [0, 0]
  ];

  return (
    <div className="space-y-6">
      {/* Intro Context Banner */}
      <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-700 leading-relaxed">
        <strong className="text-slate-900 font-semibold">Strict Train/Test Isolation:</strong> All three models are evaluated on the exact same held-out test split (25% = {audit.test_set_size.toLocaleString()} applicants).
        Preprocessing standard scalers and categorical encoders were fit exclusively on training data to prevent information leakage.
      </div>

      {/* Model Performance Comparison Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Predictive Performance Metrics (Test Set)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Computed on 1,250 held-out evaluation records</p>
          </div>
          <span className="text-xs px-2.5 py-1 bg-teal-50 text-teal-700 border border-teal-200 rounded-md font-medium">
            Random State 42
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-3 px-4">Model Pipeline</th>
                <th className="py-3 px-3 text-right">Accuracy</th>
                <th className="py-3 px-3 text-right">Precision</th>
                <th className="py-3 px-3 text-right">Recall (TPR)</th>
                <th className="py-3 px-3 text-right">F1-Score</th>
                <th className="py-3 px-3 text-right">ROC-AUC</th>
                <th className="py-3 px-4 text-left">Mitigation Method</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-mono">
              {audit.comparison_table.map((row) => {
                const isBaseline = row.model === "Baseline";
                const isReweighted = row.model === "Reweighted";
                return (
                  <tr key={row.model} className="hover:bg-slate-50/75">
                    <td className="py-3 px-4 font-bold text-slate-900 font-sans">
                      {row.model}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900">
                      {(row.accuracy * 100).toFixed(1)}%
                    </td>
                    <td className="py-3 px-3 text-right text-slate-800">
                      {(row.precision * 100).toFixed(1)}%
                    </td>
                    <td className="py-3 px-3 text-right text-slate-800">
                      {(row.recall * 100).toFixed(1)}%
                    </td>
                    <td className="py-3 px-3 text-right text-slate-800">
                      {row.f1.toFixed(3)}
                    </td>
                    <td className="py-3 px-3 text-right text-teal-700 font-bold">
                      {row.roc_auc.toFixed(3)}
                    </td>
                    <td className="py-3 px-4 font-sans text-xs text-slate-500">
                      {isBaseline && "Unweighted maximum likelihood (T=0.50)"}
                      {isReweighted && "Sample weighting w(g,y) on joint distribution"}
                      {!isBaseline && !isReweighted && "Calibrated validation cutoff per group"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Visual Bar Comparison & Confusion Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Bar Chart */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
            Metric Comparison Across Approaches
          </h4>
          <div className="space-y-4 pt-2">
            {audit.comparison_table.map((m) => (
              <div key={m.model} className="space-y-1.5 p-3 rounded-lg bg-slate-50 border border-slate-100">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-800">
                  <span>{m.model}</span>
                  <span className="font-mono text-teal-700">Accuracy: {(m.accuracy * 100).toFixed(1)}% | F1: {m.f1.toFixed(3)}</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div className="bg-teal-600 h-full rounded-full" style={{ width: `${m.accuracy * 100}%` }} />
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                  <span>Precision: {(m.precision * 100).toFixed(1)}%</span>
                  <span>Recall: {(m.recall * 100).toFixed(1)}%</span>
                  <span>ROC-AUC: {m.roc_auc.toFixed(3)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Confusion Matrix Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Confusion Matrix: {selectedConfusionModel}
            </h4>
            <select
              value={selectedConfusionModel}
              onChange={(e) => setSelectedConfusionModel(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-xs rounded-lg px-2.5 py-1 text-slate-800 font-semibold"
            >
              <option value="Baseline">Baseline</option>
              <option value="Reweighted">Reweighted</option>
              <option value="Threshold-adjusted">Threshold-adjusted</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3 text-center font-mono">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] text-slate-500 font-sans block">True Negatives (TN)</span>
              <span className="text-xl font-bold text-slate-800">{cm[0][0].toLocaleString()}</span>
              <span className="text-[10px] text-slate-400 block mt-1">Actual Default &rarr; Pred Default</span>
            </div>
            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200">
              <span className="text-[11px] text-amber-700 font-sans block">False Positives (FP)</span>
              <span className="text-xl font-bold text-amber-900">{cm[0][1].toLocaleString()}</span>
              <span className="text-[10px] text-amber-700/80 block mt-1">Actual Default &rarr; Pred Success</span>
            </div>
            <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200">
              <span className="text-[11px] text-rose-700 font-sans block">False Negatives (FN)</span>
              <span className="text-xl font-bold text-rose-900">{cm[1][0].toLocaleString()}</span>
              <span className="text-[10px] text-rose-700/80 block mt-1">Actual Success &rarr; Pred Default</span>
            </div>
            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200">
              <span className="text-[11px] text-emerald-700 font-sans block">True Positives (TP)</span>
              <span className="text-xl font-bold text-emerald-900">{cm[1][1].toLocaleString()}</span>
              <span className="text-[10px] text-emerald-700/80 block mt-1">Actual Success &rarr; Pred Success</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-3 italic">
            Total test observations: {cm[0][0] + cm[0][1] + cm[1][0] + cm[1][1]} records.
          </p>
        </div>
      </div>

      {/* Illustrative Business Viability Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>Illustrative Business Viability Analysis</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Simplified economic simulation assuming $1,200 revenue per repaid loan, -$5,000 loss per default, and $250 servicing cost.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-600 font-semibold font-sans">
                <th className="py-3 px-4">Model Variant</th>
                <th className="py-3 px-3 text-right">Predicted Positive Count</th>
                <th className="py-3 px-3 text-right">Approval Rate</th>
                <th className="py-3 px-3 text-right">Observed Repayment Rate</th>
                <th className="py-3 px-4 text-right">Illustrative Net Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
              {audit.business_table.map((row) => (
                <tr key={row.model} className="hover:bg-slate-50/75">
                  <td className="py-3 px-4 font-bold text-slate-900 font-sans">{row.model}</td>
                  <td className="py-3 px-3 text-right">{row.predicted_positive_count.toLocaleString()}</td>
                  <td className="py-3 px-3 text-right">{(row.predicted_positive_rate * 100).toFixed(1)}%</td>
                  <td className="py-3 px-3 text-right text-teal-700 font-bold">
                    {(row.observed_success_rate_among_positive * 100).toFixed(1)}%
                  </td>
                  <td className={`py-3 px-4 text-right font-bold ${row.illustrative_net_value >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                    ${row.illustrative_net_value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-3.5 bg-slate-50 text-[11px] text-slate-500 border-t border-slate-100">
          *Important: Figures are purely illustrative estimates based on synthetic test outcomes; they do not represent real banking profits or interest yields.
        </div>
      </div>
    </div>
  );
};
