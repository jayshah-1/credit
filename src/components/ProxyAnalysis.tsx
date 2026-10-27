import React from "react";
import { DatasetStats } from "../types";
import {
  Network,
  AlertTriangle,
  Info,
  Layers,
  ArrowRight
} from "lucide-react";

interface ProxyAnalysisProps {
  stats: DatasetStats | null;
  sensitiveCol: string;
}

export const ProxyAnalysis: React.FC<ProxyAnalysisProps> = ({ stats, sensitiveCol }) => {
  if (!stats) {
    return (
      <div className="bg-white p-12 rounded-xl border border-slate-200 text-center">
        <div className="inline-block animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full mb-3" />
        <p className="text-sm font-medium text-slate-600">Calculating proxy associations and Cramér's V coefficients...</p>
      </div>
    );
  }

  const { columns, values } = stats.cramers_v_matrix;
  const sensIdx = columns.indexOf(sensitiveCol);

  // Extract associations specifically for the sensitive feature
  const sensitiveAssociations = columns
    .map((col, idx) => ({
      feature: col,
      score: sensIdx >= 0 ? values[sensIdx][idx] : 0
    }))
    .filter((item) => item.feature !== sensitiveCol)
    .sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-6">
      {/* Critical Responsible AI Advisory Banner */}
      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 leading-relaxed">
          <strong className="font-bold">Correlation Does Not Prove Discrimination or Causation:</strong> Statistical association between non-sensitive features (e.g., postal code, occupation) and demographic attributes is common in observational data due to broader sociological patterns.
          A non-zero association coefficient does <strong>not</strong> prove unlawful discrimination, bias intent, or direct causal harm. It functions as an auditing diagnostic to help modelers identify potential indirect information pathways.
        </div>
      </div>

      {/* Primary Association Cards with Sensitive Feature */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-200">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Categorical Proxy Strength with Protected Class: {sensitiveCol.toUpperCase()}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Computed via bias-corrected Cramér's V formula</p>
          </div>
          <span className="text-xs px-2.5 py-1 bg-teal-50 text-teal-700 font-semibold border border-teal-200 rounded-md">
            Cramér's V Scale: 0.0 &rarr; 1.0
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {sensitiveAssociations.map((item) => {
            const isModerateOrHigh = item.score >= 0.20;
            return (
              <div key={item.feature} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-800 font-mono">{item.feature}</span>
                  <span className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                    isModerateOrHigh ? "bg-amber-100 text-amber-800" : "bg-slate-200 text-slate-700"
                  }`}>
                    V = {item.score.toFixed(3)}
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${isModerateOrHigh ? "bg-amber-500" : "bg-teal-600"}`}
                    style={{ width: `${Math.min(100, item.score * 100 * 2)}%` }}
                  />
                </div>
                <span className="text-[11px] text-slate-500 block">
                  {item.score < 0.10 && "Negligible proxy signal"}
                  {item.score >= 0.10 && item.score < 0.25 && "Low to moderate association"}
                  {item.score >= 0.25 && "Notable potential proxy redundancy"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Full 4x4 Cramér's V Matrix */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/50">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Full Categorical Association Matrix
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Cross-correlation among all nominal applicant variables</p>
        </div>

        <div className="overflow-x-auto p-5">
          <table className="w-full text-center text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-2.5 px-3 text-left">Variable</th>
                {columns.map((c) => (
                  <th key={c} className="py-2.5 px-3 whitespace-nowrap font-mono text-[11px]">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {columns.map((rowName, rIdx) => (
                <tr key={rowName}>
                  <td className="py-2.5 px-3 text-left font-semibold text-slate-800 whitespace-nowrap">
                    {rowName}
                  </td>
                  {values[rIdx].map((val, cIdx) => {
                    const isSelf = rIdx === cIdx;
                    const isStrong = val >= 0.25;
                    const bg = isSelf
                      ? "bg-slate-200 font-bold"
                      : isStrong
                      ? "bg-teal-500/30 text-teal-900 font-bold"
                      : `bg-teal-500/${Math.round(val * 40)} text-slate-800`;
                    return (
                      <td key={cIdx} className={`py-2.5 px-3 text-xs ${bg}`}>
                        {val.toFixed(3)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Explanatory Context */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
          <Info className="w-4 h-4 text-teal-600" />
          <span>Understanding Proxy Variables in Micro-Lending Risk</span>
        </h4>
        <div className="text-xs text-slate-600 leading-relaxed space-y-2">
          <p>
            When financial institutions exclude protected demographic features (e.g., gender, race) to comply with anti-discrimination laws, non-protected variables can still act as partial mathematical stand-ins (proxies).
          </p>
          <p>
            For example, geographical residential clustering (represented here by <code>postal_code</code>) or employment sectors (<code>occupation</code>) may correlate with demographic makeup.
            If a machine learning model places high positive weights on postal codes that are predominantly associated with one group, disparate selection rates can arise even without direct access to the sensitive column.
          </p>
          <p className="text-slate-500 italic">
            Auditing proxy association provides researchers and risk officers with concrete visibility into indirect demographic reliance.
          </p>
        </div>
      </div>
    </div>
  );
};
