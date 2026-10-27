import React from "react";
import { AuditData } from "../types";
import {
  ShieldAlert,
  Scale,
  Info,
  HelpCircle,
  AlertTriangle,
  CheckCircle2
} from "lucide-react";

interface BiasAuditProps {
  audit: AuditData | null;
  sensitiveCol: string;
}

export const BiasAudit: React.FC<BiasAuditProps> = ({ audit, sensitiveCol }) => {
  if (!audit) {
    return (
      <div className="bg-white p-12 rounded-xl border border-slate-200 text-center">
        <div className="inline-block animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full mb-3" />
        <p className="text-sm font-medium text-slate-600">Computing disaggregated group fairness audit...</p>
      </div>
    );
  }

  const baseSummary = audit.comparison_table.find((m) => m.model === "Baseline");
  const baseGroups = audit.group_tables.Baseline || [];

  const diRatio = baseSummary?.disparate_impact_ratio ?? 0;
  const eqOddsGap = baseSummary?.equalized_odds_gap_max ?? 0;
  const srGap = baseSummary?.selection_rate_gap ?? 0;

  return (
    <div className="space-y-6">
      {/* Metric Concept Definitions Grid */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Info className="w-4 h-4 text-teal-600" />
          <span>Fairness Metric Definitions & Interpretation Standards</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600 leading-relaxed">
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
            <h5 className="font-bold text-slate-900 mb-1">1. Demographic Parity (Selection Rate)</h5>
            <p>
              Measures the proportion of candidates in a demographic group assigned a positive classification: P(Y_hat = 1 | Group = g).
              The <strong>Selection Rate Gap</strong> and <strong>Disparate Impact Ratio</strong> (min SR / max SR) assess whether one group receives significantly fewer favorable decisions.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
            <h5 className="font-bold text-slate-900 mb-1">2. Equal Opportunity (TPR / Recall)</h5>
            <p>
              Requires equal True Positive Rates across protected classes: P(Y_hat = 1 | Y = 1, Group = g).
              Guarantees that qualified applicants who will successfully repay have an equal probability of being correctly identified regardless of group membership.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
            <h5 className="font-bold text-slate-900 mb-1">3. Equalized Odds (TPR & FPR)</h5>
            <p>
              Enforces simultaneous parity in True Positive Rate (TPR) and False Positive Rate (FPR).
              The <strong>Equalized Odds Gap</strong> is defined as max(|TPR Gap|, |FPR Gap|). A lower gap indicates more uniform error distributions.
            </p>
          </div>
        </div>
      </div>

      {/* Disparate Impact & Gap KPI Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Disparate Impact Ratio</span>
          <div className={`text-2xl font-bold font-mono mt-1 ${diRatio >= 0.8 ? "text-emerald-600" : "text-rose-600"}`}>
            {diRatio.toFixed(3)}
          </div>
          <span className="text-[11px] text-slate-500">
            {diRatio >= 0.8 ? "Within 80% threshold" : "Disparity flag (< 0.80)"}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Selection Rate Gap</span>
          <div className="text-2xl font-bold font-mono mt-1 text-slate-800">
            {srGap.toFixed(3)}
          </div>
          <span className="text-[11px] text-slate-500">Max difference between groups</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">True Positive Rate Gap</span>
          <div className="text-2xl font-bold font-mono mt-1 text-slate-800">
            {baseSummary?.TPR_gap.toFixed(3) ?? "0.000"}
          </div>
          <span className="text-[11px] text-slate-500">Difference in recall</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Equalized Odds Max Gap</span>
          <div className="text-2xl font-bold font-mono mt-1 text-slate-800">
            {eqOddsGap.toFixed(3)}
          </div>
          <span className="text-[11px] text-slate-500">Max(TPR Gap, FPR Gap)</span>
        </div>
      </div>

      {/* Group Disaggregated Metrics Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Disaggregated Metrics for Baseline Model by {sensitiveCol.toUpperCase()}
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">Evaluated on test set records</p>
          </div>
          <span className="text-xs text-slate-500 font-mono">Held-Out Test Set (N=1,250)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-600 font-semibold font-sans">
                <th className="py-3 px-4">Demographic Group</th>
                <th className="py-3 px-3 text-right">Selection Rate</th>
                <th className="py-3 px-3 text-right">TPR (Recall)</th>
                <th className="py-3 px-3 text-right">FPR</th>
                <th className="py-3 px-3 text-right">Accuracy</th>
                <th className="py-3 px-3 text-right">Precision</th>
                <th className="py-3 px-3 text-right">F1-Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
              {baseGroups.map((row) => (
                <tr key={row.group} className="hover:bg-slate-50/75">
                  <td className="py-3 px-4 font-bold text-slate-900 font-sans">{row.group}</td>
                  <td className="py-3 px-3 text-right font-bold text-teal-700">
                    {(row.selection_rate * 100).toFixed(1)}%
                  </td>
                  <td className="py-3 px-3 text-right">{(row.TPR * 100).toFixed(1)}%</td>
                  <td className="py-3 px-3 text-right">{(row.FPR * 100).toFixed(1)}%</td>
                  <td className="py-3 px-3 text-right">{(row.accuracy * 100).toFixed(1)}%</td>
                  <td className="py-3 px-3 text-right">{(row.precision * 100).toFixed(1)}%</td>
                  <td className="py-3 px-3 text-right">{row.f1.toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Group Visual Bar Comparisons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">
            Selection Rate Disparity (Baseline)
          </h4>
          <div className="space-y-4">
            {baseGroups.map((g) => (
              <div key={g.group} className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-slate-800">
                  <span>Group: {g.group}</span>
                  <span className="font-mono text-teal-700">{(g.selection_rate * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                  <div
                    className="bg-teal-600 h-full rounded-full"
                    style={{ width: `${Math.min(100, g.selection_rate * 100 * 2.5)}%` }} // Scaled visually for clarity
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-slate-500 mt-4 leading-relaxed">
            Note: Selection rate indicates the percentage of group applicants assigned a positive classification (predicted repayment success).
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">
            True Positive vs False Positive Rates
          </h4>
          <div className="space-y-4">
            {baseGroups.map((g) => (
              <div key={g.group} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-xs font-bold text-slate-800 block mb-2">{g.group}</span>
                <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                  <div>
                    <span className="text-slate-500 font-sans block text-[10px]">TPR (Recall)</span>
                    <span className="font-bold text-emerald-700 text-sm">{(g.TPR * 100).toFixed(1)}%</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-sans block text-[10px]">FPR (Fall-out)</span>
                    <span className="font-bold text-rose-700 text-sm">{(g.FPR * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
