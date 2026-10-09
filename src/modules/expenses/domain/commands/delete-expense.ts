import { DomainError, type Actor } from "@/modules/users/domain/types";

import type { ExpenseRepository } from "../../data/repository";

type Repos = { expenses: ExpenseRepository };

export async function deleteExpense(
  repos: Repos,
  actor: Actor,
  input: { id: string },
): Promise<void> {
  const expense = await repos.expenses.findById(actor.profileId, input.id);
  if (!expense) throw new DomainError("notFound");
  await repos.expenses.remove(actor.profileId, input.id);
}
