/** Chart shapes offered by the dashboard panel. Presentation only: the pick
 *  never changes what the query aggregates, it only changes how it is drawn. */
export const CHART_TYPES = [
  "bar",
  "line",
  "area",
  "cumulative",
  "stacked",
  "donut",
  "heatmap",
] as const;

export type ChartType = (typeof CHART_TYPES)[number];

export const DEFAULT_CHART: ChartType = "bar";

/** Shapes that plot a series over the period's buckets. */
export type TrendVariant = Extract<
  ChartType,
  "bar" | "line" | "area" | "cumulative" | "stacked"
>;

/** Shapes that plot category shares rather than buckets. */
export const CATEGORY_CHARTS: ChartType[] = ["donut", "stacked"];

export type ChartPoint = { label: string; value: number };

/** A point carrying its baseline, for the previous-period overlay. */
export type ComparisonPoint = ChartPoint & {
  /** Baseline for the same position, or null where the baseline is absent. */
  comparison: number | null;
};

/** A fully-prepared trend point: everything the chart needs to draw it. */
export type TrendSeriesPoint = {
  label: string;
  value: number;
  comparison: number | null;
  average: number | null;
};

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

/**
 * Trailing moving average, which smooths the noise that makes daily bars
 * unreadable and exposes the direction of travel.
 *
 * The first `window - 1` points have no full window behind them and come back
 * `null`, so a chart can leave the gap rather than plot a rising stub that
 * would read as a real trend.
 */
export function toMovingAverage(
  points: ChartPoint[],
  window: number,
): (ChartPoint & { average: number | null })[] {
  if (window < 2) return points.map((p) => ({ ...p, average: null }));
  let sum = 0;
  return points.map((p, i) => {
    sum += p.value;
    if (i >= window) sum -= points[i - window].value;
    const count = Math.min(i + 1, window);
    return {
      ...p,
      // Same rounding as toCumulative: the inputs are money.
      average: i + 1 < window ? null : Math.round((sum / count) * 100) / 100,
    };
  });
}

/**
 * Default smoothing window per granularity. A single fixed size does not
 * transfer: 7 days is a readable weekly rhythm, but 7 *months* is a flat line.
 */
export function movingAverageWindow(
  granularity: "day" | "week" | "month",
): number {
  return granularity === "day" ? 7 : granularity === "week" ? 4 : 3;
}

/**
 * Zips a series with its baseline by position.
 *
 * The two windows are the same length, but a custom range can start mid-bucket
 * and produce one bucket fewer in the previous window — its leading partial
 * bucket never materializes. Shorter baselines are therefore padded at the
 * *front* with `null`, so the most recent points stay aligned and the missing
 * span renders as a gap. Padding with `0` instead would silently shift the
 * whole comparison by a bucket.
 */
export function alignComparison(
  points: ChartPoint[],
  baseline: ChartPoint[],
): ComparisonPoint[] {
  const offset = points.length - baseline.length;
  return points.map((p, i) => ({
    ...p,
    comparison: i >= offset ? baseline[i - offset].value : null,
  }));
}

/** Running total that treats `null` as a gap rather than a zero: the gap stays
 *  a gap, and accumulation restarts once real values resume after it. */
function cumulativeOrNull(values: (number | null)[]): (number | null)[] {
  let total: number | null = null;
  return values.map((v) => {
    if (v === null) return null;
    total = Math.round(((total ?? 0) + v) * 100) / 100;
    return total;
  });
}

/**
 * Builds the series a trend chart draws: the variant applied, the previous
 * period aligned alongside it, and the moving average on top.
 *
 * Order matters. Alignment comes first so the cumulative transform sees two
 * equal-length series and can accumulate both; the average is computed last so
 * it smooths whatever the user actually sees.
 */
export function buildTrendSeries(
  points: ChartPoint[],
  baseline: ChartPoint[],
  variant: TrendVariant,
  window: number,
): TrendSeriesPoint[] {
  const aligned = alignComparison(points, baseline);
  const isCumulative = variant === "cumulative";

  const shown = isCumulative
    ? toCumulative(points)
    : points.map((p) => ({ label: p.label, value: p.value }));
  // A cumulative baseline is the fair comparison: both curves then end at
  // their own period total.
  const comparison = isCumulative
    ? cumulativeOrNull(aligned.map((p) => p.comparison))
    : aligned.map((p) => p.comparison);
  const averages = toMovingAverage(shown, window);

  return shown.map((p, i) => ({
    label: p.label,
    value: p.value,
    comparison: comparison[i],
    average: averages[i].average,
  }));
}
