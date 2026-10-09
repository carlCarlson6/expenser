import { DomainError, type Actor } from "@/modules/users/domain/types";

import type { ExpenseRepository } from "@/modules/expenses/data/repository";
import type { CategoryRepository } from "../../data/repository";

type Repos = {
  categories: CategoryRepository;
  expenses: ExpenseRepository;
};

/**
 * Deletes a category, reassigning its expenses to the protected "Other"
 * category. Must run inside a transaction (the action layer provides it).
 */
export async function deleteCategory(
  repos: Repos,
  actor: Actor,
  input: { id: string },
): Promise<void> {
  const category = await repos.categories.findById(actor.profileId, input.id);
  if (!category) throw new DomainError("notFound");
  if (category.isProtected) throw new DomainError("protectedCategory");

  const other = await repos.categories.findProtected(actor.profileId);
  if (!other) throw new DomainError("generic");

  await repos.expenses.reassignCategory(actor.profileId, category.id, other.id);
  await repos.categories.remove(actor.profileId, category.id);
}
