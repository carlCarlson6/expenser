import { describe, expect, it } from "vitest";

import {
  CHART_TYPES,
  DEFAULT_CHART,
  parseChartType,
  toCumulative,
} from "@/modules/reports/ui/chart";

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