import { describe, expect, it } from "vitest";

import { createExpense } from "@/modules/expenses/domain/commands/create-expense";
import { getDashboardData } from "@/modules/reports/domain/queries/get-dashboard-data";
import type { DashboardFilters } from "@/modules/reports/domain/queries/get-dashboard-data";

import { categoryNamed, createTestDb } from "@test/integration/shared/db/fixtures";

const { repos, createActor } = createTestDb();

const today = new Date(2026, 9, 9); // 2026-10-09

/** Expenses the seeded tenant starts with; "food"/"fun" map to its default
 *  "Supermercado"/"Ocio" categories. */
type SeedExpense = {
  amount: number;
  category: "food" | "fun";
  spentAt: string;
};

/** Provisions a tenant, seeds the given expenses, and returns a runner bound
 *  to that tenant. */
async function setup(expenses: SeedExpense[] = []) {
  const actor = await createActor();
  const foodId = (await categoryNamed(repos, actor, "Supermercado")).id;
  const funId = (await categoryNamed(repos, actor, "Ocio")).id;

  for (const expense of expenses) {
    await createExpense(repos, actor, {
      amount: expense.amount,
      categoryId: expense.category === "food" ? foodId : funId,
      spentAt: expense.spentAt,
    });
  }

  return {
    foodId,
    funId,
    run: (filters: DashboardFilters) =>
      getDashboardData(repos, actor, filters, today),
  };
}

