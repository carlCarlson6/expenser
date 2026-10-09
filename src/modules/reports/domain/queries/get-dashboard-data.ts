import { z } from "zod";

import type { ExpenseRepository } from "@/modules/expenses/data/repository";
import type { ExpenseWithCategory } from "@/modules/expenses/data/repository";
import type { Actor } from "@/modules/users/domain/types";

import type { ReportsRepository } from "../../data/repository";
import {
  addDays,
  bucketsBetween,
  parseISODate,
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

export { PRESETS, type Preset } from "../period";

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
  const days =
    Math.round(
      (parseISODate(toExclusive).getTime() - parseISODate(from).getTime()) /
        86_400_000,
    ) || 1;
  const previousFrom = toISODate(addDays(parseISODate(from), -days));

  const [current, previous, categorySums, periodSums, recent] =
    await Promise.all([
      repos.reports.totalBetween(
        actor.profileId,
        from,
        toExclusive,
        filters.categoryId,
      ),
      repos.reports.totalBetween(
        actor.profileId,
        previousFrom,
        from,
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
    ]);

  const totalsByBucket = new Map(periodSums.map((p) => [p.bucket, p.totalCents]));

  return {
    from,
    to,
    preset,
    granularity,
    categoryId: filters.categoryId,
    totalCents: current.totalCents,
    count: current.count,
    previousTotalCents: previous.totalCents,
    change:
      previous.totalCents > 0
        ? (current.totalCents - previous.totalCents) / previous.totalCents
        : null,
    dailyAvg: Math.round(current.totalCents / days),
    buckets: bucketsBetween(from, to, granularity).map((bucket) => ({
      bucket,
      totalCents: totalsByBucket.get(bucket) ?? 0,
    })),
    byCategory: categorySums.map((c) => ({
      ...c,
      share: current.totalCents > 0 ? c.totalCents / current.totalCents : 0,
    })),
    recent: recent.items,
  };
}
