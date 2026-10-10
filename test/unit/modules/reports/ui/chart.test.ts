import { describe, expect, it } from "vitest";

import {
  CHART_TYPES,
  DEFAULT_CHART,
  alignComparison,
  buildTrendSeries,
  movingAverageWindow,
  parseChartType,
  toCumulative,
  toMovingAverage,
  type ChartPoint,
} from "@/modules/reports/ui/chart";

const points = (...values: number[]): ChartPoint[] =>
  values.map((value, i) => ({ label: `p${i}`, value }));

describe("parseChartType", () => {
  it("accepts every known shape", () => {
    for (const c of CHART_TYPES) expect(parseChartType(c)).toBe(c);
  });

  it("falls back to bars for unknown or missing values", () => {
    expect(parseChartType("pie")).toBe(DEFAULT_CHART);
    expect(parseChartType(undefined)).toBe(DEFAULT_CHART);
    // Next hands repeated params over as an array.
    expect(parseChartType(["line", "area"])).toBe(DEFAULT_CHART);
  });
});

describe("toCumulative", () => {
  it("accumulates values in order", () => {
    expect(
      toCumulative([
        { label: "Jan", value: 10 },
        { label: "Feb", value: 5 },
        { label: "Mar", value: 0 },
        { label: "Apr", value: 2 },
      ]),
    ).toEqual([
      { label: "Jan", value: 10 },
      { label: "Feb", value: 15 },
      { label: "Mar", value: 15 },
      { label: "Apr", value: 17 },
    ]);
  });

  it("keeps the series length and labels", () => {
    const points = [
      { label: "a", value: 1 },
      { label: "b", value: 1 },
    ];
    const out = toCumulative(points);
    expect(out).toHaveLength(points.length);
    expect(out.map((p) => p.label)).toEqual(["a", "b"]);
  });

  it("does not drift on fractional values", () => {
    expect(
      toCumulative([
        { label: "a", value: 0.1 },
        { label: "b", value: 0.2 },
      ])[1].value,
    ).toBe(0.3);
  });

  it("returns an empty series untouched", () => {
    expect(toCumulative([])).toEqual([]);
  });
});

describe("toMovingAverage", () => {
  it("averages each trailing window", () => {
    const out = toMovingAverage(points(2, 4, 6, 8), 2);
    expect(out.map((p) => p.average)).toEqual([null, 3, 5, 7]);
  });

  it("leaves the first points null until a full window exists", () => {
    const out = toMovingAverage(points(1, 1, 1), 3);
    expect(out.map((p) => p.average)).toEqual([null, null, 1]);
  });

  it("returns all nulls when the series is shorter than the window", () => {
    expect(toMovingAverage(points(5, 5), 4).every((p) => p.average === null)).toBe(
      true,
    );
  });

  it("keeps the original values and labels alongside the average", () => {
    const out = toMovingAverage(points(2, 4), 2);
    expect(out.map((p) => p.value)).toEqual([2, 4]);
    expect(out.map((p) => p.label)).toEqual(["p0", "p1"]);
  });

  it("does not drift on fractional values", () => {
    expect(toMovingAverage(points(0.1, 0.2), 2)[1].average).toBe(0.15);
  });

  it("treats a window below 2 as disabled", () => {
    expect(toMovingAverage(points(1, 2, 3), 1).every((p) => p.average === null)).toBe(
      true,
    );
  });

  it("handles an empty series", () => {
    expect(toMovingAverage([], 3)).toEqual([]);
  });
});

describe("movingAverageWindow", () => {
  it("smooths less as the buckets get wider", () => {
    expect(movingAverageWindow("day")).toBe(7);
    expect(movingAverageWindow("week")).toBe(4);
    expect(movingAverageWindow("month")).toBe(3);
  });
});

describe("alignComparison", () => {
  it("pairs equal-length series by position", () => {
    const out = alignComparison(points(1, 2, 3), points(7, 8, 9));
    expect(out.map((p) => p.comparison)).toEqual([7, 8, 9]);
  });

  it("pads a short baseline at the front with null, never zero", () => {
    // A custom range can produce one bucket fewer in the previous window.
    // Zero-padding would silently shift every later comparison by a bucket.
    const out = alignComparison(points(1, 2, 3), points(8, 9));
    expect(out.map((p) => p.comparison)).toEqual([null, 8, 9]);
  });

  it("keeps the tails aligned when the baseline is longer", () => {
    const out = alignComparison(points(1, 2), points(6, 7, 8));
    expect(out.map((p) => p.comparison)).toEqual([7, 8]);
  });

  it("leaves every comparison null without a baseline", () => {
    const out = alignComparison(points(1, 2), []);
    expect(out.map((p) => p.comparison)).toEqual([null, null]);
  });
});

describe("buildTrendSeries", () => {
  it("carries value, baseline and average together", () => {
    const out = buildTrendSeries(points(2, 4, 6), points(1, 1, 1), "line", 2);
    expect(out).toEqual([
      { label: "p0", value: 2, comparison: 1, average: null },
      { label: "p1", value: 4, comparison: 1, average: 3 },
      { label: "p2", value: 6, comparison: 1, average: 5 },
    ]);
  });

  it("accumulates both curves on the cumulative variant", () => {
    const out = buildTrendSeries(points(1, 2, 3), points(10, 20, 30), "cumulative", 2);
    expect(out.map((p) => p.value)).toEqual([1, 3, 6]);
    expect(out.map((p) => p.comparison)).toEqual([10, 30, 60]);
  });

  it("keeps a front gap a gap through the cumulative transform", () => {
    const out = buildTrendSeries(points(1, 2, 3), points(5, 6), "cumulative", 3);
    expect(out.map((p) => p.comparison)).toEqual([null, 5, 11]);
  });

  it("smooths the value the chart actually shows", () => {
    // On the cumulative variant the average must track the running total
    // [10, 10, 10], not the raw daily values [10, 0, 0] whose average
    // would be 5.
    const out = buildTrendSeries(points(10, 0, 0), points(1, 1, 1), "cumulative", 2);
    expect(out.map((p) => p.value)).toEqual([10, 10, 10]);
    expect(out.map((p) => p.average)).toEqual([null, 10, 10]);
  });
});