import type { Budget } from "./budget";

/**
 * Driven port for persisting and retrieving Budget aggregates.
 */
export interface BudgetRepository {
  /** Find a budget by id, or null if not found. */
  findById(id: string): Promise<Budget | null>;

  /** List all budgets for a user in a given month. */
  findByUserIdAndYearMonth(
    userId: string,
    year: number,
    month: number,
  ): Promise<Budget[]>;

  /** Find a budget by its unique user/category/month tuple. */
  findByUserIdAndCategoryIdAndYearMonth(
    userId: string,
    categoryId: string,
    year: number,
    month: number,
  ): Promise<Budget | null>;

  /** Persist a budget (insert or update by id). */
  save(budget: Budget): Promise<void>;

  /** Remove a budget by id. */
  delete(id: string): Promise<void>;
}
