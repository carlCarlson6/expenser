import { index, pgTable, text, uniqueIndex, varchar } from "drizzle-orm/pg-core";
import { generateId } from "@/db/id";
import { timestamps } from "@/db/helpers";

/**
 * User-owned spending categories. Flat (no hierarchy). Each user gets a set of
 * defaults seeded on first load and can then manage their own.
 */
export const categories = pgTable(
  "categories",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => generateId("cat")),
    userId: text("user_id").notNull(),
    name: varchar("name", { length: 60 }).notNull(),
    /** Hex color string used in charts and badges, e.g. "#22c55e". */
    color: varchar("color", { length: 9 }).notNull(),
    /** Lucide icon name, e.g. "shopping-cart". */
    icon: varchar("icon", { length: 40 }).notNull(),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex("categories_user_id_name_unique").on(t.userId, t.name),
    index("categories_user_id_idx").on(t.userId),
  ],
);

export type CategoryRow = typeof categories.$inferSelect;
export type NewCategoryRow = typeof categories.$inferInsert;
