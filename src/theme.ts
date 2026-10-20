import type { CurveKey } from "./weibull";

export const CURVE_KEYS: CurveKey[] = ["R", "F", "f"];

export const CURVE_COLORS: Record<CurveKey, string> = {
  R: "#2563eb",
  F: "#ea580c",
  f: "#16a34a",
};

export const CURVE_LABELS: Record<CurveKey, string> = {
  R: "R(x) · confiabilidad",
  F: "F(x) · prob. acumulada",
  f: "f(x) · densidad",
};
