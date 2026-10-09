import { z } from "zod";

import type { ExpenseRepository } from "@/modules/expenses/data/repository";
import type { ExpenseWithCategory } from "@/modules/expenses/data/repository";
import type { Actor } from "@/modules/users/domain/types";

import type { ReportsRepository } from "../../data/repository";
import {
  addDays,
  addMonths,
  bucketsBetween,
  parseISODate,
  toISODate,
  type Granularity,
} from "../dates";

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

export const PRESETS = ["30d", "6m", "12m", "month", "custom"] as const;
export type Preset = (typeof PRESETS)[number];

export const dashboardFiltersSchema = z.object({
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  granularity: z.enum(["day", "week", "month"]).catch("month"),
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

/** Default window: the last 6 months, which is also the trend chart span. */
export function presetRange(
  preset: Preset,
  today: Date,
): { from: string; to: string } {
  const to = toISODate(today);
  switch (preset) {
    case "30d":
      return { from: toISODate(addDays(today, -29)), to };
    case "12m":
      return { from: toISODate(addMonths(today, -12)), to };
    case "month":
      return { from: toISODate(new Date(today.getFullYear(), today.getMonth(), 1)), to };
    case "custom":
    case "6m":
      return { from: toISODate(addMonths(today, -6)), to };
  }
}

/** Detects which preset a range corresponds to (for the UI's active state). */
export function detectPreset(
  from: string,
  to: string,
  today: Date,
): Preset {
  const found = PRESETS.find((p) => {
    if (p === "custom") return false;
    const range = presetRange(p, today);
    return range.from === from && range.to === to;
  });
  return found ?? "custom";
}

export async function getDashboardData(
  repos: Repos,
  actor: Actor,
  filters: DashboardFilters,
  today: Date,
): Promise<DashboardData> {
  const fallback = presetRange("6m", today);
  const from = filters.from ?? fallback.from;
  const to = filters.to ?? fallback.to;
  const toExclusive = toISODate(addDays(parseISODate(to), 1));
  const granularity = filters.granularity;

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
    preset: detectPreset(from, to, today),
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
