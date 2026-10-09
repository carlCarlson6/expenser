import type { CategoryRepository } from "@/modules/categories/data/repository";
import { DomainError, type Actor } from "@/modules/users/domain/types";

import type { ExpenseRepository } from "../../data/repository";
import type { Expense } from "../../data/schema";
import type { ExpenseInput } from "../validators/expense";

type Repos = {
  expenses: ExpenseRepository;
  categories: CategoryRepository;
};

export async function createExpense(
  repos: Repos,
  actor: Actor,
  input: ExpenseInput,
): Promise<Expense> {
  const category = await repos.categories.findById(
    actor.profileId,
    input.categoryId,
  );
  if (!category) throw new DomainError("notFound");

  return repos.expenses.insert(actor.profileId, {
    categoryId: input.categoryId,
    amountCents: input.amount,
    description: input.description,
    spentAt: input.spentAt,
  });
}
