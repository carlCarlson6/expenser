import { Money } from "@/shared/kernel/money";
import { err, ok, type Result } from "@/shared/kernel/result";
import { Budget } from "@/modules/budgets/domain/budget";
import type { BudgetRepository } from "@/modules/budgets/domain/budget.repository";
import type { YearMonth } from "@/shared/kernel/year-month";
import type { BudgetCategoryLookup } from "../ports/budget-category-lookup.port";
import type { BudgetIdGenerator } from "../ports/budget-id-generator.port";

export interface SetBudgetInput {
  userId: string;
  categoryId: string;
  yearMonth: YearMonth;
  amountEuros: number;
}

export interface SetBudgetDeps {
  repo: BudgetRepository;
  idGenerator: BudgetIdGenerator;
  categoryLookup: BudgetCategoryLookup;
}

export async function setBudget({
  input,
  deps,
}: {
  input: SetBudgetInput;
  deps: SetBudgetDeps;
}): Promise<Result<{ id: string }, string>> {
  const amountResult = Money.fromEuros(input.amountEuros);
  if (!amountResult.ok) return err(amountResult.error);

  const categoryExists = await deps.categoryLookup.exists(
    input.categoryId,
    input.userId,
  );
  if (!categoryExists) return err("Category not found");

  const existing = await deps.repo.findByUserIdAndCategoryIdAndYearMonth(
    input.userId,
    input.categoryId,
    input.yearMonth.year,
    input.yearMonth.month,
  );

  let budget: Budget;
  if (existing) {
    const changeResult = existing.changeAmount(amountResult.value);
    if (!changeResult.ok) return err(changeResult.error);
    budget = existing;
  } else {
    const createResult = Budget.create({
      id: deps.idGenerator.generate(),
      userId: input.userId,
      categoryId: input.categoryId,
      year: input.yearMonth.year,
      month: input.yearMonth.month,
      amount: amountResult.value,
    });
    if (!createResult.ok) return err(createResult.error);
    budget = createResult.value;
  }

  await deps.repo.save(budget);
  return ok({ id: budget.id });
}
