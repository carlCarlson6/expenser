import type { Money } from "@/shared/kernel/money";
import { YearMonth } from "@/shared/kernel/year-month";
import type { CategoryDto } from "@/modules/categories/application/category.dto";

export interface BudgetStatusDto {
  category: CategoryDto;
  budgetId: string | null;
  plannedCents: number;
  actualCents: number;
  remainingCents: number;
  overspendCents: number;
  percentUsed: number;
  isOverBudget: boolean;
}

/**
 * Driven port that provides actual spending per category for a given month.
 * Implemented by the ledger context.
 */
export interface SpendingByCategoryReadModel {
  findByMonth(
    userId: string,
    yearMonth: YearMonth,
  ): Promise<Map<string, Money>>;
}
