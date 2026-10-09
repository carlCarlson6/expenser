import { and, asc, eq, sql } from "drizzle-orm";

import { expenses } from "@/modules/expenses/data/schema";
import type { Db } from "@/shared/db/client";

import { type Category, categories } from "./schema";

export type CategoryWithTotals = Category & {
  expenseCount: number;
  totalCents: number;
};

export interface CategoryRepository {
  listByProfile(profileId: string): Promise<Category[]>;
  listWithTotals(profileId: string): Promise<CategoryWithTotals[]>;
  findById(profileId: string, id: string): Promise<Category | null>;
  findProtected(profileId: string): Promise<Category | null>;
  findByName(profileId: string, name: string): Promise<Category | null>;
  create(profileId: string, name: string): Promise<Category>;
  createMany(
    profileId: string,
    names: string[],
    protectedIndex: number,
  ): Promise<void>;
  rename(profileId: string, id: string, name: string): Promise<Category | null>;
  remove(profileId: string, id: string): Promise<void>;
}

export function createCategoryRepository(db: Db): CategoryRepository {
  const owned = (profileId: string, id: string) =>
    and(eq(categories.id, id), eq(categories.profileId, profileId));

  return {
    async listByProfile(profileId) {
      return db
        .select()
        .from(categories)
        .where(eq(categories.profileId, profileId))
        .orderBy(asc(categories.name));
    },

    async listWithTotals(profileId) {
      const rows = await db
        .select({
          category: categories,
          expenseCount: sql<number>`count(${expenses.id})::int`,
          totalCents: sql<number>`coalesce(sum(${expenses.amountCents}), 0)::int`,
        })
        .from(categories)
        .leftJoin(expenses, eq(expenses.categoryId, categories.id))
        .where(eq(categories.profileId, profileId))
        .groupBy(categories.id)
        .orderBy(asc(categories.name));
      return rows.map((r) => ({
        ...r.category,
        expenseCount: r.expenseCount,
        totalCents: r.totalCents,
      }));
    },

    async findById(profileId, id) {
      const rows = await db
        .select()
        .from(categories)
        .where(owned(profileId, id))
        .limit(1);
      return rows[0] ?? null;
    },

    async findProtected(profileId) {
      const rows = await db
        .select()
        .from(categories)
        .where(
          and(
            eq(categories.profileId, profileId),
            eq(categories.isProtected, true),
          ),
        )
        .limit(1);
      return rows[0] ?? null;
    },

    async findByName(profileId, name) {
      const rows = await db
        .select()
        .from(categories)
        .where(
          and(
            eq(categories.profileId, profileId),
            sql`lower(${categories.name}) = lower(${name})`,
          ),
        )
        .limit(1);
      return rows[0] ?? null;
    },

    async create(profileId, name) {
      const rows = await db
        .insert(categories)
        .values({ profileId, name })
        .returning();
      return rows[0];
    },

    async createMany(profileId, names, protectedIndex) {
      await db.insert(categories).values(
        names.map((name, i) => ({
          profileId,
          name,
          isProtected: i === protectedIndex,
        })),
      );
    },

    async rename(profileId, id, name) {
      const rows = await db
        .update(categories)
        .set({ name })
        .where(owned(profileId, id))
        .returning();
      return rows[0] ?? null;
    },

    async remove(profileId, id) {
      await db.delete(categories).where(owned(profileId, id));
    },
  };
}
