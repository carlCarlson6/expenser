import {
  date,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { categories } from "@/modules/categories/data/schema";
import { profiles } from "@/modules/users/data/schema";

export const expenses = pgTable(
  "expenses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id),
    amountCents: integer("amount_cents").notNull(),
    description: text("description"),
    /** Day granularity, stored as a plain date ('YYYY-MM-DD'). */
    spentAt: date("spent_at", { mode: "string" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("expenses_profile_spent_at_idx").on(t.profileId, t.spentAt),
    index("expenses_category_idx").on(t.categoryId),
  ],
);

export type Expense = typeof expenses.$inferSelect;
