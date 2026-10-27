/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { HomeOverview } from "./components/HomeOverview";
import { DatasetExplorer } from "./components/DatasetExplorer";
import { ApplicantPrediction } from "./components/ApplicantPrediction";
import { ModelPerformance } from "./components/ModelPerformance";
import { BiasAudit } from "./components/BiasAudit";
import { MitigationComparison } from "./components/MitigationComparison";
import { ProxyAnalysis } from "./components/ProxyAnalysis";
import { ReportsView } from "./components/ReportsView";
import { DatasetStats, AuditData, PredictionResult } from "./types";
import { X, Terminal, Copy, Check } from "lucide-react";

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>("overview");
  const [sensitiveCol, setSensitiveCol] = useState<string>("gender");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [stats, setStats] = useState<DatasetStats | null>(null);
  const [audit, setAudit] = useState<AuditData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<{ success: boolean; message: string } | null>(null);

  // Python Project Code modal
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [modalFile, setModalFile] = useState("app.py");
  const [modalContent, setModalContent] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);

  // Fetch dataset stats once on mount
  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch("/api/dataset-stats");
        if (!res.ok) throw new Error("Failed to fetch dataset stats");
        const data = await res.json();
        setStats(data);
      } catch (err: any) {
        console.error("Dataset stats fetch error:", err);
        setError(err.message);
      }
    }
    loadStats();
  }, []);

  // Fetch audit data whenever sensitive attribute changes
  useEffect(() => {
    async function loadAudit() {
      setLoading(true);
      try {
        const res = await fetch(`/api/models-audit?sensitive=${sensitiveCol}`);
        if (!res.ok) throw new Error("Failed to fetch model audit data");
        const data = await res.json();
        setAudit(data);
      } catch (err: any) {
        console.error("Audit fetch error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadAudit();
  }, [sensitiveCol]);

  // Handle single applicant prediction
  const handlePredict = async (applicant: Record<string, any>, modelType: string): Promise<PredictionResult> => {
    const res = await fetch("/api/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        applicant,
        modelType,
        sensitive: sensitiveCol
      })
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || "Prediction request failed.");
    }
    return await res.json();
  };

  // Handle CSV upload
  const handleUploadCsv = async (file: File) => {
    setUploadStatus(null);
    try {
      const text = await file.text();
      const lines = text.trim().split("\n");
      if (lines.length < 2) {
        setUploadStatus({ success: false, message: "CSV file is empty or missing data rows." });
        return;
      }
      const headers = lines[0].split(",").map((h) => h.trim());
      const required = ["gender", "repayment_success", "credit_score", "annual_income"];
      const missing = required.filter((r) => !headers.includes(r));
      if (missing.length > 0) {
        setUploadStatus({
          success: false,
          message: `Incompatible schema. Missing required columns: ${missing.join(", ")}`
        });
        return;
      }
      setUploadStatus({
        success: true,
        message: `Validated ${file.name} successfully (${lines.length - 1} records detected).`
      });
    } catch (e: any) {
      setUploadStatus({ success: false, message: e.message || "Failed to parse CSV." });
    }
  };

  // Load modal code file
  const openCodeModal = async (file = "app.py") => {
    setModalFile(file);
    setShowCodeModal(true);
    try {
      const res = await fetch(`/api/file-content?file=${file}`);
      if (res.ok) {
        const text = await res.text();
        setModalContent(text);
      } else {
        setModalContent("# Unable to load file content.");
      }
    } catch {
      setModalContent("# Network error loading file.");
    }
  };

  const getPageInfo = () => {
    switch (currentTab) {
      case "overview":
        return {
          title: "FairCredit Research Platform",
          subtitle: "Algorithmic Bias Auditing and Mitigation in Digital Micro-Lending"
        };
      case "dataset":
        return {
          title: "Dataset Explorer",
          subtitle: "Statistical distributions, missing values, and proxy representations in synthetic data"
        };
      case "predict":
        return {
          title: "Applicant Repayment Prediction",
          subtitle: "Real model inference across Baseline, Reweighted, and Calibrated threshold models"
        };
      case "models":
        return {
          title: "Model Performance & Viability",
          subtitle: "Accuracy, ROC-AUC, and financial simulations evaluated on held-out test split"
        };
      case "audit":
        return {
          title: "Algorithmic Bias Audit",
          subtitle: "Disaggregated selection rates, Equal Opportunity, and demographic parity gaps"
        };
      case "mitigation":
        return {
          title: "Mitigation Strategy Comparison",
          subtitle: "Pre-processing reweighing vs post-processing validation threshold adjustments"
        };
      case "proxy":
        return {
          title: "Proxy & Association Analysis",
          subtitle: "Cramér's V categorical association and proxy redundancy diagnostics"
        };
      case "reports":
        return {
          title: "Reports & Data Downloads",
          subtitle: "Export test predictions CSV, model comparison metrics, and audit report"
        };
      default:
        return { title: "FairCredit", subtitle: "" };
    }
  };

  const { title, subtitle } = getPageInfo();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans text-slate-900">
      {/* Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        sensitiveCol={sensitiveCol}
        onChangeSensitiveCol={setSensitiveCol}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          title={title}
          subtitle={subtitle}
          onOpenPythonModal={() => openCodeModal("app.py")}
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                <strong>Error:</strong> {error}
              </div>
            )}

            {currentTab === "overview" && (
              <HomeOverview
                stats={stats}
                audit={audit}
                onNavigate={setCurrentTab}
                sensitiveCol={sensitiveCol}
              />
            )}

            {currentTab === "dataset" && (
              <DatasetExplorer
                stats={stats}
                onUploadCsv={handleUploadCsv}
                uploadStatus={uploadStatus}
              />
            )}

            {currentTab === "predict" && (
              <ApplicantPrediction
                onPredict={handlePredict}
                sensitiveCol={sensitiveCol}
              />
            )}

            {currentTab === "models" && (
              <ModelPerformance audit={audit} />
            )}

            {currentTab === "audit" && (
              <BiasAudit audit={audit} sensitiveCol={sensitiveCol} />
            )}

            {currentTab === "mitigation" && (
              <MitigationComparison audit={audit} sensitiveCol={sensitiveCol} />
            )}

            {currentTab === "proxy" && (
              <ProxyAnalysis stats={stats} sensitiveCol={sensitiveCol} />
            )}

            {currentTab === "reports" && (
              <ReportsView audit={audit} sensitiveCol={sensitiveCol} />
            )}
          </div>
        </main>
      </div>

      {/* Python Source Code Modal */}
      {showCodeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full flex flex-col max-h-[85vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/75">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-slate-700" />
                <h3 className="font-bold text-sm text-slate-900">Python Project Source Code</h3>
              </div>
              <button
                onClick={() => setShowCodeModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* File Switcher */}
            <div className="px-6 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs font-mono overflow-x-auto">
              <div className="flex gap-2">
                {["app.py", "model_pipeline.py", "fairness_metrics.py", "requirements.txt", "README.md"].map((f) => (
                  <button
                    key={f}
                    onClick={() => openCodeModal(f)}
                    className={`px-3 py-1 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                      modalFile === f ? "bg-slate-900 text-white font-bold" : "text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(modalContent);
                  setCopiedCode(true);
                  setTimeout(() => setCopiedCode(false), 2000);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-slate-50 text-slate-700 rounded-md border border-slate-300 font-sans text-xs font-semibold cursor-pointer shrink-0 ml-2"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? "Copied!" : "Copy File"}</span>
              </button>
            </div>

            {/* Code Box */}
            <div className="flex-1 p-5 bg-slate-950 text-slate-200 font-mono text-xs overflow-auto">
              <pre className="leading-relaxed">{modalContent}</pre>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 text-xs text-slate-500 flex justify-between items-center">
              <span>All files are saved directly in project root and runnable with <code>streamlit run app.py</code></span>
              <button
                onClick={() => setShowCodeModal(false)}
                className="px-4 py-1.5 bg-slate-900 text-white font-semibold rounded-lg text-xs hover:bg-slate-800 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
