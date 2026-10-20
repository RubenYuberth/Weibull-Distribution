import type { CurveKey } from "./weibull";

export interface AppState {
  x0: number;
  eta: number;
  b: number;
  visible: Record<CurveKey, boolean>;
  markers: boolean;
}

export interface Preset {
  id: string;
  label: string;
  x0: number;
  eta: number;
  b: number;
}

export const PARAM_LIMITS = {
  x0: { min: 0, max: 10, step: 0.1 },
  eta: { min: 0.1, max: 10, step: 0.1 },
  b: { min: 1, max: 10, step: 0.01 },
} as const;

export const DEFAULT_STATE: AppState = {
  x0: 0,
  eta: 1,
  b: 1.5,
  visible: { R: true, F: false, f: false },
  markers: true,
};

export const PRESETS: Preset[] = [
  { id: "tipica", label: "Weibull típica", x0: 0, eta: 1, b: 1.5 },
  { id: "exponencial", label: "Exponencial", x0: 0, eta: 1, b: 1 },
  { id: "envejecimiento", label: "Envejecimiento", x0: 0, eta: 1, b: 3 },
  { id: "envejecimiento-fuerte", label: "Envejecimiento fuerte", x0: 0, eta: 1, b: 5 },
  { id: "umbral", label: "Con umbral", x0: 2, eta: 3, b: 1.8 },
];

export type Listener = (state: AppState, animate: boolean) => void;

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

export class Store {
  private state: AppState;
  private listeners: Listener[] = [];

  constructor(initial: AppState = DEFAULT_STATE) {
    this.state = {
      ...initial,
      visible: { ...initial.visible },
    };
  }

  getState(): AppState {
    return this.state;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  update(patch: Partial<AppState>, animate = true): void {
    const visible: Record<CurveKey, boolean> = {
      ...this.state.visible,
      ...(patch.visible ?? {}),
    };
    if (!visible.R && !visible.F && !visible.f) return;

    this.state = {
      x0: clamp(patch.x0 ?? this.state.x0, PARAM_LIMITS.x0.min, PARAM_LIMITS.x0.max),
      eta: clamp(patch.eta ?? this.state.eta, PARAM_LIMITS.eta.min, PARAM_LIMITS.eta.max),
      b: clamp(patch.b ?? this.state.b, PARAM_LIMITS.b.min, PARAM_LIMITS.b.max),
      visible,
      markers: patch.markers ?? this.state.markers,
    };
    for (const l of this.listeners) l(this.state, animate);
  }

  applyPreset(preset: Preset): void {
    this.update({ x0: preset.x0, eta: preset.eta, b: preset.b }, true);
  }
}
