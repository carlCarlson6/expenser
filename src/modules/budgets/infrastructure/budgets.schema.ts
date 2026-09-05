import { index, integer, pgTable, text, uniqueIndex } from "drizzle-orm/pg-core";
import { generateId } from "@/db/id";
import { timestamps } from "@/db/helpers";
import { categories } from "@/modules/categories/infrastructure/categories.schema";

/**
 * Planned spending limit per category per month.
 */
export const budgets = pgTable(
  "budgets",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => generateId("bud")),
    userId: text("user_id").notNull(),
    categoryId: text("category_id")
      .references(() => categories.id, { onDelete: "cascade" })
      .notNull(),
    year: integer("year").notNull(),
    month: integer("month").notNull(),
    amountCents: integer("amount_cents").notNull(),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex("budgets_user_id_category_id_year_month_unique").on(
      t.userId,
      t.categoryId,
      t.year,
      t.month,
    ),
    index("budgets_user_id_year_month_idx").on(t.userId, t.year, t.month),
  ],
);

export type BudgetRow = typeof budgets.$inferSelect;
export type NewBudgetRow = typeof budgets.$inferInsert;
