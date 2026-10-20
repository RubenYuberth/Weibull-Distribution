import { describe, expect, it } from "vitest";
import {
  F,
  R,
  characteristicLife,
  f,
  gamma,
  mean,
  median,
  mode,
  percentile,
  sample,
  xDomain,
  yMaxF,
  type WeibullParams,
} from "../src/weibull";

function integrateF(p: WeibullParams, a: number, b: number, n: number): number {
  const h = (b - a) / n;
  let sum = 0.5 * (f(a, p) + f(b, p));
  for (let i = 1; i < n; i++) sum += f(a + i * h, p);
  return sum * h;
}

describe("R y F", () => {
  it("R(x0) = 1", () => {
    expect(R(0, { x0: 0, eta: 1, b: 1.5 })).toBe(1);
  });

  it("R(x0 + eta) = e^-1", () => {
    expect(R(2, { x0: 1, eta: 1, b: 3 })).toBeCloseTo(Math.exp(-1), 12);
  });

  it("R(x < x0) = 1 y F(x < x0) = 0", () => {
    const p = { x0: 2, eta: 3, b: 1.5 };
    expect(R(0, p)).toBe(1);
    expect(F(0, p)).toBe(0);
    expect(R(1.999, p)).toBe(1);
  });

  it("F = 1 - R en una malla de puntos", () => {
    const p = { x0: 1, eta: 2, b: 2.5 };
    for (let x = 0; x <= 15; x += 0.37) {
      expect(F(x, p)).toBeCloseTo(1 - R(x, p), 12);
    }
  });

  it("F es monótona creciente", () => {
    const p = { x0: 0, eta: 1.5, b: 1.2 };
    let prev = -Infinity;
    for (let x = 0; x <= 12; x += 0.25) {
      const v = F(x, p);
      expect(v).toBeGreaterThanOrEqual(prev);
      prev = v;
    }
    expect(prev).toBeLessThanOrEqual(1);
    expect(prev).toBeGreaterThan(0.99);
  });
});

describe("f (densidad)", () => {
  it("f(x < x0) = 0", () => {
    const p = { x0: 2, eta: 1, b: 3 };
    expect(f(0, p)).toBe(0);
    expect(f(1.5, p)).toBe(0);
  });

  it("f(x0) según el exponente b", () => {
    expect(f(0, { x0: 0, eta: 2, b: 1 })).toBeCloseTo(0.5, 12);
    expect(f(0, { x0: 0, eta: 1, b: 2 })).toBe(0);
    expect(f(0, { x0: 0, eta: 1, b: 0.5 })).toBe(Infinity);
  });

  it("f >= 0 en una malla de puntos", () => {
    const p = { x0: 0, eta: 1, b: 1.7 };
    for (let x = 0; x <= 10; x += 0.21) {
      expect(f(x, p)).toBeGreaterThanOrEqual(0);
    }
  });

  it("la integral de f sobre [x0, x0 + 50η] ≈ 1", () => {
    for (const p of [
      { x0: 0, eta: 1, b: 1 },
      { x0: 0, eta: 1, b: 1.5 },
      { x0: 2, eta: 3, b: 2 },
    ] as WeibullParams[]) {
      const total = integrateF(p, p.x0, p.x0 + 50 * p.eta, 200000);
      expect(total).toBeCloseTo(1, 3);
    }
  });
});

describe("gamma", () => {
  it("valores conocidos", () => {
    expect(gamma(1)).toBeCloseTo(1, 10);
    expect(gamma(0.5)).toBeCloseTo(Math.sqrt(Math.PI), 10);
    expect(gamma(5)).toBeCloseTo(24, 9);
    expect(gamma(1.5)).toBeCloseTo(Math.sqrt(Math.PI) / 2, 10);
    expect(gamma(2.5)).toBeCloseTo(1.329340388179137, 9);
  });
});

describe("métricas de vida útil", () => {
  it("vida característica = x0 + η", () => {
    expect(characteristicLife({ x0: 2, eta: 3, b: 1 })).toBe(5);
  });

  it("mediana para b = 1 es x0 + η·ln2", () => {
    expect(median({ x0: 0, eta: 1, b: 1 })).toBeCloseTo(Math.LN2, 12);
  });

  it("media para b = 1 es x0 + η", () => {
    expect(mean({ x0: 0, eta: 1, b: 1 })).toBeCloseTo(1, 10);
  });

  it("media con b = 2 usa Γ(1.5)", () => {
    const p = { x0: 2, eta: 3, b: 2 };
    expect(mean(p)).toBeCloseTo(2 + 3 * (Math.sqrt(Math.PI) / 2), 9);
  });

  it("moda para b = 3 es x0 + η·(2/3)^(1/3)", () => {
    expect(mode({ x0: 0, eta: 1, b: 3 })).toBeCloseTo(Math.pow(2 / 3, 1 / 3), 12);
    expect(mode({ x0: 0, eta: 1, b: 0.7 })).toBe(0);
    expect(mode({ x0: 0, eta: 1, b: 1 })).toBe(0);
  });

  it("percentil 10 para b = 1 es x0 + η·(−ln(0.9))", () => {
    const p = { x0: 2, eta: 3, b: 1 };
    expect(percentile(p, 0.1)).toBeCloseTo(2 + 3 * -Math.log(0.9), 12);
  });

  it("el percentil q cumple F(x_q) = q", () => {
    const p = { x0: 1, eta: 2, b: 2.5 };
    for (const q of [0.05, 0.1, 0.5, 0.9]) {
      expect(F(percentile(p, q), p)).toBeCloseTo(q, 10);
    }
    const p2 = { x0: 0, eta: 1, b: 1 };
    expect(F(percentile(p2, 0.1), p2)).toBeCloseTo(0.1, 10);
  });
});

describe("sample, xDomain e yMaxF", () => {
  it("sample devuelve n puntos con x creciente", () => {
    const pts = sample((x) => x * x, 0, 4, 600);
    expect(pts).toHaveLength(600);
    expect(pts[0][0]).toBe(0);
    expect(pts[599][0]).toBeCloseTo(4, 12);
    for (let i = 1; i < pts.length; i++) {
      expect(pts[i][0]).toBeGreaterThan(pts[i - 1][0]);
    }
  });

  it("xDomain ajusta el rango con x0 y η", () => {
    expect(xDomain({ x0: 0, eta: 1, b: 1.5 })).toEqual([0, 4]);
    const [min, max] = xDomain({ x0: 2, eta: 1, b: 1.5 });
    expect(min).toBeCloseTo(1.5, 12);
    expect(max).toBeCloseTo(6, 12);
  });

  it("yMaxF con b >= 1 es el máximo analítico × 1.1", () => {
    const p = { x0: 0, eta: 1, b: 2 };
    expect(yMaxF(p, 0, 4)).toBeCloseTo(f(mode(p), p) * 1.1, 10);
  });

  it("yMaxF con b < 1 es finita y positiva", () => {
    const p = { x0: 0, eta: 1, b: 0.5 };
    const cap = yMaxF(p, 0, 4);
    expect(Number.isFinite(cap)).toBe(true);
    expect(cap).toBeGreaterThan(0);
  });
});
