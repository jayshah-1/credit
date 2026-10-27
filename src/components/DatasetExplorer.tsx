import React, { useState } from "react";
import { DatasetStats } from "../types";
import {
  FileText,
  BarChart3,
  Layers,
  Table,
  Upload,
  AlertCircle,
  CheckCircle,
  HelpCircle
} from "lucide-react";

interface DatasetExplorerProps {
  stats: DatasetStats | null;
  onUploadCsv: (file: File) => void;
  uploadStatus: { success: boolean; message: string } | null;
}

export const DatasetExplorer: React.FC<DatasetExplorerProps> = ({
  stats,
  onUploadCsv,
  uploadStatus
}) => {
  const [activeTab, setActiveTab] = useState<"overview" | "categorical" | "numeric" | "correlations">("overview");
  const [selectedNumFeature, setSelectedNumFeature] = useState<string>("annual_income");

  if (!stats) {
    return (
      <div className="bg-white p-12 rounded-xl border border-slate-200 text-center">
        <div className="inline-block animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full mb-3" />
        <p className="text-sm font-medium text-slate-600">Loading dataset statistics and calculations...</p>
      </div>
    );
  }

  const numericCols = Object.keys(stats.summary_stats);

  return (
    <div className="space-y-6">
      {/* Upload Accordion / Modal */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Custom Dataset Upload</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Upload another compatible CSV file. Required columns will be validated strictly before ingestion.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <label className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg cursor-pointer transition-colors">
            <Upload className="w-3.5 h-3.5 text-slate-600" />
            <span>Choose CSV File</span>
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  onUploadCsv(e.target.files[0]);
                }
              }}
            />
          </label>
        </div>
      </div>

      {uploadStatus && (
        <div
          className={`p-3.5 rounded-lg text-xs font-medium flex items-center gap-2.5 ${
            uploadStatus.success
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          {uploadStatus.success ? (
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{uploadStatus.message}</span>
        </div>
      )}

      {/* Explorer Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab("overview")}
          className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === "overview"
              ? "border-teal-600 text-teal-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Dataset Overview & Summary
        </button>
        <button
          onClick={() => setActiveTab("categorical")}
          className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === "categorical"
              ? "border-teal-600 text-teal-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Categorical & Group Breakdown
        </button>
        <button
          onClick={() => setActiveTab("numeric")}
          className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === "numeric"
              ? "border-teal-600 text-teal-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Numeric Distributions
        </button>
        <button
          onClick={() => setActiveTab("correlations")}
          className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === "correlations"
              ? "border-teal-600 text-teal-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Correlations & Cramér's V
        </button>
      </div>

      {/* TAB 1: OVERVIEW & SUMMARY */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 font-medium">Row Count</span>
              <div className="text-xl font-bold text-slate-900 mt-1">{stats.total_records.toLocaleString()}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 font-medium">Column Count</span>
              <div className="text-xl font-bold text-slate-900 mt-1">{stats.total_columns}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 font-medium">Missing Value Total</span>
              <div className="text-xl font-bold text-emerald-600 mt-1">
                {Object.values(stats.missing_counts).reduce((a, b) => a + b, 0)}
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 font-medium">Duplicate Records</span>
              <div className="text-xl font-bold text-emerald-600 mt-1">{stats.duplicate_count}</div>
            </div>
          </div>

          {/* Data Sample Preview */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Dataset Preview (Top 10 Rows)
              </h4>
              <span className="text-xs text-slate-500 font-mono">5,000 Total Observations</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-600">
                    {stats.columns.map((c) => (
                      <th key={c} className="py-2.5 px-3 font-semibold whitespace-nowrap">
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {stats.sample_records.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50/75 font-mono">
                      {stats.columns.map((col) => (
                        <td key={col} className="py-2 px-3 whitespace-nowrap">
                          {typeof row[col] === "number" ? row[col].toLocaleString() : String(row[col])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Numeric Summary Statistics Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/50">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Numeric Feature Summary Statistics
              </h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="py-2.5 px-3">Feature</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3 text-right">Mean</th>
                    <th className="py-2.5 px-3 text-right">Std Dev</th>
                    <th className="py-2.5 px-3 text-right">Min</th>
                    <th className="py-2.5 px-3 text-right">25%</th>
                    <th className="py-2.5 px-3 text-right">Median</th>
                    <th className="py-2.5 px-3 text-right">75%</th>
                    <th className="py-2.5 px-3 text-right">Max</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-mono">
                  {Object.entries(stats.summary_stats).map(([feature, s]) => (
                    <tr key={feature} className="hover:bg-slate-50/75">
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{feature}</td>
                      <td className="py-2.5 px-3 text-slate-500 font-normal">{stats.dtypes[feature]}</td>
                      <td className="py-2.5 px-3 text-right">{s.mean.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right">{s.std.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right">{s.min.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right">{s["25%"].toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right">{s["50%"].toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right">{s["75%"].toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right">{s.max.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CATEGORICAL BREAKDOWN */}
      {activeTab === "categorical" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Target Breakdown */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4">
                Target Variable Distribution (repayment_success)
              </h4>
              <div className="space-y-3">
                {Object.entries(stats.target_distribution).map(([key, count]) => {
                  const pct = (count / stats.total_records) * 100;
                  const label = key === "1" ? "Success (1) — Loan Repaid" : "Default (0) — Defaulted";
                  const color = key === "1" ? "bg-teal-500" : "bg-rose-500";
                  return (
                    <div key={key}>
                      <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                        <span>{label}</span>
                        <span className="font-mono">{count.toLocaleString()} ({pct.toFixed(1)}%)</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-[11px] text-slate-500 mt-4 leading-relaxed">
                Notice the class imbalance: roughly ~14-15% of applicants successfully repaid, creating a strong negative prior.
              </p>
            </div>

            {/* Gender Representation & Target Rate */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4">
                Gender Representation & Realized Success Rate
              </h4>
              <div className="space-y-3">
                {Object.entries(stats.gender_distribution).map(([gender, count]) => {
                  const pct = (count / stats.total_records) * 100;
                  const rate = stats.target_by_gender[gender] || 0;
                  return (
                    <div key={gender} className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
                      <div className="flex justify-between items-center text-xs font-medium text-slate-800">
                        <span className="font-bold">{gender}</span>
                        <span className="font-mono">{count.toLocaleString()} records ({pct.toFixed(1)}%)</span>
                      </div>
                      <div className="mt-2 flex justify-between items-center text-xs text-slate-600">
                        <span>Observed Repayment Rate:</span>
                        <span className="font-mono font-bold text-teal-700">{(rate * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Socioeconomic Group */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4">
                Socioeconomic Group Representation
              </h4>
              <div className="space-y-3">
                {["Lower", "Middle", "Higher"].map((group) => {
                  const count = stats.socio_distribution[group] || 0;
                  const pct = (count / stats.total_records) * 100;
                  const rate = stats.target_by_socio[group] || 0;
                  return (
                    <div key={group} className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
                      <div className="flex justify-between items-center text-xs font-medium text-slate-800">
                        <span className="font-bold">{group}</span>
                        <span className="font-mono">{count.toLocaleString()} records ({pct.toFixed(1)}%)</span>
                      </div>
                      <div className="mt-1 flex justify-between items-center text-xs text-slate-600">
                        <span>Repayment Success Rate:</span>
                        <span className="font-mono font-bold text-indigo-700">{(rate * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Occupation Breakdown */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4">
                Occupation Distribution
              </h4>
              <div className="space-y-2.5">
                {Object.entries(stats.occupation_distribution).map(([occ, count]) => {
                  const pct = (count / stats.total_records) * 100;
                  return (
                    <div key={occ}>
                      <div className="flex justify-between text-xs text-slate-700 mb-1">
                        <span>{occ}</span>
                        <span className="font-mono">{count.toLocaleString()} ({pct.toFixed(1)}%)</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-slate-600" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: NUMERIC DISTRIBUTIONS */}
      {activeTab === "numeric" && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Select Feature to Inspect
              </h4>
              <select
                value={selectedNumFeature}
                onChange={(e) => setSelectedNumFeature(e.target.value)}
                className="bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-teal-500 font-mono"
              >
                {numericCols.map((col) => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
              </select>
            </div>

            {stats.summary_stats[selectedNumFeature] && (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 mb-6">
                <div className="p-2.5 bg-slate-50 rounded-lg text-center border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Min</span>
                  <div className="text-xs font-bold font-mono mt-0.5">{stats.summary_stats[selectedNumFeature].min.toLocaleString()}</div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg text-center border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">25%</span>
                  <div className="text-xs font-bold font-mono mt-0.5">{stats.summary_stats[selectedNumFeature]["25%"].toLocaleString()}</div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg text-center border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Median</span>
                  <div className="text-xs font-bold font-mono text-teal-700 mt-0.5">{stats.summary_stats[selectedNumFeature]["50%"].toLocaleString()}</div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg text-center border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">75%</span>
                  <div className="text-xs font-bold font-mono mt-0.5">{stats.summary_stats[selectedNumFeature]["75%"].toLocaleString()}</div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg text-center border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Max</span>
                  <div className="text-xs font-bold font-mono mt-0.5">{stats.summary_stats[selectedNumFeature].max.toLocaleString()}</div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg text-center border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Mean</span>
                  <div className="text-xs font-bold font-mono mt-0.5">{stats.summary_stats[selectedNumFeature].mean.toLocaleString()}</div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg text-center border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Std Dev</span>
                  <div className="text-xs font-bold font-mono mt-0.5">{stats.summary_stats[selectedNumFeature].std.toLocaleString()}</div>
                </div>
              </div>
            )}

            {/* Visual Box-plot representation */}
            <div className="p-5 bg-slate-50 rounded-xl border border-slate-200">
              <h5 className="text-xs font-semibold text-slate-700 mb-3">Interquartile Range (IQR) Range Visualizer</h5>
              <div className="relative pt-6 pb-2">
                <div className="w-full h-3 bg-slate-200 rounded-full relative">
                  <div
                    className="absolute h-full bg-teal-500/80 rounded-sm"
                    style={{ left: "25%", width: "50%" }}
                  />
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-teal-700 rounded-full border-2 border-white"
                    style={{ left: "50%" }}
                  />
                </div>
                <div className="flex justify-between text-[11px] font-mono text-slate-500 mt-2">
                  <span>Min ({stats.summary_stats[selectedNumFeature]?.min})</span>
                  <span>Q1</span>
                  <span className="font-bold text-teal-700">Median ({stats.summary_stats[selectedNumFeature]?.["50%"]})</span>
                  <span>Q3</span>
                  <span>Max ({stats.summary_stats[selectedNumFeature]?.max})</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CORRELATIONS & CRAMER'S V */}
      {activeTab === "correlations" && (
        <div className="space-y-6">
          {/* Numeric Correlation Grid */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Numeric Pearson Correlation Matrix
            </h4>
            <p className="text-xs text-slate-500 mb-4">
              Measures linear correlation between numerical applicant features.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-center text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="py-2.5 px-3 text-left">Feature</th>
                    {stats.correlation_matrix.columns.map((c) => (
                      <th key={c} className="py-2.5 px-2 text-[11px] whitespace-nowrap">
                        {c.replace(/_/g, " ")}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {stats.correlation_matrix.columns.map((rowName, rIdx) => (
                    <tr key={rowName}>
                      <td className="py-2 px-3 text-left font-semibold text-slate-800 whitespace-nowrap">
                        {rowName}
                      </td>
                      {stats.correlation_matrix.values[rIdx].map((val, cIdx) => {
                        const isSelf = rIdx === cIdx;
                        const isPositive = val > 0;
                        const intensity = Math.abs(val);
                        const bg = isSelf
                          ? "bg-slate-200 text-slate-800 font-bold"
                          : isPositive
                          ? `bg-blue-500/${Math.round(intensity * 40)} text-slate-800`
                          : `bg-rose-500/${Math.round(intensity * 40)} text-slate-800`;
                        return (
                          <td key={cIdx} className={`py-2 px-2 text-[11px] ${bg}`}>
                            {val.toFixed(2)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Categorical Cramer's V Grid */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Categorical Association Matrix (Cramér's V)
            </h4>
            <p className="text-xs text-slate-500 mb-4">
              Measures non-linear association between categorical variables (0 = Independent, 1 = Redundant).
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-center text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="py-2.5 px-3 text-left">Attribute</th>
                    {stats.cramers_v_matrix.columns.map((c) => (
                      <th key={c} className="py-2.5 px-3 text-[11px] whitespace-nowrap">
                        {c.replace(/_/g, " ")}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {stats.cramers_v_matrix.columns.map((rowName, rIdx) => (
                    <tr key={rowName}>
                      <td className="py-2.5 px-3 text-left font-semibold text-slate-800 whitespace-nowrap">
                        {rowName}
                      </td>
                      {stats.cramers_v_matrix.values[rIdx].map((val, cIdx) => {
                        const isSelf = rIdx === cIdx;
                        const bg = isSelf
                          ? "bg-slate-200 font-bold"
                          : `bg-teal-500/${Math.round(val * 50)} text-teal-950 font-medium`;
                        return (
                          <td key={cIdx} className={`py-2 px-3 text-xs ${bg}`}>
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
        </div>
      )}
    </div>
  );
};
