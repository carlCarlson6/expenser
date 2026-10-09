import { describe, expect, it } from "vitest";

import { getDashboardData } from "@/modules/reports/domain/queries/get-dashboard-data";
import { parsePreset, presetGranularity } from "@/modules/reports/domain/period";

const actor = {
  profileId: "p1",
  clerkUserId: "clerk-1",
  locale: "es",
  currency: "EUR",
};

const today = new Date(2026, 9, 9); // 2026-10-09

/** The default range starts here, so the query's *previous* period call is
 *  the one with an earlier `from`. */
const DEFAULT_FROM = "2026-10-01";

type TotalBetween = (
  profileId: string,
  from: string,
  toExclusive: string,
  categoryId?: string,
) => Promise<{ totalCents: number; count: number }>;

type SumByPeriod = (
  profileId: string,
  from: string,
  toExclusive: string,
  granularity: "day" | "week" | "month",
  categoryId?: string,
) => Promise<{ bucket: string; totalCents: number }[]>;

function repoStub(
  current: { totalCents: number; count: number },
  previous: { totalCents: number; count: number },
  periodData: {
    current?: { bucket: string; totalCents: number }[];
    previous?: { bucket: string; totalCents: number }[];
  } = {},
) {
  const totalBetween: TotalBetween = async (_profileId, from) =>
    from === DEFAULT_FROM ? current : previous;

  // The query now asks for the current window, the previous one, and (when
  // the buckets are not already daily) a daily series. `toExclusive` tells
  // the first two apart: only the previous window ends where this one starts.
  const sumByPeriod: SumByPeriod = async (
    _profileId,
    from,
    toExclusive,
    granularity,
  ) => {
    if (from === DEFAULT_FROM) {
      return periodData.current ?? [{ bucket: "2026-10-01", totalCents: 1500 }];
    }
    if (toExclusive === DEFAULT_FROM) {
      return (
        periodData.previous ?? [{ bucket: "2026-09-22", totalCents: 500 }]
      );
    }
    // A third window means the daily side series.
    return granularity === "day"
      ? [{ bucket: DEFAULT_FROM, totalCents: 1500 }]
      : [];
  };

  return {
    reports: {
      totalBetween,
      sumByCategory: async () => [
        { categoryId: "c1", name: "Supermercado", color: "#111111", totalCents: 1000 },
        { categoryId: "c2", name: "Ocio", color: "#222222", totalCents: 500 },
      ],
      sumByPeriod,
      sumByPeriodAndCategory: async () => [
        {
          bucket: "2026-10-01",
          categoryId: "c1",
          name: "Supermercado",
          color: "#111111",
          totalCents: 1000,
        },
        {
          bucket: "2026-10-01",
          categoryId: "c2",
          name: "Ocio",
          color: "#222222",
          totalCents: 500,
        },
      ],
    },
    expenses: {
      list: async () => ({ items: [], totalCount: 0 }),
    },
  };
}

/** Default repo: current period 1500, previous period 500. */
const defaultRepos = () =>
  repoStub({ totalCents: 1500, count: 6 }, { totalCents: 500, count: 2 });

async function run(
  filters: Parameters<typeof getDashboardData>[2],
  repos = defaultRepos(),
) {
  return getDashboardData(repos as never, actor, filters, today);
}

describe("parsePreset", () => {
  it("falls back to this month for missing or unknown values", () => {
    expect(parsePreset(undefined)).toBe("month");
    expect(parsePreset(["6m", "12m"])).toBe("month");
    expect(parsePreset("yesterday")).toBe("month");
  });

  it("never returns custom, which is expressed as explicit dates", () => {
    expect(parsePreset("custom")).toBe("month");
  });

  it("keeps a known preset", () => {
    expect(parsePreset("12m")).toBe("12m");
  });
});

describe("presetGranularity", () => {
  it("keeps every preset above a single bucket", () => {
    expect(presetGranularity("month")).toBe("day");
    expect(presetGranularity("30d")).toBe("day");
    expect(presetGranularity("6m")).toBe("week");
    expect(presetGranularity("12m")).toBe("month");
    expect(presetGranularity("custom")).toBe("day");
  });
});

