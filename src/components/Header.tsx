import React from "react";
import { Download, Terminal, Menu } from "lucide-react";

interface HeaderProps {
  title: string;
  subtitle: string;
  onOpenPythonModal: () => void;
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onOpenPythonModal,
  onToggleSidebar
}) => {
  return (
    <header className="bg-white border-b border-slate-200 px-4 md:px-8 py-4 md:py-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
          aria-label="Toggle navigation drawer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h2 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight leading-tight">
            {title}
          </h2>
          <p className="text-xs md:text-sm text-slate-500 mt-0.5">{subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
        <button
          onClick={onOpenPythonModal}
          className="inline-flex items-center gap-2 px-3 py-1.5 md:px-3.5 md:py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors cursor-pointer"
        >
          <Terminal className="w-4 h-4 text-slate-600" />
          <span>Python Code</span>
        </button>

        <a
          href="/api/export/dataset.csv"
          download="faircredit_synthetic_loan_dataset.csv"
          className="inline-flex items-center gap-2 px-3 py-1.5 md:px-3.5 md:py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors shadow-xs"
        >
          <Download className="w-4 h-4" />
          <span>Dataset CSV</span>
        </a>
      </div>
    </header>
  );
};
