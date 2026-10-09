/** Chart shapes offered by the dashboard panel. Presentation only: the pick
 *  never changes what the query aggregates, it only changes how it is drawn. */
export const CHART_TYPES = [
  "bar",
  "line",
  "area",
  "cumulative",
  "donut",
] as const;

export type ChartType = (typeof CHART_TYPES)[number];

export const DEFAULT_CHART: ChartType = "bar";

/** Time-series shapes. The donut plots category shares, not buckets. */
export type TrendVariant = Exclude<ChartType, "donut">;

export type ChartPoint = { label: string; value: number };

/** Narrows a raw `?chart=` search param to a known shape. */
export function parseChartType(value: string | string[] | undefined): ChartType {
  const raw = typeof value === "string" ? value : undefined;
  return CHART_TYPES.find((c) => c === raw) ?? DEFAULT_CHART;
}

/** Running total across the period, same length and order as `points`. */
export function toCumulative(points: ChartPoint[]): ChartPoint[] {
  let total = 0;
  return points.map((p) => {
    // Values are money: rounding to cents keeps the running total free of
    // binary float drift (0.1 + 0.2).
    total = Math.round((total + p.value) * 100) / 100;
    return { label: p.label, value: total };
  });
}