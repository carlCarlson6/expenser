import { describe, expect, it } from "vitest";

import {
  MAX_STACKED_CATEGORIES,
  OTHER_CATEGORY_ID,
  buildStacked,
} from "@/modules/reports/domain/stacked";

const row = (
  bucket: string,
  categoryId: string,
  totalCents: number,
  name = categoryId,
) => ({ bucket, categoryId, name, color: `#${categoryId}`, totalCents });

describe("buildStacked", () => {
  it("orders categories by total, largest first", () => {
    const out = buildStacked(
      [row("2026-10-01", "a", 100), row("2026-10-01", "b", 300)],
      ["2026-10-01"],
    );
    expect(out.categories.map((c) => c.categoryId)).toEqual(["b", "a"]);
    expect(out.categories.map((c) => c.totalCents)).toEqual([300, 100]);
  });

  it("breaks total ties by name so the chart does not reshuffle", () => {
    const out = buildStacked(
      [row("2026-10-01", "z", 100, "Zeta"), row("2026-10-01", "a", 100, "Alfa")],
      ["2026-10-01"],
    );
    expect(out.categories.map((c) => c.name)).toEqual(["Alfa", "Zeta"]);
  });

  it("gives every bucket a zero for every category", () => {
    // Recharts reads a missing key as a gap, which would punch holes in a
    // stacked bar instead of showing a shorter one.
    const out = buildStacked(
      [row("2026-10-01", "a", 100)],
      ["2026-10-01", "2026-10-02"],
    );
    expect(out.buckets).toEqual([
      { bucket: "2026-10-01", byCategory: { a: 100 } },
      { bucket: "2026-10-02", byCategory: { a: 0 } },
    ]);
  });

  it("keeps every bucket the query asked for, in order", () => {
    const out = buildStacked([], ["2026-10-01", "2026-10-02", "2026-10-03"]);
    expect(out.buckets.map((b) => b.bucket)).toEqual([
      "2026-10-01",
      "2026-10-02",
      "2026-10-03",
    ]);
    expect(out.categories).toEqual([]);
  });

  it("drops the value of rows outside the requested range", () => {
    // Defensive: the repository is queried with the same window as the
    // buckets, so this cannot happen in practice. If it ever did, the
    // category stays listed but contributes nothing to the rendered range.
    const out = buildStacked([row("2025-01-01", "a", 999)], ["2026-10-01"]);
    expect(out.categories.map((c) => c.categoryId)).toEqual(["a"]);
    expect(out.buckets).toEqual([
      { bucket: "2026-10-01", byCategory: { a: 0 } },
    ]);
  });

  it("sums a category split across buckets", () => {
    const out = buildStacked(
      [row("2026-10-01", "a", 100), row("2026-10-02", "a", 50)],
      ["2026-10-01", "2026-10-02"],
    );
    expect(out.categories[0].totalCents).toBe(150);
    expect(out.buckets.map((b) => b.byCategory.a)).toEqual([100, 50]);
  });

  it("folds the tail beyond the cap into a single other category", () => {
    const rows = Array.from({ length: MAX_STACKED_CATEGORIES + 3 }, (_, i) =>
      row("2026-10-01", `c${i}`, (MAX_STACKED_CATEGORIES + 3 - i) * 10),
    );
    const out = buildStacked(rows, ["2026-10-01"]);

    expect(out.categories).toHaveLength(MAX_STACKED_CATEGORIES + 1);
    const other = out.categories.at(-1)!;
    expect(other.categoryId).toBe(OTHER_CATEGORY_ID);
    // The three dropped categories hold 30 + 20 + 10.
    expect(other.totalCents).toBe(60);
    expect(out.buckets[0].byCategory[OTHER_CATEGORY_ID]).toBe(60);
    // The total is preserved across the rollup.
    const sum = Object.values(out.buckets[0].byCategory).reduce((a, b) => a + b, 0);
    expect(sum).toBe(rows.reduce((a, r) => a + r.totalCents, 0));
  });

  it("omits the other category entirely when everything fits", () => {
    const rows = Array.from({ length: MAX_STACKED_CATEGORIES }, (_, i) =>
      row("2026-10-01", `c${i}`, (i + 1) * 10),
    );
    const out = buildStacked(rows, ["2026-10-01"]);
    expect(out.categories).toHaveLength(MAX_STACKED_CATEGORIES);
    expect(
      out.categories.some((c) => c.categoryId === OTHER_CATEGORY_ID),
    ).toBe(false);
  });

  it("leaves the other category nameless for the UI to localize", () => {
    const rows = Array.from({ length: MAX_STACKED_CATEGORIES + 1 }, (_, i) =>
      row("2026-10-01", `c${i}`, 10),
    );
    const out = buildStacked(rows, ["2026-10-01"]);
    const other = out.categories.find((c) => c.categoryId === OTHER_CATEGORY_ID)!;
    expect(other.name).toBe("");
    expect(other.color).toMatch(/^#/);
  });

  it("handles an empty result", () => {
    expect(buildStacked([], [])).toEqual({ categories: [], buckets: [] });
  });
});
