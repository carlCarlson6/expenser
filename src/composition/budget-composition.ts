import { db } from "@/db";
import { generateId } from "@/db/id";
import { Money } from "@/shared/kernel/money";
import type { YearMonth } from "@/shared/kernel/year-month";
import type { CategoryDto } from "@/modules/categories/application/category.dto";
import { DrizzleCategoryRepository } from "@/modules/categories/infrastructure/drizzle-category.repository";
import { deleteBudget } from "@/modules/budgets/application/commands/delete-budget.command";
import { setBudget } from "@/modules/budgets/application/commands/set-budget.command";
import { listBudgetStatusesForMonth } from "@/modules/budgets/application/queries/list-budget-statuses-for-month.query";
import type { BudgetCategoryLookup } from "@/modules/budgets/application/ports/budget-category-lookup.port";
import type { BudgetIdGenerator } from "@/modules/budgets/application/ports/budget-id-generator.port";
import type { SpendingByCategoryReadModel } from "@/modules/budgets/application/budget.dto";
import { DrizzleBudgetRepository } from "@/modules/budgets/infrastructure/drizzle-budget.repository";
import { ledger } from "./ledger-composition";

const budgetRepository = new DrizzleBudgetRepository(db);
const categoryRepository = new DrizzleCategoryRepository(db);

const budgetIdGenerator: BudgetIdGenerator = {
  generate: () => generateId("bud"),
};

const budgetCategoryLookup: BudgetCategoryLookup = {
  async exists(categoryId: string, userId: string) {
    const category = await categoryRepository.findById(categoryId);
    return category !== null && category.userId === userId;
  },
};

const spendingByCategory: SpendingByCategoryReadModel = {
  async findByMonth(userId: string, yearMonth: YearMonth) {
    const transactions = await ledger.listForMonth(userId, yearMonth);
    const map = new Map<string, Money>();
    for (const transaction of transactions) {
      if (transaction.type === "expense" && transaction.categoryId) {
        const current = map.get(transaction.categoryId) ?? Money.zero();
        map.set(
          transaction.categoryId,
          current.add(Money.reconstitute(transaction.amountCents)),
        );
      }
    }
    return map;
  },
};

export const budgets = {
  set: (input: {
    userId: string;
    categoryId: string;
    yearMonth: YearMonth;
    amountEuros: number;
  }) =>
    setBudget({
      input,
      deps: {
        repo: budgetRepository,
        idGenerator: budgetIdGenerator,
        categoryLookup: budgetCategoryLookup,
      },
    }),

  delete: (input: { budgetId: string; userId: string }) =>
    deleteBudget({ input, repo: budgetRepository }),

  listForMonth: (
    userId: string,
    yearMonth: YearMonth,
    categories: CategoryDto[],
  ) =>
    listBudgetStatusesForMonth({
      userId,
      yearMonth,
      categories,
      repo: budgetRepository,
      spending: spendingByCategory,
    }),
};
