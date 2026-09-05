import { index, integer, pgTable, text, date } from "drizzle-orm/pg-core";
import { generateId } from "@/db/id";
import { timestamps } from "@/db/helpers";
import { categories } from "@/modules/categories/infrastructure/categories.schema";

export const transactions = pgTable(
  "transactions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => generateId("txn")),
    userId: text("user_id").notNull(),
    /** `expense` or `income`. */
    type: text("type").$type<"expense" | "income">().notNull(),
    /** Positive amount in integer cents. Sign is derived from `type`. */
    amountCents: integer("amount_cents").notNull(),
    /** Calendar date of the transaction (browser timezone, YYYY-MM-DD). */
    date: date("date").notNull(),
    /** Required for expenses, must be null for income. */
    categoryId: text("category_id").references(() => categories.id, {
      onDelete: "restrict",
    }),
    note: text("note"),
    ...timestamps(),
  },
  (t) => [
    index("transactions_user_id_date_idx").on(t.userId, t.date),
    index("transactions_user_id_category_id_idx").on(t.userId, t.categoryId),
  ],
);

export type TransactionRow = typeof transactions.$inferSelect;
export type NewTransactionRow = typeof transactions.$inferInsert;
