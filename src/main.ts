import "katex/dist/katex.min.css";
import "./styles.css";
import { Chart } from "./chart";
import { Crosshair } from "./crosshair";
import { initControls } from "./controls";
import { renderFormulas } from "./formula";
import { Store, type AppState } from "./state";

function must<T extends HTMLElement>(el: T | null): T {
  if (!el) throw new Error("Falta un elemento del DOM");
  return el;
}

const store = new Store();
const chartRoot = must(document.getElementById("chart-root"));
const chart = new Chart({
  root: chartRoot,
  legend: must(document.getElementById("legend-root")),
});

const tooltip = document.createElement("div");
tooltip.className = "tooltip";
chartRoot.appendChild(tooltip);
const crosshair = new Crosshair(chart, tooltip, store);

initControls(store);

const formulaRoot = must(document.getElementById("formula-root"));

function renderAll(state: AppState, animate: boolean): void {
  chart.render(state, animate);
  renderFormulas(formulaRoot, state);
  crosshair.refresh(state);
}

renderAll(store.getState(), false);
store.subscribe(renderAll);
