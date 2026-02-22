// Basic color conversion utilities
export function rgbToLab(r: number, g: number, b: number) {
  // normalize
  let R = r / 255;
  let G = g / 255;
  let B = b / 255;
  // inverse gamma
  R = R <= 0.04045 ? R / 12.92 : Math.pow((R + 0.055) / 1.055, 2.4);
  G = G <= 0.04045 ? G / 12.92 : Math.pow((G + 0.055) / 1.055, 2.4);
  B = B <= 0.04045 ? B / 12.92 : Math.pow((B + 0.055) / 1.055, 2.4);
  // sRGB D65
  const X = R * 0.4124564 + G * 0.3575761 + B * 0.1804375;
  const Y = R * 0.2126729 + G * 0.7151522 + B * 0.072175;
  const Z = R * 0.0193339 + G * 0.1191920 + B * 0.9503041;
  // normalize by D65 white
  const Xn = 0.95047,
    Yn = 1.0,
    Zn = 1.08883;
  let x = X / Xn,
    y = Y / Yn,
    z = Z / Zn;
  function f(t: number) {
    return t > 0.008856 ? Math.cbrt(t) : (7.787 * t + 16 / 116);
  }
  const fx = f(x),
    fy = f(y),
    fz = f(z);
  const L = 116 * fy - 16;
  const a = 500 * (fx - fy);
  const b2 = 200 * (fy - fz);
  return { L, a, b: b2 };
}

// Placeholder mapping from Lab -> pH (user will replace with calibrated model)
export function labToPh(lab: { L: number; a: number; b: number }) {
  // If a calibration model exists, use its linear coefficients.
  try {
    // dynamic require so mobile bundlers include JSON if present
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const model = require("./calibration/model.json");
    if (model && model.intercept !== undefined && model.coefs) {
      const { intercept, coefs } = model; // coefs: {L, a, b}
      const phEstimate = intercept + (coefs.L || 0) * lab.L + (coefs.a || 0) * lab.a + (coefs.b || 0) * lab.b;
      return Math.max(0, Math.min(14, Number(phEstimate.toFixed(2))));
    }
  } catch (e) {
    // no model file — fall back to toy mapping below
  }
  const phEstimate = 7 + 0.01 * (lab.L - 50) - 0.02 * lab.a + 0.015 * lab.b;
  return Math.max(0, Math.min(14, Number(phEstimate.toFixed(2))));
}
