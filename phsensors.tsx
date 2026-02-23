<<<<<<< HEAD
export function labToPh(lab: { L: number; a: number; b: number }) {
  // If a calibration model exists, use its linear coefficients.
  try {
    const model = require("./calibration/model.json");
    if (model && model.intercept !== undefined && model.coefs) {
      const { intercept, coefs } = model; // coefs: {L, a, b}
      const phEstimate = intercept + (coefs.L || 0) * lab.L + (coefs.a || 0) * lab.a + (coefs.b || 0) * lab.b;
      return Math.max(0, Math.min(14, Number(phEstimate.toFixed(2))));
    }
  } catch (e) {
    // no model file — fall back to toy mapping below
  }
  // PLACEHOLDER - currently just a guess
  const phEstimate = 7 + 0.01 * (lab.L - 50) - 0.02 * lab.a + 0.015 * lab.b;
  return Math.max(0, Math.min(14, Number(phEstimate.toFixed(2))));
}
=======
export function labToPh(lab: { L: number; a: number; b: number }) {
  // If a calibration model exists, use its linear coefficients.
  try {
    const model = require("./calibration/model.json");
    if (model && model.intercept !== undefined && model.coefs) {
      const { intercept, coefs } = model; // coefs: {L, a, b}
      const phEstimate = intercept + (coefs.L || 0) * lab.L + (coefs.a || 0) * lab.a + (coefs.b || 0) * lab.b;
      return Math.max(0, Math.min(14, Number(phEstimate.toFixed(2))));
    }
  } catch (e) {
    // no model file — fall back to toy mapping below
  }
  // PLACEHOLDER - currently just a guess
  const phEstimate = 7 + 0.01 * (lab.L - 50) - 0.02 * lab.a + 0.015 * lab.b;
  return Math.max(0, Math.min(14, Number(phEstimate.toFixed(2))));
}
>>>>>>> 6d1be266a6002eda81d0cf769ab9eb1e30af39a9
