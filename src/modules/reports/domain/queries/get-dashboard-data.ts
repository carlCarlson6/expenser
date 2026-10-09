import type { ExpenseRepository } from "@/modules/expenses/data/repository";
import type { ExpenseWithCategory } from "@/modules/expenses/data/repository";
import type { Actor } from "@/modules/users/domain/types";

import type { ReportsRepository } from "../../data/repository";
import {
  addDays,
  addMonths,
  bucketsBetween,
  monthRange,
  toISODate,
} from "../dates";

type Repos = {
  reports: ReportsRepository;
  expenses: ExpenseRepository;
};

export type CategoryShare = {
  categoryId: string;
  name: string;
  totalCents: number;
  share: number;
};

export type DashboardData = {
  thisMonthTotal: number;
  lastMonthTotal: number;
  count: number;
  dailyAvg: number;
  byCategory: CategoryShare[];
  trend: { bucket: string; totalCents: number }[];
  recent: ExpenseWithCategory[];
};

export async function getDashboardData(
  repos: Repos,
  actor: Actor,
  today: Date,
): Promise<DashboardData> {
  const thisMonth = monthRange(today);
  const lastMonth = monthRange(addMonths(today, -1));
  // bucketsBetween aligns the start to the 1st of the month, so this yields
  // exactly 6 monthly buckets ending this month.
  const trendFrom = toISODate(addMonths(today, -5));
  const tomorrow = toISODate(addDays(today, 1));

  const [current, previous, categorySums, periodSums, recent] =
    await Promise.all([
      repos.reports.totalBetween(actor.profileId, thisMonth.from, thisMonth.toExclusive),
      repos.reports.totalBetween(actor.profileId, lastMonth.from, lastMonth.toExclusive),
      repos.reports.sumByCategory(actor.profileId, thisMonth.from, thisMonth.toExclusive),
      repos.reports.sumByPeriod(actor.profileId, trendFrom, tomorrow, "month"),
      repos.expenses.list(actor.profileId, { page: 1, pageSize: 5 }),
    ]);

  const byCategory: CategoryShare[] = categorySums.map((c) => ({
    ...c,
    share: current.totalCents > 0 ? c.totalCents / current.totalCents : 0,
  }));

  const totalsByBucket = new Map(periodSums.map((p) => [p.bucket, p.totalCents]));
  const trend = bucketsBetween(trendFrom, toISODate(today), "month").map(
    (bucket) => ({ bucket, totalCents: totalsByBucket.get(bucket) ?? 0 }),
  );

  return {
    thisMonthTotal: current.totalCents,
    lastMonthTotal: previous.totalCents,
    count: current.count,
    dailyAvg: Math.round(current.totalCents / today.getDate()),
    byCategory,
    trend,
    recent: recent.items,
  };
}
