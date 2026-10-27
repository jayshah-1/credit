/**
 * Pure TypeScript implementations of fairness formulas and utility checks for client/server validation.
 */

export function calculateSelectionRate(predictions: number[]): number {
  if (!predictions || predictions.length === 0) return 0;
  const ones = predictions.filter((p) => p === 1).length;
  return ones / predictions.length;
}

export function calculateTPR(actuals: number[], predictions: number[]): number {
  let tp = 0;
  let fn = 0;
  for (let i = 0; i < actuals.length; i++) {
    if (actuals[i] === 1) {
      if (predictions[i] === 1) tp++;
      else fn++;
    }
  }
  return tp + fn > 0 ? tp / (tp + fn) : 0;
}

export function calculateFPR(actuals: number[], predictions: number[]): number {
  let fp = 0;
  let tn = 0;
  for (let i = 0; i < actuals.length; i++) {
    if (actuals[i] === 0) {
      if (predictions[i] === 1) fp++;
      else tn++;
    }
  }
  return fp + tn > 0 ? fp / (fp + tn) : 0;
}

export function calculateDisparateImpactRatio(sr0: number, sr1: number): number {
  if (Math.max(sr0, sr1) === 0) return 0;
  return Math.min(sr0, sr1) / Math.max(sr0, sr1);
}

export function calculateEqualizedOddsGap(tpr0: number, tpr1: number, fpr0: number, fpr1: number): number {
  const tprGap = Math.abs(tpr0 - tpr1);
  const fprGap = Math.abs(fpr0 - fpr1);
  return Math.max(tprGap, fprGap);
}

export function calculateBusinessValue(
  actuals: number[],
  predictions: number[],
  revenue = 1200,
  loss = 5000,
  operatingCost = 250
): { approvedCount: number; netValue: number; successRate: number } {
  let approvedCount = 0;
  let netValue = 0;
  let successCount = 0;

  for (let i = 0; i < actuals.length; i++) {
    if (predictions[i] === 1) {
      approvedCount++;
      if (actuals[i] === 1) {
        successCount++;
        netValue += revenue - operatingCost;
      } else {
        netValue += -loss - operatingCost;
      }
    }
  }

  const successRate = approvedCount > 0 ? successCount / approvedCount : 0;
  return { approvedCount, netValue, successRate };
}
