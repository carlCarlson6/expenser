import { z } from "zod";

import type { ExpenseRepository } from "@/modules/expenses/data/repository";
import type { ExpenseWithCategory } from "@/modules/expenses/data/repository";
import type { Actor } from "@/modules/users/domain/types";

import type { ReportsRepository } from "../../data/repository";
import {
  addDays,
  bucketsBetween,
  parseISODate,
  previousRange,
  toISODate,
  type Granularity,
} from "../dates";
import {
  DEFAULT_PRESET,
  detectPreset,
  presetGranularity,
  presetRange,
  type Preset,
} from "../period";
import { buildStacked, type StackedData } from "../stacked";

export { PRESETS, type Preset } from "../period";
export {
  MAX_STACKED_CATEGORIES,
  OTHER_CATEGORY_ID,
  type StackedData,
} from "../stacked";

type Repos = {
  reports: ReportsRepository;
  expenses: ExpenseRepository;
};

export type CategoryShare = {
  categoryId: string;
  name: string;
  color: string;
  totalCents: number;
  share: number;
};

/** One day of the period, for the calendar heatmap. */
export type DailyTotal = { date: string; totalCents: number };

export const dashboardFiltersSchema = z.object({
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  // Undefined means "no explicit choice": the period picks its own bucket
  // size (see `presetGranularity`), and junk values fall back to that too.
  granularity: z.enum(["day", "week", "month"]).optional().catch(undefined),
  categoryId: z.uuid().optional(),
});

export type DashboardFilters = z.infer<typeof dashboardFiltersSchema>;

export type DashboardData = {
  from: string;
  to: string;
  preset: Preset;
  granularity: Granularity;
  categoryId?: string;
  totalCents: number;
  count: number;
  previousTotalCents: number;
  /** Fractional change vs. the previous period of equal length, or null. */
  change: number | null;
  dailyAvg: number;
  buckets: { bucket: string; totalCents: number }[];
  /** Same window, shifted back one period: the chart's comparison baseline. */
  previousBuckets: { bucket: string; totalCents: number }[];
  /** Daily totals, for the calendar heatmap. Equals `buckets` when the
   *  granularity is already a day — the heatmap must not change what the
   *  query aggregates, so its series is always present. */
  daily: DailyTotal[];
  stacked: StackedData;
  byCategory: CategoryShare[];
  recent: ExpenseWithCategory[];
};

export async function getDashboardData(
  repos: Repos,
  actor: Actor,
  filters: DashboardFilters,
  today: Date,
): Promise<DashboardData> {
  const fallback = presetRange(DEFAULT_PRESET, today);
  const from = filters.from ?? fallback.from;
  const to = filters.to ?? fallback.to;
  const toExclusive = toISODate(addDays(parseISODate(to), 1));
  const preset = detectPreset(from, to, today);
  // The period picks its own bucket size; an explicit choice always wins.
  const granularity = filters.granularity ?? presetGranularity(preset);

  // Previous window: same length, immediately before.
  const previous = previousRange(from, toExclusive);
  const days =
    Math.round(
      (parseISODate(toExclusive).getTime() - parseISODate(from).getTime()) /
        86_400_000,
    ) || 1;

  const buckets = bucketsBetween(from, to, granularity);
  const previousBucketKeys = bucketsBetween(
    previous.from,
    previous.toInclusive,
    granularity,
  );

  const [current, previousTotal, categorySums, periodSums, recent, previousSums, dailySums, periodCategorySums] =
    await Promise.all([
      repos.reports.totalBetween(
        actor.profileId,
        from,
        toExclusive,
        filters.categoryId,
      ),
      repos.reports.totalBetween(
        actor.profileId,
        previous.from,
        previous.toExclusive,
        filters.categoryId,
      ),
      repos.reports.sumByCategory(
        actor.profileId,
        from,
        toExclusive,
        filters.categoryId,
      ),
      repos.reports.sumByPeriod(
        actor.profileId,
        from,
        toExclusive,
        granularity,
        filters.categoryId,
      ),
      // Recent list ignores the category filter: it is a shortcut to the
      // full expense list, not part of the aggregation.
      repos.expenses.list(actor.profileId, { page: 1, pageSize: 5 }),
      repos.reports.sumByPeriod(
        actor.profileId,
        previous.from,
        previous.toExclusive,
        granularity,
        filters.categoryId,
      ),
      // Only queried when the current buckets are not already daily.
      granularity === "day"
        ? Promise.resolve([])
        : repos.reports.sumByPeriod(
            actor.profileId,
            from,
            toExclusive,
            "day",
            filters.categoryId,
          ),
      repos.reports.sumByPeriodAndCategory(
        actor.profileId,
        from,
        toExclusive,
        granularity,
        filters.categoryId,
      ),
    ]);

  const totalsByBucket = new Map(periodSums.map((p) => [p.bucket, p.totalCents]));
  const filledBuckets = buckets.map((bucket) => ({
    bucket,
    totalCents: totalsByBucket.get(bucket) ?? 0,
  }));

  // The heatmap always needs days; at daily granularity `buckets` already is
  // that series, so the extra round-trip is skipped.
  const dailyTotals = new Map(dailySums.map((d) => [d.bucket, d.totalCents]));
  const daily =
    granularity === "day"
      ? filledBuckets.map((b) => ({
          date: b.bucket,
          totalCents: b.totalCents,
        }))
      : bucketsBetween(from, to, "day").map((date) => ({
          date,
          totalCents: dailyTotals.get(date) ?? 0,
        }));

  const previousTotals = new Map(
    previousSums.map((p) => [p.bucket, p.totalCents]),
  );

  return {
    from,
    to,
    preset,
    granularity,
    categoryId: filters.categoryId,
    totalCents: current.totalCents,
    count: current.count,
    previousTotalCents: previousTotal.totalCents,
    change:
      previousTotal.totalCents > 0
        ? (current.totalCents - previousTotal.totalCents) / previousTotal.totalCents
        : null,
    dailyAvg: Math.round(current.totalCents / days),
    buckets: filledBuckets,
    previousBuckets: previousBucketKeys.map((bucket) => ({
      bucket,
      totalCents: previousTotals.get(bucket) ?? 0,
    })),
    daily,
    stacked: buildStacked(periodCategorySums, buckets),
    byCategory: categorySums.map((c) => ({
      ...c,
      share: current.totalCents > 0 ? c.totalCents / current.totalCents : 0,
    })),
    recent: recent.items,
  };
}
