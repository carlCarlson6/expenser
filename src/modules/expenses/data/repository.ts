import { and, desc, eq, gte, ilike, lte, sql } from "drizzle-orm";

import { categories } from "@/modules/categories/data/schema";
import type { Db } from "@/shared/db/client";

import { type Expense, expenses } from "./schema";

export type ExpenseInput = {
  categoryId: string;
  amountCents: number;
  description?: string;
  spentAt: string;
};

export type ExpenseFilters = {
  categoryId?: string;
  from?: string;
  to?: string;
  search?: string;
  page: number;
  pageSize: number;
};

export type ExpenseWithCategory = Expense & {
  categoryName: string;
  categoryColor: string;
};

export interface ExpenseRepository {
  findById(profileId: string, id: string): Promise<Expense | null>;
  insert(profileId: string, input: ExpenseInput): Promise<Expense>;
  /** Inserts a batch in one statement. Returns rows inserted. */
  insertMany(profileId: string, inputs: ExpenseInput[]): Promise<number>;
  update(
    profileId: string,
    id: string,
    input: ExpenseInput,
  ): Promise<Expense | null>;
  remove(profileId: string, id: string): Promise<void>;
  /** Moves every expense from one category to another. Returns rows moved. */
  reassignCategory(
    profileId: string,
    fromCategoryId: string,
    toCategoryId: string,
  ): Promise<number>;
  /** How many expenses the profile has; used to guard destructive commands. */
  countByProfile(profileId: string): Promise<number>;
  /**
   * Minimal projection (day, cents, description) of every expense in a date
   * range, used to flag likely duplicates before an import.
   */
  listFingerprints(
    profileId: string,
    from: string,
    to: string,
  ): Promise<{ spentAt: string; amountCents: number; description: string | null }[]>;
  list(
    profileId: string,
    filters: ExpenseFilters,
  ): Promise<{ items: ExpenseWithCategory[]; totalCount: number }>;
}

export function createExpenseRepository(db: Db): ExpenseRepository {
  const owned = (profileId: string, id: string) =>
    and(eq(expenses.id, id), eq(expenses.profileId, profileId));

  return {
    async findById(profileId, id) {
      const rows = await db
        .select()
        .from(expenses)
        .where(owned(profileId, id))
        .limit(1);
      return rows[0] ?? null;
    },

    async insert(profileId, input) {
      const rows = await db
        .insert(expenses)
        .values({
          profileId,
          categoryId: input.categoryId,
          amountCents: input.amountCents,
          description: input.description ?? null,
          spentAt: input.spentAt,
        })
        .returning();
      return rows[0];
    },

    async insertMany(profileId, inputs) {
      if (inputs.length === 0) return 0;
      const rows = await db
        .insert(expenses)
        .values(
          inputs.map((input) => ({
            profileId,
            categoryId: input.categoryId,
            amountCents: input.amountCents,
            description: input.description ?? null,
            spentAt: input.spentAt,
          })),
        )
        .returning({ id: expenses.id });
      return rows.length;
    },

    async update(profileId, id, input) {
      const rows = await db
        .update(expenses)
        .set({
          categoryId: input.categoryId,
          amountCents: input.amountCents,
          description: input.description ?? null,
          spentAt: input.spentAt,
          updatedAt: new Date(),
        })
        .where(owned(profileId, id))
        .returning();
      return rows[0] ?? null;
    },

    async remove(profileId, id) {
      await db.delete(expenses).where(owned(profileId, id));
    },

    async reassignCategory(profileId, fromCategoryId, toCategoryId) {
      const rows = await db
        .update(expenses)
        .set({ categoryId: toCategoryId })
        .where(
          and(
            eq(expenses.profileId, profileId),
            eq(expenses.categoryId, fromCategoryId),
          ),
        )
        .returning({ id: expenses.id });
      return rows.length;
    },

    async countByProfile(profileId) {
      const rows = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(expenses)
        .where(eq(expenses.profileId, profileId));
      return rows[0]?.count ?? 0;
    },

    async listFingerprints(profileId, from, to) {
      return db
        .select({
          spentAt: expenses.spentAt,
          amountCents: expenses.amountCents,
          description: expenses.description,
        })
        .from(expenses)
        .where(
          and(
            eq(expenses.profileId, profileId),
            gte(expenses.spentAt, from),
            lte(expenses.spentAt, to),
          ),
        );
    },

    async list(profileId, filters) {
      const conditions = [eq(expenses.profileId, profileId)];
      if (filters.categoryId) {
        conditions.push(eq(expenses.categoryId, filters.categoryId));
      }
      if (filters.from) conditions.push(gte(expenses.spentAt, filters.from));
      if (filters.to) conditions.push(lte(expenses.spentAt, filters.to));
      if (filters.search) {
        conditions.push(ilike(expenses.description, `%${filters.search}%`));
      }
      const where = and(...conditions);

      const [items, countRows] = await Promise.all([
        db
          .select({
            expense: expenses,
            categoryName: categories.name,
            categoryColor: categories.color,
          })
          .from(expenses)
          .innerJoin(categories, eq(categories.id, expenses.categoryId))
          .where(where)
          .orderBy(desc(expenses.spentAt), desc(expenses.createdAt))
          .limit(filters.pageSize)
          .offset((filters.page - 1) * filters.pageSize),
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(expenses)
          .where(where),
      ]);

      return {
        items: items.map((r) => ({
          ...r.expense,
          categoryName: r.categoryName,
          categoryColor: r.categoryColor,
        })),
        totalCount: countRows[0]?.count ?? 0,
      };
    },
  };
}
