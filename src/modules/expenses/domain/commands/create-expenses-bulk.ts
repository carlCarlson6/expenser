import type { CategoryRepository } from "@/modules/categories/data/repository";
import { DomainError, type Actor } from "@/modules/users/domain/types";

import type { ExpenseRepository } from "../../data/repository";
import type { ExpenseInput } from "../validators/expense";

type Repos = {
  expenses: ExpenseRepository;
  categories: CategoryRepository;
};

/** Binds the batch to one unit of work; the caller decides if it is a tx. */
export type TransactionRunner = <T>(
  fn: (repos: Repos) => Promise<T>,
) => Promise<T>;

/**
 * Creates several expenses in one submission. Every row is resolved before
 * anything is written, so a batch lands whole or not at all — a row pointing at
 * someone else's category (or a category deleted mid-flight) rejects the whole
 * submission instead of leaving a half-applied import behind.
 *
 * Returns the number of expenses created.
 */
export async function createExpensesBulk(
  repos: Repos,
  actor: Actor,
  inputs: ExpenseInput[],
  run: TransactionRunner = (fn) => fn(repos),
): Promise<number> {
  if (inputs.length === 0) throw new DomainError("bulkEmpty");

  // Ownership is checked once per distinct category rather than once per row.
  const categoryIds = [...new Set(inputs.map((input) => input.categoryId))];
  const resolved = await Promise.all(
    categoryIds.map((categoryId) =>
      repos.categories.findById(actor.profileId, categoryId),
    ),
  );
  if (resolved.some((category) => category === null)) {
    throw new DomainError("notFound");
  }

  return run((tx) =>
    tx.expenses.insertMany(
      actor.profileId,
      inputs.map((input) => ({
        categoryId: input.categoryId,
        amountCents: input.amount,
        description: input.description,
        spentAt: input.spentAt,
      })),
    ),
  );
}