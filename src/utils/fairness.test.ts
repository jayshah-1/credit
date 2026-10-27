import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateSelectionRate,
  calculateTPR,
  calculateFPR,
  calculateDisparateImpactRatio,
  calculateEqualizedOddsGap,
  calculateBusinessValue
} from "./fairness";

test("calculateSelectionRate computes accurate proportion of positive predictions", () => {
  assert.equal(calculateSelectionRate([1, 0, 1, 0]), 0.5);
  assert.equal(calculateSelectionRate([0, 0, 0, 0]), 0.0);
  assert.equal(calculateSelectionRate([1, 1, 1, 1]), 1.0);
  assert.equal(calculateSelectionRate([]), 0.0);
});

test("calculateTPR and calculateFPR correctly compute confusion rates", () => {
  // actuals: [1, 1, 0, 0], preds: [1, 0, 1, 0]
  // TP=1, FN=1 -> TPR = 1/2 = 0.5
  // FP=1, TN=1 -> FPR = 1/2 = 0.5
  const actuals = [1, 1, 0, 0];
  const preds = [1, 0, 1, 0];
  assert.equal(calculateTPR(actuals, preds), 0.5);
  assert.equal(calculateFPR(actuals, preds), 0.5);
});

test("calculateDisparateImpactRatio enforces min/max ratio and zero safety", () => {
  assert.equal(calculateDisparateImpactRatio(0.4, 0.5), 0.8);
  assert.equal(calculateDisparateImpactRatio(0.5, 0.4), 0.8);
  assert.equal(calculateDisparateImpactRatio(0, 0), 0.0);
});

test("calculateEqualizedOddsGap takes max of TPR and FPR disparities", () => {
  // tpr0=0.8, tpr1=0.6 (gap=0.2); fpr0=0.1, fpr1=0.15 (gap=0.05) -> max is 0.2
  assert.ok(Math.abs(calculateEqualizedOddsGap(0.8, 0.6, 0.1, 0.15) - 0.2) < 1e-6);
});

test("calculateBusinessValue properly accounts for revenue, default loss, and cost", () => {
  const actuals = [1, 0]; // 1 repay, 1 default
  const preds = [1, 1];   // both approved
  // 1st loan: 1200 - 250 = +950
  // 2nd loan: -5000 - 250 = -5250
  // Total: -4300
  const result = calculateBusinessValue(actuals, preds);
  assert.equal(result.approvedCount, 2);
  assert.equal(result.netValue, -4300);
  assert.equal(result.successRate, 0.5);
});
