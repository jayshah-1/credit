import React from "react";
import {
  Scale,
  LayoutDashboard,
  Database,
  UserCheck,
  TrendingUp,
  ShieldAlert,
  GitCompare,
  Network,
  FileSpreadsheet,
  X
} from "lucide-react";

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  sensitiveCol: string;
  onChangeSensitiveCol: (col: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const NAV_ITEMS = [
  { id: "overview", label: "Overview & Home", icon: LayoutDashboard },
  { id: "dataset", label: "Dataset Explorer", icon: Database },
  { id: "predict", label: "Applicant Prediction", icon: UserCheck },
  { id: "models", label: "Model Performance", icon: TrendingUp },
  { id: "audit", label: "Algorithmic Bias Audit", icon: ShieldAlert },
  { id: "mitigation", label: "Bias Mitigation", icon: GitCompare },
  { id: "proxy", label: "Proxy Analysis", icon: Network },
  { id: "reports", label: "Reports & Downloads", icon: FileSpreadsheet }
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  sensitiveCol,
  onChangeSensitiveCol,
  isOpen,
  onClose
}) => {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-30 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 bg-slate-900 text-slate-300 flex flex-col shrink-0 min-h-screen border-r border-slate-800 transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-xl border border-teal-500/30">
                <Scale className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-semibold text-white tracking-tight leading-tight text-lg">FairCredit</h1>
                <p className="text-xs text-slate-400">AI Lending Bias Audit</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="md:hidden text-slate-400 hover:text-white p-1 rounded-md"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-4 px-2.5 py-1.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-medium leading-relaxed">
            Synthetic Dataset — Academic Research Prototype
          </div>
        </div>

        {/* Sensitive Attribute Config */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-900/50">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
            Audited Sensitive Feature
          </label>
          <select
            value={sensitiveCol}
            onChange={(e) => onChangeSensitiveCol(e.target.value)}
            className="w-full bg-slate-800 text-white text-sm rounded-md px-3 py-2 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value="gender">Gender (Notebook Primary)</option>
            <option value="socioeconomic_group">Socioeconomic Group</option>
          </select>
          <p className="text-[11px] text-slate-500 mt-1.5">
            Sensitive attributes are excluded from baseline predictive features.
          </p>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Application Modules
          </div>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onClose();
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                  isActive
                    ? "bg-teal-500/20 text-teal-300 border border-teal-500/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-teal-400" : "text-slate-400"}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer Info */}
        <div className="p-4 border-t border-slate-800 text-xs text-slate-500">
          <div className="flex justify-between items-center mb-1">
            <span>Target Variable</span>
            <span className="font-mono text-slate-400">repayment_success</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Environment</span>
            <span className="text-emerald-400 font-medium">Scikit-Learn Ready</span>
          </div>
        </div>
      </aside>
    </>
  );
};
