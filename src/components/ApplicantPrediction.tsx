import React, { useState } from "react";
import { PredictionResult } from "../types";
import {
  UserCheck,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Percent,
  Sliders,
  Sparkles
} from "lucide-react";

interface ApplicantPredictionProps {
  onPredict: (applicant: Record<string, any>, modelType: string) => Promise<PredictionResult>;
  sensitiveCol: string;
}

export const ApplicantPrediction: React.FC<ApplicantPredictionProps> = ({
  onPredict,
  sensitiveCol
}) => {
  const [gender, setGender] = useState("Female");
  const [socioeconomicGroup, setSocioeconomicGroup] = useState("Middle");
  const [postalCode, setPostalCode] = useState("P3");
  const [occupation, setOccupation] = useState("Professional");
  const [annualIncome, setAnnualIncome] = useState(54000);
  const [creditScore, setCreditScore] = useState(650);
  const [debtToIncomeRatio, setDebtToIncomeRatio] = useState(0.28);
  const [loanAmount, setLoanAmount] = useState(12000);
  const [employmentYears, setEmploymentYears] = useState(5.5);
  const [previousDefaults, setPreviousDefaults] = useState(0);
  const [modelType, setModelType] = useState<"Baseline" | "Reweighted" | "Threshold-adjusted">("Baseline");

  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = {
        gender,
        socioeconomic_group: socioeconomicGroup,
        postal_code: postalCode,
        occupation,
        annual_income: annualIncome,
        credit_score: creditScore,
        debt_to_income_ratio: debtToIncomeRatio,
        loan_amount: loanAmount,
        employment_years: employmentYears,
        previous_defaults: previousDefaults
      };
      const res = await onPredict(payload, modelType);
      setPrediction(res);
    } catch (err: any) {
      setError(err.message || "Failed to execute prediction.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Policy and Architectural Disclaimer */}
      <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-700 leading-relaxed">
        <strong className="text-slate-900 font-semibold">Architectural Safeguard:</strong> The predictive models are trained without direct access to the sensitive feature (<code>{sensitiveCol}</code>).
        During inference with the Baseline and Reweighted models, credit probability is determined exclusively from financial and employment signals.
        With the Threshold-adjusted model, calibrated validation thresholds are referenced for the group decision cutoff.
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Column */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Applicant Feature Parameters
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Model Variant:</span>
                <select
                  value={modelType}
                  onChange={(e) => setModelType(e.target.value as any)}
                  className="bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-lg px-2.5 py-1 font-semibold focus:ring-1 focus:ring-teal-500"
                >
                  <option value="Baseline">Baseline Model (T=0.50)</option>
                  <option value="Reweighted">Reweighted Model (T=0.50)</option>
                  <option value="Threshold-adjusted">Group Threshold Model (T=calibrated)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Sensitive Attributes (Audited) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Gender (Protected Attribute)
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-lg p-2.5"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Socioeconomic Group
                </label>
                <select
                  value={socioeconomicGroup}
                  onChange={(e) => setSocioeconomicGroup(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-lg p-2.5"
                >
                  <option value="Lower">Lower</option>
                  <option value="Middle">Middle</option>
                  <option value="Higher">Higher</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Postal Code
                </label>
                <select
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-lg p-2.5 font-mono"
                >
                  <option value="P1">P1 (Lower income cluster)</option>
                  <option value="P2">P2 (Lower-middle cluster)</option>
                  <option value="P3">P3 (Median metro cluster)</option>
                  <option value="P4">P4 (Middle-upper cluster)</option>
                  <option value="P5">P5 (Affluent cluster)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Occupation Category
                </label>
                <select
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-lg p-2.5"
                >
                  <option value="Manual">Manual Labor</option>
                  <option value="Service">Service & Retail</option>
                  <option value="Professional">Professional / Corporate</option>
                  <option value="Self-employed">Self-employed / Entrepreneur</option>
                </select>
              </div>

              {/* Financial Attributes */}
              <div>
                <div className="flex justify-between items-center text-xs font-semibold text-slate-700 mb-1">
                  <span>Annual Income ($)</span>
                  <span className="font-mono text-teal-700">${annualIncome.toLocaleString()}</span>
                </div>
                <input
                  type="number"
                  min="5000"
                  max="200000"
                  step="1000"
                  value={annualIncome}
                  onChange={(e) => setAnnualIncome(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-lg p-2.5 font-mono"
                />
              </div>

              <div>
                <div className="flex justify-between items-center text-xs font-semibold text-slate-700 mb-1">
                  <span>Credit Score (300-850)</span>
                  <span className="font-mono text-teal-700">{creditScore}</span>
                </div>
                <input
                  type="range"
                  min="400"
                  max="850"
                  step="1"
                  value={creditScore}
                  onChange={(e) => setCreditScore(Number(e.target.value))}
                  className="w-full accent-teal-600"
                />
              </div>

              <div>
                <div className="flex justify-between items-center text-xs font-semibold text-slate-700 mb-1">
                  <span>Debt-to-Income (DTI) Ratio</span>
                  <span className="font-mono text-teal-700">{(debtToIncomeRatio * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0.01"
                  max="0.90"
                  step="0.01"
                  value={debtToIncomeRatio}
                  onChange={(e) => setDebtToIncomeRatio(Number(e.target.value))}
                  className="w-full accent-teal-600"
                />
              </div>

              <div>
                <div className="flex justify-between items-center text-xs font-semibold text-slate-700 mb-1">
                  <span>Loan Amount Requested ($)</span>
                  <span className="font-mono text-teal-700">${loanAmount.toLocaleString()}</span>
                </div>
                <input
                  type="number"
                  min="1000"
                  max="40000"
                  step="500"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-lg p-2.5 font-mono"
                />
              </div>

              <div>
                <div className="flex justify-between items-center text-xs font-semibold text-slate-700 mb-1">
                  <span>Employment History (Years)</span>
                  <span className="font-mono text-teal-700">{employmentYears} yrs</span>
                </div>
                <input
                  type="number"
                  min="0"
                  max="40"
                  step="0.5"
                  value={employmentYears}
                  onChange={(e) => setEmploymentYears(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-lg p-2.5 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Prior Loan Defaults Count
                </label>
                <select
                  value={previousDefaults}
                  onChange={(e) => setPreviousDefaults(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-lg p-2.5 font-mono"
                >
                  <option value={0}>0 Prior Defaults (Clean)</option>
                  <option value={1}>1 Prior Default</option>
                  <option value={2}>2+ Prior Defaults</option>
                </select>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    <span>Executing Model Inference...</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4" />
                    <span>Predict Repayment Outcome</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-4 p-3 rounded-lg bg-rose-50 text-rose-700 text-xs border border-rose-200">
              {error}
            </div>
          )}
        </div>

        {/* Prediction Results & Explanation Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="pb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Predicted Repayment Outcome
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Model output and calibrated decision cutoff</p>
            </div>

            {prediction ? (
              <div className="mt-5 space-y-5">
                <div className="text-center p-5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Model Confidence Score
                  </span>
                  <div className="text-3xl font-extrabold text-slate-900 mt-1 font-mono">
                    {(prediction.probability_repayment_success * 100).toFixed(1)}%
                  </div>
                  <div className="mt-3 w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        prediction.predicted_class === 1 ? "bg-emerald-500" : "bg-rose-500"
                      }`}
                      style={{ width: `${Math.min(100, prediction.probability_repayment_success * 100)}%` }}
                    />
                  </div>
                  <div className="mt-2 flex justify-between text-[11px] font-mono text-slate-500">
                    <span>0% (Default)</span>
                    <span className="text-slate-700 font-medium">Cutoff: {prediction.decision_threshold.toFixed(2)}</span>
                    <span>100% (Repaid)</span>
                  </div>
                </div>

                <div
                  className={`p-4 rounded-xl border flex items-start gap-3 ${
                    prediction.predicted_class === 1
                      ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                      : "bg-rose-50/70 border-rose-200 text-rose-900"
                  }`}
                >
                  {prediction.predicted_class === 1 ? (
                    <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-bold text-sm">
                      {prediction.predicted_class === 1
                        ? "Favorable: High Repayment Likelihood"
                        : "Caution: High Default Risk Identified"}
                    </div>
                    <p className="text-xs mt-1 leading-relaxed opacity-90">
                      Applicant probability ({prediction.probability_repayment_success.toFixed(3)}){" "}
                      {prediction.predicted_class === 1 ? "meets or exceeds" : "falls below"} the decision cutoff ({prediction.decision_threshold.toFixed(3)}) under <strong>{prediction.model_type}</strong>.
                    </p>
                  </div>
                </div>

                <div className="text-xs text-slate-600 space-y-1.5 p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex justify-between font-mono">
                    <span className="text-slate-500">Model Pipeline:</span>
                    <span className="font-semibold text-slate-800">{prediction.model_type}</span>
                  </div>
                  <div className="flex justify-between font-mono">
                    <span className="text-slate-500">Demographic Context:</span>
                    <span className="text-slate-800">{prediction.sensitive_attribute}</span>
                  </div>
                  <div className="flex justify-between font-mono">
                    <span className="text-slate-500">Target Variable:</span>
                    <span className="text-slate-800">repayment_success</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-12 text-center text-slate-400 py-8">
                <HelpCircle className="w-10 h-10 mx-auto text-slate-300 mb-2 stroke-1" />
                <p className="text-xs font-medium">Complete applicant parameters and click "Predict Repayment Outcome" to view model analysis.</p>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200">
            <p className="text-[11px] text-slate-400 italic leading-relaxed">
              Research Prototype Warning: Predictions are experimental calculations on synthetic coursework data and must NOT be used for real credit decisions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
