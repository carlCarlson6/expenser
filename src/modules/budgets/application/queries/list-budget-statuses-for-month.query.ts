import { Money } from "@/shared/kernel/money";
import { YearMonth } from "@/shared/kernel/year-month";
import type { CategoryDto } from "@/modules/categories/application/category.dto";
import { BudgetStatus } from "@/modules/budgets/domain/budget-status";
import type { BudgetRepository } from "@/modules/budgets/domain/budget.repository";
import type {
  BudgetStatusDto,
  SpendingByCategoryReadModel,
} from "../budget.dto";

export interface ListBudgetStatusesForMonthQuery {
  userId: string;
  yearMonth: YearMonth;
  categories: CategoryDto[];
  repo: BudgetRepository;
  spending: SpendingByCategoryReadModel;
}

export async function listBudgetStatusesForMonth({
  userId,
  yearMonth,
  categories,
  repo,
  spending,
}: ListBudgetStatusesForMonthQuery): Promise<BudgetStatusDto[]> {
  const budgets = await repo.findByUserIdAndYearMonth(
    userId,
    yearMonth.year,
    yearMonth.month,
  );
  const actualByCategory = await spending.findByMonth(userId, yearMonth);

  return categories.map((category) => {
    const budget = budgets.find((b) => b.categoryId === category.id);
    const planned = budget?.amount ?? Money.zero();
    const actual = actualByCategory.get(category.id) ?? Money.zero();
    const status = BudgetStatus.calculate(planned, actual);

    return {
      category,
      budgetId: budget?.id ?? null,
      plannedCents: planned.cents,
      actualCents: actual.cents,
      remainingCents: status.remaining.cents,
      overspendCents: status.overspend.cents,
      percentUsed: status.percentUsed,
      isOverBudget: status.isOverBudget,
    };
  });
}
