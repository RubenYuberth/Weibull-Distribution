import { select, type Selection } from "d3-selection";
import "d3-transition";
import { scaleLinear, type ScaleLinear } from "d3-scale";
import { axisBottom, axisLeft } from "d3-axis";
import { line, curveMonotoneX } from "d3-shape";
import { fmtTick } from "./format";
import type { AppState } from "./state";
import { CURVE_COLORS, CURVE_KEYS, CURVE_LABELS } from "./theme";
import {
  F,
  R,
  characteristicLife,
  f as pdf,
  mean,
  median,
  sample,
  xDomain,
  yMaxF,
  type CurveKey,
  type WeibullParams,
} from "./weibull";

const HEIGHT = 460;
const MARGIN = { top: 16, right: 24, bottom: 44, left: 60 };
const SAMPLES = 600;
const DURATION = 250;
const CLIP_ID = "weibull-plot-clip";

type Pt = [number, number];

interface MarkerDatum {
  key: string;
  x: number;
  label: string;
}

interface DotDatum {
  key: CurveKey;
  px: number;
  py: number;
}

function fnOf(key: CurveKey): (x: number, p: WeibullParams) => number {
  return key === "R" ? R : key === "F" ? F : pdf;
}

export class Chart {
  private readonly root: HTMLElement;
  private readonly legendEl: HTMLElement;
  private readonly svg: Selection<SVGSVGElement, unknown, null, undefined>;
  private readonly plot: Selection<SVGGElement, unknown, null, undefined>;
  private readonly gridG: Selection<SVGGElement, unknown, null, undefined>;
  private readonly markersG: Selection<SVGGElement, unknown, null, undefined>;
  private readonly xAxisG: Selection<SVGGElement, unknown, null, undefined>;
  private readonly yAxisG: Selection<SVGGElement, unknown, null, undefined>;
  private readonly crosshairG: Selection<SVGGElement, unknown, null, undefined>;
  private readonly crosshairDots: Selection<SVGGElement, unknown, null, undefined>;
  private readonly overlayRect: Selection<SVGRectElement, unknown, null, undefined>;
  private readonly clipRect: Selection<SVGRectElement, unknown, null, undefined>;
  private readonly xLabel: Selection<SVGTextElement, unknown, null, undefined>;
  private readonly yLabel: Selection<SVGTextElement, unknown, null, undefined>;
  private readonly paths: Record<CurveKey, Selection<SVGPathElement, unknown, null, undefined>>;
  private readonly xScale: ScaleLinear<number, number> = scaleLinear();
  private readonly yScale: ScaleLinear<number, number> = scaleLinear();
  private readonly innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
  private innerWidth = 800 - MARGIN.left - MARGIN.right;
  private lastState: AppState | null = null;

