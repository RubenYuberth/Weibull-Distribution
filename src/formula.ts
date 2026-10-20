import katex from "katex";
import type { AppState } from "./state";
import { CURVE_COLORS } from "./theme";

function num(n: number): string {
  return String(Math.round(n * 10000) / 10000);
}

interface FormulaItem {
  key: "R" | "F" | "f";
  tex: string;
}

export function renderFormulas(container: HTMLElement, state: AppState): void {
  container.innerHTML = "";
  const x0 = num(state.x0);
  const eta = num(state.eta);
  const b = num(state.b);
  const bm1 = num(state.b - 1);
  const z = String.raw`\frac{x - ${x0}}{${eta}}`;

  const items: FormulaItem[] = [];
  if (state.visible.R) {
    items.push({
      key: "R",
      tex: String.raw`\mathrm{R}(x) = \exp\!\left(-\left(${z}\right)^{${b}}\right)`,
    });
  }
  if (state.visible.F) {
    items.push({
      key: "F",
      tex: String.raw`\mathrm{F}(x) = 1 - \exp\!\left(-\left(${z}\right)^{${b}}\right)`,
    });
  }
  if (state.visible.f) {
    items.push({
      key: "f",
      tex: String.raw`\mathrm{f}(x) = \frac{${b}}{${eta}}\left(${z}\right)^{${bm1}}\exp\!\left(-\left(${z}\right)^{${b}}\right)`,
    });
  }

  for (const item of items) {
    const div = document.createElement("div");
    div.className = "formula-item";
    div.style.borderLeftColor = CURVE_COLORS[item.key];
    container.appendChild(div);
    katex.render(item.tex, div, { throwOnError: false, displayMode: true });
  }
}
