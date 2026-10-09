import { z } from "zod";

import type { Actor } from "@/modules/users/domain/types";

import type { ReportsRepository } from "../../data/repository";
import {
  addDays,
  bucketsBetween,
  parseISODate,
  toISODate,
  type Granularity,
} from "../dates";
import type { CategoryShare } from "./get-dashboard-data";

type Repos = { reports: ReportsRepository };

export const reportsFiltersSchema = z.object({
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

export type ReportsFilters = z.infer<typeof reportsFiltersSchema>;

export type ReportsData = {
  from: string;
  to: string;
  granularity: Granularity;
  totalCents: number;
  buckets: { bucket: string; totalCents: number }[];
  byCategory: CategoryShare[];
};

/** Default range: the last 6 full-ish months ending today. */
export function defaultRange(today: Date): { from: string; to: string } {
  const from = new Date(today);
  from.setMonth(from.getMonth() - 6);
  return { from: toISODate(from), to: toISODate(today) };
}

export async function getReportsData(
  repos: Repos,
  actor: Actor,
  filters: ReportsFilters,
  today: Date,
): Promise<ReportsData> {
  const fallback = defaultRange(today);
  const from = filters.from ?? fallback.from;
  const to = filters.to ?? fallback.to;
  const toExclusive = toISODate(addDays(parseISODate(to), 1));
  const granularity = filters.granularity;

  const [total, categorySums, periodSums] = await Promise.all([
    repos.reports.totalBetween(actor.profileId, from, toExclusive),
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
  ]);

  const totalsByBucket = new Map(periodSums.map((p) => [p.bucket, p.totalCents]));
  const buckets = bucketsBetween(from, to, granularity).map((bucket) => ({
    bucket,
    totalCents: totalsByBucket.get(bucket) ?? 0,
  }));

  return {
    from,
    to,
    granularity,
    totalCents: total.totalCents,
    buckets,
    byCategory: categorySums.map((c) => ({
      ...c,
      share: total.totalCents > 0 ? c.totalCents / total.totalCents : 0,
    })),
  };
}
