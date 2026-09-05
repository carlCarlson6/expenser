import { err, ok, type Result } from "@/shared/kernel/result";
import type { BudgetRepository } from "@/modules/budgets/domain/budget.repository";

export interface DeleteBudgetInput {
  budgetId: string;
  userId: string;
}

export async function deleteBudget({
  input,
  repo,
}: {
  input: DeleteBudgetInput;
  repo: BudgetRepository;
}): Promise<Result<void, string>> {
  const existing = await repo.findById(input.budgetId);
  if (!existing || existing.userId !== input.userId) {
    return err("Budget not found");
  }

  await repo.delete(input.budgetId);
  return ok(undefined);
}
