import { createCategoryRepository } from "@/modules/categories/data/repository";
import { createExpenseRepository } from "@/modules/expenses/data/repository";
import { createReportsRepository } from "@/modules/reports/data/repository";
import { createProfileRepository } from "@/modules/users/data/repository";

import type { Db } from "./client";

/** Composition root: wires every slice's repository to a db handle (or a
 *  transaction). Domain commands/queries declare which subset they need. */
export function createRepos(db: Db) {
  return {
    profiles: createProfileRepository(db),
    categories: createCategoryRepository(db),
    expenses: createExpenseRepository(db),
    reports: createReportsRepository(db),
  };
}

export type Repos = ReturnType<typeof createRepos>;

/**
 * Runs `fn` inside a database transaction, exposing repositories bound to it.
 * Domain code stays driver-agnostic: callers that need atomicity pass this as
 * the transaction runner (see `delete-category`, `seed-dev-user`).
 */
export async function runInTransaction<T>(
  db: Db,
  fn: (repos: Repos) => Promise<T>,
): Promise<T> {
  return db.transaction((tx) => fn(createRepos(tx as unknown as Db)));
}
