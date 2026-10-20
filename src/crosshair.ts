import { pointer } from "d3-selection";
import type { Chart } from "./chart";
import { fmtValue } from "./format";
import type { AppState, Store } from "./state";
import { CURVE_COLORS } from "./theme";

export class Crosshair {
  private activeX: number | null = null;
  private cursorX = 0;
  private cursorY = 0;

  constructor(
    private readonly chart: Chart,
    private readonly tooltip: HTMLElement,
    private readonly store: Store,
  ) {
    const overlay = this.chart.overlayElement;
    overlay.addEventListener("pointermove", (e) => this.onMove(e));
    overlay.addEventListener("pointerleave", () => this.onLeave());
  }

  refresh(state: AppState): void {
    if (this.activeX === null) return;
    this.updateAt(this.activeX, state);
    this.position();
  }

  private onMove(e: PointerEvent): void {
    const [px] = pointer(e, this.chart.plotNode);
    const x = this.chart.invertX(px);
    const state = this.store.getState();
    const [xMin, xMax] = this.chart.domainX({
      x0: state.x0,
      eta: state.eta,
      b: state.b,
    });
    if (x < xMin || x > xMax) {
      this.hide();
      return;
    }
    this.activeX = x;
    const rect = this.chart.rootElement.getBoundingClientRect();
    this.cursorX = e.clientX - rect.left;
    this.cursorY = e.clientY - rect.top;
    this.updateAt(x, state);
    this.position();
  }

  private updateAt(x: number, state: AppState): void {
    this.chart.drawCrosshair(x, state);
    const rows = this.chart
      .valueAt(x, state)
      .map((v) => {
        const chip = `<span class="chip" style="background:${CURVE_COLORS[v.key]}"></span>`;
        return `<div class="tt-row">${chip}<span>${v.key}(x)</span><b>${fmtValue(v.value)}</b></div>`;
      })
      .join("");
    this.tooltip.innerHTML = `<div class="tt-x">x = ${fmtValue(x)}</div>${rows}`;
    this.tooltip.style.display = "block";
  }

  private position(): void {
    const wrap = this.chart.rootElement;
    const pad = 14;
    const tw = this.tooltip.offsetWidth;
    const th = this.tooltip.offsetHeight;
    let left = this.cursorX + pad;
    let top = this.cursorY + pad;
    if (left + tw > wrap.clientWidth) left = this.cursorX - pad - tw;
    if (top + th > wrap.clientHeight) top = this.cursorY - pad - th;
    this.tooltip.style.left = `${Math.max(0, left)}px`;
    this.tooltip.style.top = `${Math.max(0, top)}px`;
  }

  private onLeave(): void {
    this.hide();
  }

  private hide(): void {
    this.activeX = null;
    this.chart.drawCrosshair(null, this.store.getState());
    this.tooltip.style.display = "none";
  }
}
