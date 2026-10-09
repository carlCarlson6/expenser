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
      // Whitelist the date_trunc unit — never interpolate raw user input.
      const units: Record<Granularity, string> = {
        day: "day",
        week: "week",
        month: "month",
      };
      const unit = units[granularity];
      const rows = await db
        .select({
          bucket: sql<string>`to_char(date_trunc(${sql.raw(`'${unit}'`)}, ${expenses.spentAt}::timestamp), 'YYYY-MM-DD')`,
          totalCents: sql<number>`coalesce(sum(${expenses.amountCents}), 0)::int`,
        })
        .from(expenses)
        .where(conditions(profileId, from, toExclusive, categoryId))
        .groupBy(sql`1`)
        .orderBy(sql`1`);
      return rows;
    },
  };
}
