export type CurveKey = "R" | "F" | "f";

export interface WeibullParams {
  x0: number;
  eta: number;
  b: number;
}

export function R(x: number, p: WeibullParams): number {
  if (x < p.x0) return 1;
  const z = (x - p.x0) / p.eta;
  return Math.exp(-Math.pow(z, p.b));
}

export function F(x: number, p: WeibullParams): number {
  return 1 - R(x, p);
}

export function f(x: number, p: WeibullParams): number {
  if (x < p.x0) return 0;
  const z = (x - p.x0) / p.eta;
  if (z === 0) {
    if (p.b > 1) return 0;
    if (p.b === 1) return 1 / p.eta;
    return Infinity;
  }
  return (p.b / p.eta) * Math.pow(z, p.b - 1) * Math.exp(-Math.pow(z, p.b));
}

const LANCZOS = [
  0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313,
  -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6,
  1.5056327351493116e-7,
];

export function gamma(x: number): number {
  if (x < 0.5) {
    return Math.PI / (Math.sin(Math.PI * x) * gamma(1 - x));
  }
  const z = x - 1;
  let a = LANCZOS[0];
  const t = z + 7.5;
  for (let i = 1; i < LANCZOS.length; i++) {
    a += LANCZOS[i] / (z + i);
  }
  return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * a;
}

export function characteristicLife(p: WeibullParams): number {
  return p.x0 + p.eta;
}

export function median(p: WeibullParams): number {
  return p.x0 + p.eta * Math.pow(Math.LN2, 1 / p.b);
}

export function mean(p: WeibullParams): number {
  return p.x0 + p.eta * gamma(1 + 1 / p.b);
}

export function mode(p: WeibullParams): number {
  if (p.b <= 1) return p.x0;
  return p.x0 + p.eta * Math.pow((p.b - 1) / p.b, 1 / p.b);
}

export function percentile(p: WeibullParams, q: number): number {
  return p.x0 + p.eta * Math.pow(-Math.log(1 - q), 1 / p.b);
}

export function xDomain(p: WeibullParams): [number, number] {
  return [Math.max(0, p.x0 - 0.5 * p.eta), p.x0 + 4 * p.eta];
}

export function sample(
  fn: (x: number) => number,
  xMin: number,
  xMax: number,
  n = 600,
): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  const step = (xMax - xMin) / (n - 1);
  for (let i = 0; i < n; i++) {
    const x = xMin + i * step;
    out.push([x, fn(x)]);
  }
  return out;
}

function quantileSorted(values: number[], q: number): number {
  if (values.length === 0) return NaN;
  const pos = (values.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  if (lo === hi) return values[lo];
  return values[lo] + (values[hi] - values[lo]) * (pos - lo);
}

export function yMaxF(p: WeibullParams, xMin: number, xMax: number): number {
  if (p.b >= 1) {
    return f(mode(p), p) * 1.1;
  }
  const pts = sample((x) => f(x, p), xMin, xMax, 600);
  const finite = pts
    .map((d) => d[1])
    .filter((v) => Number.isFinite(v))
    .sort((a, b) => a - b);
  const q = quantileSorted(finite, 0.99);
  return (Number.isFinite(q) ? q : 1) * 1.1;
}