describe("getDashboardData", () => {
  it("defaults to this month, grouped by day", async () => {
    const data = await run({});
    expect(data.from).toBe("2026-10-01");
    expect(data.to).toBe("2026-10-09");
    expect(data.preset).toBe("month");
    expect(data.granularity).toBe("day");
    // 9 buckets: Oct 1..Oct 9, one per day.
    expect(data.buckets).toHaveLength(9);
  });

  it("keeps an explicitly requested granularity", async () => {
    const data = await run({ granularity: "week" });
    expect(data.granularity).toBe("week");
  });

  it("reports the category shares of the period total", async () => {
    const data = await run({ granularity: "month" });
    expect(data.byCategory[0].share).toBeCloseTo(1000 / 1500);
    expect(data.byCategory[1].share).toBeCloseTo(500 / 1500);
  });

  it("computes the change against the previous period of equal length", async () => {
    const data = await run({});
    expect(data.change).toBe(2); // 1500 vs 500
    // The default window spans 9 days (Oct 1..Oct 9).
    expect(data.dailyAvg).toBe(Math.round(1500 / 9));
  });

  it("returns a null change when the previous period is empty", async () => {
    const data = await run(
      { granularity: "month" },
      repoStub({ totalCents: 800, count: 1 }, { totalCents: 0, count: 0 }),
    );
    expect(data.change).toBeNull();
    expect(data.previousTotalCents).toBe(0);
  });

  it("reports a negative change when spending dropped", async () => {
    const data = await run(
      { granularity: "month" },
      repoStub({ totalCents: 250, count: 1 }, { totalCents: 500, count: 2 }),
    );
    expect(data.change).toBe(-0.5);
  });

  it("respects an explicit custom range", async () => {
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
    const month = await run({ from: "2026-10-01", to: "2026-10-09", granularity: "month" });
    expect(month.preset).toBe("month");

    const thirty = await run({ from: "2026-09-10", to: "2026-10-09", granularity: "month" });
    expect(thirty.preset).toBe("30d");
  });

  it("fills gaps in the bucket series with zeroes", async () => {
    const data = await run({
      from: "2026-10-01",
      to: "2026-10-09",
      granularity: "day",
    });
    expect(data.buckets).toHaveLength(9);
    expect(data.buckets[0].totalCents).toBe(1500);
    expect(data.buckets[8].totalCents).toBe(0);
  });

  it("passes the category filter through to the repository", async () => {
    const seen: (string | undefined)[] = [];
    const repos = defaultRepos();
    const original = repos.reports.totalBetween;
    repos.reports.totalBetween = async (profileId, from, toEx, categoryId) => {
      seen.push(categoryId);
      return original(profileId, from, toEx);
    };
    await run({ granularity: "month", categoryId: "cat-1" }, repos);
    expect(seen.length).toBeGreaterThan(0);
    expect(seen.every((c) => c === "cat-1")).toBe(true);
  });

  it("buckets the previous window for the comparison overlay", async () => {
    const data = await run({});
    // The previous window is 9 days ending the day before Oct 1.
    expect(data.previousBuckets).toHaveLength(9);
    expect(data.previousBuckets[0].bucket).toBe("2026-09-22");
    expect(data.previousBuckets[0].totalCents).toBe(500);
    expect(data.previousBuckets.at(-1)!.totalCents).toBe(0);
  });

  it("keeps the current and previous buckets the same length on a preset", async () => {
    for (const granularity of ["day", "week", "month"] as const) {
      const data = await run({ granularity });
      expect(data.previousBuckets).toHaveLength(data.buckets.length);
    }
  });

  it("fills the daily series from the buckets when already grouped by day", async () => {
    const data = await run({ granularity: "day" });
    expect(data.daily.map((d) => d.date)).toEqual(
      data.buckets.map((b) => b.bucket),
    );
    expect(data.daily[0].totalCents).toBe(1500);
  });

  it("queries a separate daily series when the buckets are coarser", async () => {
    // The heatmap needs days regardless of the grouping, and the chart shape
    // must not drive what the query aggregates — so the series is always there.
    const data = await run({ granularity: "week" });
    expect(data.daily).toHaveLength(9);
    expect(data.buckets.length).toBeLessThan(9);
    expect(data.daily[0]).toEqual({ date: "2026-10-01", totalCents: 1500 });
    // Gaps the daily query did not report come back as zeroes.
    expect(data.daily.at(-1)!.totalCents).toBe(0);
  });

  it("builds the stacked matrix over the same buckets", async () => {
    const data = await run({ granularity: "day" });
    expect(data.stacked.buckets).toHaveLength(data.buckets.length);
    expect(data.stacked.categories.map((c) => c.categoryId)).toEqual(["c1", "c2"]);
    expect(data.stacked.buckets[0].byCategory).toEqual({ c1: 1000, c2: 500 });
    expect(data.stacked.buckets[1].byCategory).toEqual({ c1: 0, c2: 0 });
  });
});
