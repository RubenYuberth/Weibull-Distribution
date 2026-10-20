import { fmtValue } from "./format";
import { PRESETS, type AppState, type Preset, type Store } from "./state";
import { CURVE_KEYS } from "./theme";
import type { CurveKey } from "./weibull";

interface SliderDef {
  key: "x0" | "eta" | "b";
  sliderId: string;
  outId: string;
}

const SLIDERS: SliderDef[] = [
  { key: "x0", sliderId: "slider-x0", outId: "out-x0" },
  { key: "eta", sliderId: "slider-eta", outId: "out-eta" },
  { key: "b", sliderId: "slider-b", outId: "out-b" },
];

function must<T extends HTMLElement>(el: T | null): T {
  if (!el) throw new Error("Falta un elemento del DOM");
  return el;
}

export function initControls(store: Store): void {
  const presetsRoot = must(document.getElementById("presets"));

  for (const preset of PRESETS) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "preset-btn";
    btn.dataset.preset = preset.id;
    btn.textContent = preset.label;
    btn.addEventListener("click", () => store.applyPreset(preset));
    presetsRoot.appendChild(btn);
  }

  for (const { key, sliderId, outId } of SLIDERS) {
    const slider = must(document.getElementById(sliderId)) as HTMLInputElement;
    const out = must(document.getElementById(outId));
    slider.addEventListener("input", () => {
      const v = Number(slider.value);
      const patch: Partial<AppState> =
        key === "x0" ? { x0: v } : key === "eta" ? { eta: v } : { b: v };
      store.update(patch, false);
      void out;
    });
  }

  for (const key of CURVE_KEYS) {
    const chk = must(document.getElementById(`chk-${key}`)) as HTMLInputElement;
    chk.addEventListener("change", () => {
      const visible = { ...store.getState().visible };
      visible[key as CurveKey] = chk.checked;
      store.update({ visible }, true);
    });
  }

  const markers = must(document.getElementById("chk-markers")) as HTMLInputElement;
  markers.addEventListener("change", () => {
    store.update({ markers: markers.checked }, true);
  });

  const sync = (state: AppState): void => {
    for (const { key, sliderId, outId } of SLIDERS) {
      const slider = must(document.getElementById(sliderId)) as HTMLInputElement;
      const out = must(document.getElementById(outId));
      const v = state[key];
      if (document.activeElement !== slider) slider.value = String(v);
      out.textContent = fmtValue(v);
    }

    const count = CURVE_KEYS.filter((k) => state.visible[k]).length;
    for (const key of CURVE_KEYS) {
      const chk = must(document.getElementById(`chk-${key}`)) as HTMLInputElement;
      chk.checked = state.visible[key];
      chk.disabled = state.visible[key] && count === 1;
    }
    markers.checked = state.markers;

    for (const btn of presetsRoot.querySelectorAll<HTMLButtonElement>(".preset-btn")) {
      const preset: Preset | undefined = PRESETS.find((x) => x.id === btn.dataset.preset);
      const active =
        !!preset &&
        preset.x0 === state.x0 &&
        preset.eta === state.eta &&
        preset.b === state.b;
      btn.classList.toggle("active", active);
    }
  };

  sync(store.getState());
  store.subscribe(sync);
}
