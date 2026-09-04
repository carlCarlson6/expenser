import { timestamp } from "drizzle-orm/pg-core";

/** created_at / updated_at timestamp columns with timezone, shared by all tables. */
export function timestamps() {
  return {
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  };
}
