import { and, eq, gte, lt, sql } from "drizzle-orm";

import { categories } from "@/modules/categories/data/schema";
import { expenses } from "@/modules/expenses/data/schema";
import type { Db } from "@/shared/db/client";

import type { Granularity } from "../domain/dates";

export type CategorySum = {
  categoryId: string;
  name: string;
  color: string;
  totalCents: number;
};

export type PeriodSum = { bucket: string; totalCents: number };

/** A bucket's total split across the categories that contributed to it. */
export type PeriodCategorySum = PeriodSum & {
  categoryId: string;
  name: string;
  color: string;
};

export interface ReportsRepository {
  totalBetween(
    profileId: string,
    from: string,
    toExclusive: string,
    categoryId?: string,
  ): Promise<{ totalCents: number; count: number }>;
  sumByCategory(
    profileId: string,
    from: string,
    toExclusive: string,
    categoryId?: string,
  ): Promise<CategorySum[]>;
  sumByPeriod(
    profileId: string,
    from: string,
    toExclusive: string,
    granularity: Granularity,
    categoryId?: string,
  ): Promise<PeriodSum[]>;
  sumByPeriodAndCategory(
    profileId: string,
    from: string,
    toExclusive: string,
    granularity: Granularity,
    categoryId?: string,
  ): Promise<PeriodCategorySum[]>;
}

/** Whitelisted date_trunc units — never interpolate raw user input. */
const TRUNC_UNITS: Record<Granularity, string> = {
  day: "day",
  week: "week",
  month: "month",
};

/** SQL expression bucketing `spentAt` to the start date of its period. */
function bucketExpr(granularity: Granularity) {
  const unit = TRUNC_UNITS[granularity];
  return sql<string>`to_char(date_trunc(${sql.raw(`'${unit}'`)}, ${expenses.spentAt}::timestamp), 'YYYY-MM-DD')`;
}

export function createReportsRepository(db: Db): ReportsRepository {
  const conditions = (
    profileId: string,
    from: string,
    toExclusive: string,
    categoryId?: string,
  ) => {
    const conds = [
      eq(expenses.profileId, profileId),
      gte(expenses.spentAt, from),
      lt(expenses.spentAt, toExclusive),
    ];
    if (categoryId) conds.push(eq(expenses.categoryId, categoryId));
    return and(...conds);
  };

  return {
    async totalBetween(profileId, from, toExclusive, categoryId) {
      const rows = await db
        .select({
          totalCents: sql<number>`coalesce(sum(${expenses.amountCents}), 0)::int`,
          count: sql<number>`count(*)::int`,
        })
        .from(expenses)
        .where(conditions(profileId, from, toExclusive, categoryId));
      return rows[0] ?? { totalCents: 0, count: 0 };
    },

    async sumByCategory(profileId, from, toExclusive, categoryId) {
      return db
        .select({
          categoryId: categories.id,
          name: categories.name,
          color: categories.color,
          totalCents: sql<number>`coalesce(sum(${expenses.amountCents}), 0)::int`,
        })
        .from(expenses)
        .innerJoin(categories, eq(categories.id, expenses.categoryId))
        .where(conditions(profileId, from, toExclusive, categoryId))
        .groupBy(categories.id, categories.name, categories.color)
        .orderBy(sql`sum(${expenses.amountCents}) desc`);
    },

    async sumByPeriod(profileId, from, toExclusive, granularity, categoryId) {
      const rows = await db
        .select({
          bucket: bucketExpr(granularity),
          totalCents: sql<number>`coalesce(sum(${expenses.amountCents}), 0)::int`,
        })
        .from(expenses)
        .where(conditions(profileId, from, toExclusive, categoryId))
        .groupBy(sql`1`)
        .orderBy(sql`1`);
      return rows;
    },

    async sumByPeriodAndCategory(
      profileId,
      from,
      toExclusive,
      granularity,
      categoryId,
    ) {
      const rows = await db
        .select({
          bucket: bucketExpr(granularity),
          categoryId: categories.id,
          name: categories.name,
          color: categories.color,
          totalCents: sql<number>`coalesce(sum(${expenses.amountCents}), 0)::int`,
        })
        .from(expenses)
        .innerJoin(categories, eq(categories.id, expenses.categoryId))
        .where(conditions(profileId, from, toExclusive, categoryId))
        .groupBy(sql`1, 2`)
        .orderBy(sql`1`);
      return rows;
    },
  };
}