  constructor(handles: { root: HTMLElement; legend: HTMLElement }) {
    this.root = handles.root;
    this.legendEl = handles.legend;

    this.svg = select(this.root).append("svg").attr("class", "chart-svg");
    const defs = this.svg.append("defs");
    this.clipRect = defs
      .append("clipPath")
      .attr("id", CLIP_ID)
      .append("rect")
      .attr("x", 0)
      .attr("y", 0);
    this.plot = this.svg
      .append("g")
      .attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);
    this.gridG = this.plot.append("g").attr("class", "grid");
    this.markersG = this.plot.append("g").attr("class", "markers");
    const curvesG = this.plot
      .append("g")
      .attr("class", "curves")
      .attr("clip-path", `url(#${CLIP_ID})`);
    this.paths = {
      R: curvesG.append("path").attr("class", "curve curve-R"),
      F: curvesG.append("path").attr("class", "curve curve-F"),
      f: curvesG.append("path").attr("class", "curve curve-f"),
    };
    for (const key of CURVE_KEYS) {
      this.paths[key]
        .attr("fill", "none")
        .attr("stroke", CURVE_COLORS[key])
        .attr("stroke-width", 2)
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round");
    }
    this.xAxisG = this.plot
      .append("g")
      .attr("class", "axis axis-x")
      .attr("transform", `translate(0,${this.innerHeight})`);
    this.yAxisG = this.plot.append("g").attr("class", "axis axis-y");
    this.crosshairG = this.plot.append("g").attr("class", "crosshair").style("display", "none");
    this.crosshairG
      .append("line")
      .attr("y1", 0)
      .attr("y2", this.innerHeight)
      .attr("stroke", "#475569")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "4 3");
    this.crosshairDots = this.crosshairG.append("g").attr("class", "crosshair-dots");
    this.overlayRect = this.plot
      .append("rect")
      .attr("class", "overlay")
      .attr("fill", "transparent");
    this.xLabel = this.svg
      .append("text")
      .attr("class", "axis-label")
      .attr("text-anchor", "middle")
      .text("x");
    this.yLabel = this.svg
      .append("text")
      .attr("class", "axis-label")
      .attr("text-anchor", "middle")
      .text("R(x)");

    this.updateSizes();
    new ResizeObserver(() => {
      this.updateSizes();
      if (this.lastState) this.render(this.lastState, false);
    }).observe(this.root);
  }

  get plotNode(): SVGGElement {
    return this.plot.node()!;
  }

  get overlayElement(): SVGRectElement {
    return this.overlayRect.node()!;
  }

  get rootElement(): HTMLElement {
    return this.root;
  }

  domainX(p: WeibullParams): [number, number] {
    return xDomain(p);
  }

  invertX(px: number): number {
    return this.xScale.invert(px);
  }

  valueAt(x: number, state: AppState): Array<{ key: CurveKey; value: number }> {
    return CURVE_KEYS.filter((k) => state.visible[k]).map((k) => ({
      key: k,
      value: fnOf(k)(x, state),
    }));
  }

  drawCrosshair(x: number | null, state: AppState): void {
    if (x === null) {
      this.crosshairG.style("display", "none");
      return;
    }
    this.crosshairG.style("display", null);
    const px = this.xScale(x);
    this.crosshairG.select<SVGLineElement>("line").attr("x1", px).attr("x2", px);
    const dots: DotDatum[] = this.valueAt(x, state).map(({ key, value }) => {
      const py = Number.isFinite(value) ? this.yScale(value) : NaN;
      return { key, px, py: Math.min(this.innerHeight, Math.max(0, py)) };
    });
    this.crosshairDots
      .selectAll<SVGCircleElement, DotDatum>("circle")
      .data(dots, (d) => d.key)
      .join("circle")
      .attr("r", 4)
      .attr("fill", (d) => CURVE_COLORS[d.key])
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .attr("cx", (d) => d.px)
      .attr("cy", (d) => d.py);
  }

  render(state: AppState, animate: boolean): void {
    this.lastState = state;
    const p: WeibullParams = { x0: state.x0, eta: state.eta, b: state.b };
    const [xMin, xMax] = xDomain(p);
    this.xScale.domain([xMin, xMax]).range([0, this.innerWidth]);

    const yCap = state.visible.f ? yMaxF(p, xMin, xMax) : 0;
    const yMax = Math.max(state.visible.R || state.visible.F ? 1 : 0, yCap) || 1;
    this.yScale.domain([0, yMax]).range([this.innerHeight, 0]);

    const xAxis = axisBottom(this.xScale)
      .ticks(Math.max(4, Math.floor(this.innerWidth / 90)))
      .tickFormat(fmtTick);
    const yAxis = axisLeft(this.yScale).ticks(6).tickFormat(fmtTick);
    const gridAxis = axisLeft(this.yScale)
      .ticks(6)
      .tickSize(-this.innerWidth)
      .tickFormat(() => "");

    if (animate) {
      this.xAxisG.transition().duration(DURATION).call(xAxis);
      this.yAxisG.transition().duration(DURATION).call(yAxis);
      this.gridG.transition().duration(DURATION).call(gridAxis);
    } else {
      this.xAxisG.call(xAxis);
      this.yAxisG.call(yAxis);
      this.gridG.call(gridAxis);
    }

    const clampY = Math.max(yCap, yMax) * 1e3;
    for (const key of CURVE_KEYS) {
      const path = this.paths[key];
      if (!state.visible[key]) {
        path.style("opacity", 0);
        continue;
      }
      path.style("opacity", 1);
      const fn = fnOf(key);
      const pts: Pt[] = sample((x) => fn(x, p), xMin, xMax, SAMPLES).map(
        ([x, y]) => [x, Number.isFinite(y) ? y : clampY] as Pt,
      );
      const gen = line<Pt>()
        .x((d) => this.xScale(d[0]))
        .y((d) => this.yScale(d[1]))
        .curve(curveMonotoneX);
      const d = gen(pts) ?? "";
      if (animate) {
        path.transition().duration(DURATION).attr("d", d);
      } else {
        path.attr("d", d);
      }
    }

    this.renderMarkers(state, p, xMin, xMax, animate);
    this.renderLegend(state);

    const visible = CURVE_KEYS.filter((k) => state.visible[k]);
    this.yLabel.text(visible.length === 1 ? `${visible[0]}(x)` : "valor");
  }

  private renderMarkers(
    state: AppState,
    p: WeibullParams,
    xMin: number,
    xMax: number,
    animate: boolean,
  ): void {
    this.markersG.style("display", state.markers ? "" : "none");
    const items: MarkerDatum[] = [
      { key: "eta", x: characteristicLife(p), label: "η" },
      { key: "mediana", x: median(p), label: "mediana" },
      { key: "media", x: mean(p), label: "media" },
    ].filter((m) => m.x >= xMin && m.x <= xMax);

    const groups = this.markersG
      .selectAll<SVGGElement, MarkerDatum>("g.marker")
      .data(items, (d) => d.key)
      .join(
        (enter) => {
          const g = enter.append("g").attr("class", "marker");
          g.append("line")
            .attr("y1", 0)
            .attr("y2", this.innerHeight)
            .attr("stroke", "#94a3b8")
            .attr("stroke-dasharray", "4 3");
          g.append("text")
            .attr("class", "marker-label")
            .attr("y", -5)
            .attr("text-anchor", "middle");
          return g;
        },
        (update) => update,
        (exit) => exit.remove(),
      );

    const setTransform = (sel: typeof groups) =>
      sel.attr("transform", (d) => `translate(${this.xScale(d.x)},0)`);
    if (animate) {
      setTransform(groups.transition().duration(DURATION) as unknown as typeof groups);
    } else {
      setTransform(groups);
    }
    groups.select("text").text((d) => d.label);
  }

  private renderLegend(state: AppState): void {
    const visible = CURVE_KEYS.filter((k) => state.visible[k]);
    this.legendEl.innerHTML = "";
    if (visible.length < 2) return;
    for (const k of visible) {
      const item = document.createElement("span");
      item.className = "legend-item";
      const chip = document.createElement("span");
      chip.className = "chip";
      chip.style.background = CURVE_COLORS[k];
      item.appendChild(chip);
      item.appendChild(document.createTextNode(CURVE_LABELS[k]));
      this.legendEl.appendChild(item);
    }
  }

  private updateSizes(): void {
    const total = this.root.clientWidth || 800;
    this.innerWidth = Math.max(120, total - MARGIN.left - MARGIN.right);
    this.svg.attr("width", total).attr("height", HEIGHT);
    this.clipRect.attr("width", this.innerWidth).attr("height", this.innerHeight);
    this.overlayRect.attr("width", this.innerWidth).attr("height", this.innerHeight);
    this.xLabel.attr(
      "transform",
      `translate(${MARGIN.left + this.innerWidth / 2},${HEIGHT - 12})`,
    );
    this.yLabel.attr(
      "transform",
      `translate(16,${MARGIN.top + this.innerHeight / 2}) rotate(-90)`,
    );
  }
}
