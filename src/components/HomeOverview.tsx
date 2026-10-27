import React from "react";
import { DatasetStats, AuditData } from "../types";
import {
  Database,
  Layers,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Cpu,
  Coins
} from "lucide-react";

interface HomeOverviewProps {
  stats: DatasetStats | null;
  audit: AuditData | null;
  onNavigate: (tab: string) => void;
  sensitiveCol: string;
}

export const HomeOverview: React.FC<HomeOverviewProps> = ({
  stats,
  audit,
  onNavigate,
  sensitiveCol
}) => {
  const baselineRow = audit?.comparison_table.find((m) => m.model === "Baseline");
  const reweightedRow = audit?.comparison_table.find((m) => m.model === "Reweighted");
  const thresholdRow = audit?.comparison_table.find((m) => m.model === "Threshold-adjusted");

  const diRatio = baselineRow ? baselineRow.disparate_impact_ratio : 0;
  const isPassDI = diRatio >= 0.8;

  return (
    <div className="space-y-6">
      {/* Research Disclaimer Banner */}
      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3.5">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-semibold text-amber-900">
            Synthetic Dataset — Academic Research Prototype
          </h4>
          <p className="text-xs text-amber-800/90 mt-0.5 leading-relaxed">
            This system evaluates machine learning fairness metrics on a 5,000-record synthetic digital micro-lending dataset.
            The prediction target is <code className="bg-amber-100 text-amber-900 px-1 py-0.5 rounded font-mono">repayment_success</code>.
            It does not reflect actual customer credit data or real banking approval policies.
          </p>
        </div>
      </div>

      {/* Main KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Records</span>
            <Database className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {stats ? stats.total_records.toLocaleString() : "..."}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Synthetic applicants</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Input Features</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {stats ? stats.columns.length - 3 : 9}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Omit ID, target & protected</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Target Label</span>
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
          </div>
          <div className="mt-2 text-sm font-bold text-slate-900 font-mono truncate">
            repayment_success
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Binary (1=Success, 0=Default)</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Trained Models</span>
            <Cpu className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">3</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Base, Reweighted, Threshold</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Baseline Accuracy</span>
            <TrendingUp className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {baselineRow ? `${(baselineRow.accuracy * 100).toFixed(1)}%` : "..."}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Held-out test set</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Disparate Impact</span>
            <ShieldCheck className="w-4 h-4 text-slate-400" />
          </div>
          <div className={`mt-2 text-2xl font-bold ${isPassDI ? "text-emerald-600" : "text-rose-600"}`}>
            {baselineRow ? baselineRow.disparate_impact_ratio.toFixed(2) : "..."}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {isPassDI ? "≥ 0.80 illustrative threshold" : "< 0.80 disparity detected"}
          </p>
        </div>
      </div>

      {/* Overview Context & Narrative */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900">
            Project Objective & Algorithmic Scope
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            In credit underwriting and financial micro-lending, models trained to maximize pure predictive accuracy often inherit demographic disparities present in historical data.
            When credit attributes (such as annual income or debt ratio) correlate with demographic segments or geographical regions, the predictive model can exhibit substantial selection rate and error rate gaps.
          </p>
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
            <div className="font-semibold text-slate-800">Key Investigation Highlights:</div>
            <ul className="list-disc pl-4 space-y-1">
              <li>
                <strong>Sensitive Feature Neutrality:</strong> Sensitive attributes (<code>{sensitiveCol}</code>) are omitted from model training inputs to enforce direct procedural blindness.
              </li>
              <li>
                <strong>Pre-Processing Mitigation:</strong> Sample reweighing balances the joint distribution of protected groups and target outcomes before fitting.
              </li>
              <li>
                <strong>Post-Processing Mitigation:</strong> Group-calibrated thresholds are learned on a dedicated validation split to equalize True Positive and False Positive Rates.
              </li>
              <li>
                <strong>Business Trade-off Analysis:</strong> Models are compared against an illustrative financial net value scenario to highlight real-world underwriting trade-offs.
              </li>
            </ul>
          </div>

          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate("models")}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <span>Explore Model Comparison</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onNavigate("predict")}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors"
            >
              <span>Interactive Prediction Form</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Audit Status Snapshot */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Current Audit Summary</h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono">
                {sensitiveCol}
              </span>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Baseline Equalized Odds Gap</span>
                <span className="font-mono font-bold text-slate-800">
                  {baselineRow ? baselineRow.equalized_odds_gap_max.toFixed(3) : "..."}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Threshold-Adjusted Gap</span>
                <span className="font-mono font-bold text-teal-600">
                  {thresholdRow ? thresholdRow.equalized_odds_gap_max.toFixed(3) : "..."}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Baseline Disparate Impact</span>
                <span className={`font-mono font-bold ${isPassDI ? "text-emerald-600" : "text-rose-600"}`}>
                  {baselineRow ? baselineRow.disparate_impact_ratio.toFixed(3) : "..."}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Reweighted Disparate Impact</span>
                <span className="font-mono font-bold text-slate-800">
                  {reweightedRow ? reweightedRow.disparate_impact_ratio.toFixed(3) : "..."}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <div className="text-[11px] text-slate-500 leading-relaxed">
              *Fairness metrics are computed from 1,250 held-out test records using pure local NumPy/pandas logic without external package dependencies.
            </div>
          </div>
        </div>
      </div>

      {/* Module Navigation Grid */}
      <div>
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">
          Explore Application Modules
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            onClick={() => onNavigate("dataset")}
            className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-teal-500/50 hover:shadow-md cursor-pointer transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Database className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 group-hover:text-teal-600 transition-colors">
              Dataset Explorer
            </h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Inspect distributions, null values, categorical frequencies, and correlation heatmaps across the 5,000 synthetic records.
            </p>
          </div>

          <div
            onClick={() => onNavigate("audit")}
            className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-teal-500/50 hover:shadow-md cursor-pointer transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 group-hover:text-teal-600 transition-colors">
              Algorithmic Bias Audit
            </h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Analyze group-disaggregated metrics including True Positive Rates, False Positive Rates, Selection Rates, and Equalized Odds gaps.
            </p>
          </div>

          <div
            onClick={() => onNavigate("mitigation")}
            className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-teal-500/50 hover:shadow-md cursor-pointer transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Coins className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 group-hover:text-teal-600 transition-colors">
              Mitigation & Viability
            </h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Compare sample reweighing and validation-calibrated thresholds alongside illustrative lending profitability simulations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
