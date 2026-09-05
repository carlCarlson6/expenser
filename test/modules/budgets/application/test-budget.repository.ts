import { Budget } from "@/modules/budgets/domain/budget";
import type { BudgetRepository } from "@/modules/budgets/domain/budget.repository";

export class TestBudgetRepository implements BudgetRepository {
  private budgets = new Map<string, Budget>();

  async findById(id: string): Promise<Budget | null> {
    return this.budgets.get(id) ?? null;
  }

  async findByUserIdAndYearMonth(
    userId: string,
    year: number,
    month: number,
  ): Promise<Budget[]> {
    return Array.from(this.budgets.values())
      .filter((b) => b.userId === userId && b.year === year && b.month === month)
      .sort((a, b) => a.categoryId.localeCompare(b.categoryId));
  }

  async findByUserIdAndCategoryIdAndYearMonth(
    userId: string,
    categoryId: string,
    year: number,
    month: number,
  ): Promise<Budget | null> {
    return (
      Array.from(this.budgets.values()).find(
        (b) =>
          b.userId === userId &&
          b.categoryId === categoryId &&
          b.year === year &&
          b.month === month,
      ) ?? null
    );
  }

  async save(budget: Budget): Promise<void> {
    this.budgets.set(budget.id, budget);
  }

  async delete(id: string): Promise<void> {
    this.budgets.delete(id);
  }
}