describe("getDashboardData", () => {
  it("defaults to this month, grouped by day", async () => {
    const { run } = await setup();

    const data = await run({});

    expect(data.from).toBe("2026-10-01");
    expect(data.to).toBe("2026-10-09");
    expect(data.preset).toBe("month");
    expect(data.granularity).toBe("day");
    // 9 buckets: Oct 1..Oct 9, one per day.
    expect(data.buckets).toHaveLength(9);
  });

  it("keeps an explicitly requested granularity", async () => {
    const { run } = await setup();

    const data = await run({ granularity: "week" });

    expect(data.granularity).toBe("week");
  });

  it("reports the category shares of the period total", async () => {
    const { foodId, funId, run } = await setup([
      { amount: 1000, category: "food", spentAt: "2026-10-05" },
      { amount: 500, category: "fun", spentAt: "2026-10-06" },
    ]);

    const data = await run({ granularity: "month" });

    expect(data.byCategory.map((c) => c.categoryId)).toEqual([foodId, funId]);
    expect(data.byCategory[0].share).toBeCloseTo(1000 / 1500);
    expect(data.byCategory[1].share).toBeCloseTo(500 / 1500);
  });

  it("computes the change against the previous period of equal length", async () => {
    const { run } = await setup([
      { amount: 1500, category: "food", spentAt: "2026-10-05" },
      { amount: 500, category: "fun", spentAt: "2026-09-25" },
    ]);

    const data = await run({});

    expect(data.change).toBe(2); // 1500 vs 500
    // The default window spans 9 days (Oct 1..Oct 9).
    expect(data.dailyAvg).toBe(Math.round(1500 / 9));
  });

  it("returns a null change when the previous period is empty", async () => {
    const { run } = await setup([
      { amount: 800, category: "food", spentAt: "2026-10-05" },
    ]);

    const data = await run({ granularity: "month" });

    expect(data.change).toBeNull();
    expect(data.previousTotalCents).toBe(0);
  });

  it("reports a negative change when spending dropped", async () => {
    const { run } = await setup([
      { amount: 250, category: "food", spentAt: "2026-10-05" },
      { amount: 500, category: "fun", spentAt: "2026-09-25" },
    ]);

    const data = await run({ granularity: "month" });

    expect(data.change).toBe(-0.5);
  });

  it("respects an explicit custom range", async () => {
    const { run } = await setup();

    const data = await run({
      from: "2026-09-01",
      to: "2026-09-30",
      granularity: "day",
    });

    expect(data.from).toBe("2026-09-01");
    expect(data.to).toBe("2026-09-30");
    expect(data.buckets).toHaveLength(30);
    expect(data.preset).toBe("custom");
  });

  it("detects the preset that matches a range", async () => {
    const { run } = await setup();

    const month = await run({
      from: "2026-10-01",
      to: "2026-10-09",
      granularity: "month",
    });
    expect(month.preset).toBe("month");

    const thirty = await run({
      from: "2026-09-10",
      to: "2026-10-09",
      granularity: "month",
    });
    expect(thirty.preset).toBe("30d");
  });

  it("fills gaps in the bucket series with zeroes", async () => {
    const { run } = await setup([
      { amount: 1500, category: "food", spentAt: "2026-10-01" },
    ]);

    const data = await run({
      from: "2026-10-01",
      to: "2026-10-09",
      granularity: "day",
    });

    expect(data.buckets).toHaveLength(9);
    expect(data.buckets[0].totalCents).toBe(1500);
    expect(data.buckets[8].totalCents).toBe(0);
  });

  it("scopes every aggregate to the selected category", async () => {
    const { funId, run } = await setup([
      { amount: 1000, category: "food", spentAt: "2026-10-05" },
      { amount: 500, category: "fun", spentAt: "2026-10-06" },
    ]);

    const data = await run({ granularity: "month", categoryId: funId });

    expect(data.categoryId).toBe(funId);
    expect(data.totalCents).toBe(500);
    expect(data.byCategory).toHaveLength(1);
    expect(data.byCategory[0].name).toBe("Ocio");
  });

  it("buckets the previous window for the comparison overlay", async () => {
    const { run } = await setup([
      { amount: 500, category: "fun", spentAt: "2026-09-22" },
    ]);

    const data = await run({});

    // The previous window is 9 days ending the day before Oct 1.
    expect(data.previousBuckets).toHaveLength(9);
    expect(data.previousBuckets[0].bucket).toBe("2026-09-22");
    expect(data.previousBuckets[0].totalCents).toBe(500);
    expect(data.previousBuckets.at(-1)!.totalCents).toBe(0);
  });

  it("keeps the current and previous buckets the same length on a preset", async () => {
    const { run } = await setup([
      { amount: 500, category: "food", spentAt: "2026-10-05" },
    ]);

    for (const granularity of ["day", "week", "month"] as const) {
      const data = await run({ granularity });
      expect(data.previousBuckets).toHaveLength(data.buckets.length);
    }
  });

  it("fills the daily series from the buckets when already grouped by day", async () => {
    const { run } = await setup([
      { amount: 1500, category: "food", spentAt: "2026-10-01" },
    ]);

    const data = await run({ granularity: "day" });

    expect(data.daily.map((d) => d.date)).toEqual(
      data.buckets.map((b) => b.bucket),
    );
    expect(data.daily[0].totalCents).toBe(1500);
  });

  it("queries a separate daily series when the buckets are coarser", async () => {
    // The heatmap needs days regardless of the grouping, and the chart shape
    // must not drive what the query aggregates — so the series is always there.
    const { run } = await setup([
      { amount: 1500, category: "food", spentAt: "2026-10-01" },
    ]);

    const data = await run({ granularity: "week" });

    expect(data.daily).toHaveLength(9);
    expect(data.buckets.length).toBeLessThan(9);
    expect(data.daily[0]).toEqual({ date: "2026-10-01", totalCents: 1500 });
    // Gaps the daily query did not report come back as zeroes.
    expect(data.daily.at(-1)!.totalCents).toBe(0);
  });

  it("builds the stacked matrix over the same buckets", async () => {
    const { foodId, funId, run } = await setup([
      { amount: 1000, category: "food", spentAt: "2026-10-01" },
      { amount: 500, category: "fun", spentAt: "2026-10-01" },
    ]);

    const data = await run({ granularity: "day" });

    expect(data.stacked.buckets).toHaveLength(data.buckets.length);
    expect(data.stacked.categories.map((c) => c.categoryId)).toEqual([
      foodId,
      funId,
    ]);
    expect(data.stacked.buckets[0].byCategory).toEqual({
      [foodId]: 1000,
      [funId]: 500,
    });
    expect(data.stacked.buckets[1].byCategory).toEqual({
      [foodId]: 0,
      [funId]: 0,
    });
  });
});
