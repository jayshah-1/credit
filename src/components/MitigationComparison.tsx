import React from "react";
import { AuditData } from "../types";
import {
  GitCompare,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Scale,
  CheckCircle2,
  Info
} from "lucide-react";

interface MitigationComparisonProps {
  audit: AuditData | null;
  sensitiveCol: string;
}

export const MitigationComparison: React.FC<MitigationComparisonProps> = ({
  audit,
  sensitiveCol
}) => {
  if (!audit) {
    return (
      <div className="bg-white p-12 rounded-xl border border-slate-200 text-center">
        <div className="inline-block animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full mb-3" />
        <p className="text-sm font-medium text-slate-600">Loading mitigation comparison tables and analytics...</p>
      </div>
    );
  }

  const baseline = audit.comparison_table.find((m) => m.model === "Baseline")!;
  const reweighted = audit.comparison_table.find((m) => m.model === "Reweighted")!;
  const threshold = audit.comparison_table.find((m) => m.model === "Threshold-adjusted")!;

  const baseEqGap = baseline.equalized_odds_gap_max;
  const calEqGap = threshold.equalized_odds_gap_max;
  const eqImprovement = ((baseEqGap - calEqGap) / (baseEqGap || 1)) * 100;

  const baseDI = baseline.disparate_impact_ratio;
  const rewDI = reweighted.disparate_impact_ratio;

  return (
    <div className="space-y-6">
      {/* Legal & Policy Advisory */}
      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 leading-relaxed">
          <strong>Fair Lending & Policy Notice:</strong> While group-specific decision threshold adjustment successfully minimizes Equalized Odds disparities in this coursework demonstration, using explicitly different decision thresholds based on demographic characteristics can raise severe legal, regulatory (e.g., US Equal Credit Opportunity Act), and ethical concerns in real lending environments. Pre-processing reweighing or feature debiasing is generally preferred in commercial practice.
        </div>
      </div>

      {/* Before vs After Mitigation Summary Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Comprehensive Mitigation Comparison Table
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Evaluating performance vs fairness trade-offs</p>
          </div>
          <span className="text-xs px-2.5 py-1 bg-slate-100 text-slate-700 font-mono rounded">
            Audited on: {sensitiveCol}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse font-mono">
            <thead>
              <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-600 font-semibold font-sans">
                <th className="py-3 px-4">Evaluation Metric</th>
                <th className="py-3 px-3 text-right">1. Baseline</th>
                <th className="py-3 px-3 text-right">2. Reweighted</th>
                <th className="py-3 px-3 text-right">3. Threshold-Adjusted</th>
                <th className="py-3 px-4 text-left font-sans">Observed Change / Direction</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr className="hover:bg-slate-50/75">
                <td className="py-2.5 px-4 font-sans font-semibold text-slate-900">Accuracy</td>
                <td className="py-2.5 px-3 text-right">{(baseline.accuracy * 100).toFixed(1)}%</td>
                <td className="py-2.5 px-3 text-right">{(reweighted.accuracy * 100).toFixed(1)}%</td>
                <td className="py-2.5 px-3 text-right">{(threshold.accuracy * 100).toFixed(1)}%</td>
                <td className="py-2.5 px-4 font-sans text-xs text-slate-500">
                  {threshold.accuracy < baseline.accuracy
                    ? `Small accuracy drop (-${((baseline.accuracy - threshold.accuracy) * 100).toFixed(1)}%) in exchange for error parity`
                    : "Maintained baseline accuracy"}
                </td>
              </tr>

              <tr className="hover:bg-slate-50/75">
                <td className="py-2.5 px-4 font-sans font-semibold text-slate-900">Precision</td>
                <td className="py-2.5 px-3 text-right">{(baseline.precision * 100).toFixed(1)}%</td>
                <td className="py-2.5 px-3 text-right">{(reweighted.precision * 100).toFixed(1)}%</td>
                <td className="py-2.5 px-3 text-right">{(threshold.precision * 100).toFixed(1)}%</td>
                <td className="py-2.5 px-4 font-sans text-xs text-slate-500">
                  Reweighted slightly enhances precision; threshold tuning broadens positive volume.
                </td>
              </tr>

              <tr className="hover:bg-slate-50/75">
                <td className="py-2.5 px-4 font-sans font-semibold text-slate-900">Recall (TPR)</td>
                <td className="py-2.5 px-3 text-right">{(baseline.recall * 100).toFixed(1)}%</td>
                <td className="py-2.5 px-3 text-right">{(reweighted.recall * 100).toFixed(1)}%</td>
                <td className="py-2.5 px-3 text-right font-bold text-teal-700">
                  {(threshold.recall * 100).toFixed(1)}%
                </td>
                <td className="py-2.5 px-4 font-sans text-xs text-slate-500">
                  Threshold adjustment markedly increases recall among credit-eligible applicants.
                </td>
              </tr>

              <tr className="hover:bg-slate-50/75">
                <td className="py-2.5 px-4 font-sans font-semibold text-slate-900">Disparate Impact Ratio</td>
                <td className="py-2.5 px-3 text-right text-rose-600 font-bold">{baseline.disparate_impact_ratio.toFixed(3)}</td>
                <td className="py-2.5 px-3 text-right">{reweighted.disparate_impact_ratio.toFixed(3)}</td>
                <td className="py-2.5 px-3 text-right font-bold text-emerald-600">{threshold.disparate_impact_ratio.toFixed(3)}</td>
                <td className="py-2.5 px-4 font-sans text-xs text-slate-500">
                  {threshold.disparate_impact_ratio > baseline.disparate_impact_ratio
                    ? "Substantially moves closer to demographic parity"
                    : "Little impact"}
                </td>
              </tr>

              <tr className="hover:bg-slate-50/75">
                <td className="py-2.5 px-4 font-sans font-semibold text-slate-900">TPR Gap (Equal Opportunity)</td>
                <td className="py-2.5 px-3 text-right">{baseline.TPR_gap.toFixed(3)}</td>
                <td className="py-2.5 px-3 text-right">{reweighted.TPR_gap.toFixed(3)}</td>
                <td className="py-2.5 px-3 text-right font-bold text-teal-700">{threshold.TPR_gap.toFixed(3)}</td>
                <td className="py-2.5 px-4 font-sans text-xs text-slate-500">
                  Narrowed TPR disparity across groups.
                </td>
              </tr>

              <tr className="hover:bg-slate-50/75">
                <td className="py-2.5 px-4 font-sans font-semibold text-slate-900">Equalized Odds Max Gap</td>
                <td className="py-2.5 px-3 text-right">{baseline.equalized_odds_gap_max.toFixed(3)}</td>
                <td className="py-2.5 px-3 text-right">{reweighted.equalized_odds_gap_max.toFixed(3)}</td>
                <td className="py-2.5 px-3 text-right font-bold text-teal-700">{threshold.equalized_odds_gap_max.toFixed(3)}</td>
                <td className="py-2.5 px-4 font-sans text-xs font-semibold text-emerald-700">
                  {eqImprovement > 0 ? `Reduced gap by ${eqImprovement.toFixed(1)}%` : "Unchanged"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Visual Metric Evolution Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
            Equalized Odds Max Gap Progression (Lower is Fairer)
          </h4>
          <div className="space-y-3.5 pt-1">
            <div>
              <div className="flex justify-between text-xs text-slate-700 font-semibold mb-1">
                <span>Baseline Model</span>
                <span className="font-mono">{baseEqGap.toFixed(3)}</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-rose-500 h-full rounded-full" style={{ width: `${Math.min(100, baseEqGap * 400)}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-700 font-semibold mb-1">
                <span>Reweighted Model</span>
                <span className="font-mono">{reweighted.equalized_odds_gap_max.toFixed(3)}</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: `${Math.min(100, reweighted.equalized_odds_gap_max * 400)}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-700 font-semibold mb-1">
                <span>Threshold-Adjusted Model</span>
                <span className="font-mono text-emerald-700 font-bold">{calEqGap.toFixed(3)}</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.min(100, calEqGap * 400)}%` }} />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
            Learned Validation Thresholds
          </h4>
          <p className="text-xs text-slate-500 mb-3">
            Grid search parameters selected on training validation split [0.20 - 0.80]:
          </p>
          <div className="space-y-2">
            {Object.entries(audit.validation_thresholds).map(([grp, val]) => (
              <div key={grp} className="flex justify-between items-center p-3 rounded-lg bg-slate-50 border border-slate-200 font-mono text-xs">
                <span className="font-sans font-bold text-slate-800">{grp}</span>
                <span className="bg-teal-100 text-teal-800 px-2 py-0.5 rounded font-bold">{val.toFixed(2)}</span>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-slate-500 mt-3 leading-relaxed">
            The optimization minimized the maximum difference in TPR and FPR while applying a slight penalty for diverging from standard 0.50.
          </p>
        </div>
      </div>

      {/* Automatically Generated Evaluation Synthesis */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
          Automated Synthesis & Responsible AI Analysis
        </h4>
        <div className="text-xs text-slate-600 leading-relaxed space-y-2">
          <p>
            <strong>1. No Universal Panacea:</strong> Improving the Equalized Odds gap from {baseEqGap.toFixed(3)} to {calEqGap.toFixed(3)} demonstrates that post-processing can calibrate group error rates.
            However, notice that altering cutoffs alters precision ({((baseline.precision - threshold.precision) * 100).toFixed(1)}% difference) and increases approved positive volume.
          </p>
          <p>
            <strong>2. Metric Incompatibility:</strong> In machine learning fairness theory (Chouldechova, Kleinberg et al.), when base repayment rates differ between groups, perfect demographic parity, equalized odds, and calibration cannot simultaneously be achieved.
          </p>
          <p>
            <strong>3. Pre-Processing vs Post-Processing:</strong> Reweighing alters the cost landscape during gradient descent without needing to know applicant group identity at test time.
            Threshold tuning is effective in simulations but requires explicit demographic tagging during scoring.
          </p>
        </div>
      </div>
    </div>
  );
};
