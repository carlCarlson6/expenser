import {
  boolean,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { profiles } from "@/modules/users/data/schema";

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    /** Hex color used to identify the category across the UI. */
    color: text("color").notNull().default("#6366f1"),
    /** Protected categories (the "Other" bucket) cannot be deleted — they
     *  receive the expenses of deleted categories. */
    isProtected: boolean("is_protected").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("categories_profile_name_unique").on(t.profileId, t.name)],
);

export type Category = typeof categories.$inferSelect;
