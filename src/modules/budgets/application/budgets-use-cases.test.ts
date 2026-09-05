import { describe, expect, it } from "vitest";
import { Money } from "@/shared/kernel/money";
import { YearMonth } from "@/shared/kernel/year-month";
import { setBudget } from "./commands/set-budget.command";
import { deleteBudget } from "./commands/delete-budget.command";
import { listBudgetStatusesForMonth } from "./queries/list-budget-statuses-for-month.query";
import { TestBudgetRepository } from "./test-budget.repository";
import type { BudgetCategoryLookup } from "./ports/budget-category-lookup.port";
import type { BudgetIdGenerator } from "./ports/budget-id-generator.port";
import type { SpendingByCategoryReadModel } from "./budget.dto";
import type { CategoryDto } from "@/modules/categories/application/category.dto";

function createIdGenerator(): BudgetIdGenerator {
  let counter = 0;
  return { generate: () => `bud_${++counter}` };
}

function createCategoryLookup(ownedIds: string[] = ["cat_1"]): BudgetCategoryLookup {
  return {
    exists: async (id) => ownedIds.includes(id),
  };
}

function createSpending(
  amounts: Record<string, number>,
): SpendingByCategoryReadModel {
  return {
    findByMonth: async () => {
      const map = new Map<string, Money>();
      for (const [categoryId, cents] of Object.entries(amounts)) {
        map.set(categoryId, Money.reconstitute(cents));
      }
      return map;
    },
  };
}

function createCategory(id: string): CategoryDto {
  return {
    id,
    userId: "user_1",
    name: `Category ${id}`,
    color: "#22c55e",
    icon: "utensils",
  };
}

describe("Budgets application", () => {
  const userId = "user_1";
  const yearMonth = YearMonth.reconstitute(2026, 9);

  describe("setBudget", () => {
    it("creates a new budget", async () => {
      const repo = new TestBudgetRepository();
      const result = await setBudget({
        input: {
          userId,
          categoryId: "cat_1",
          yearMonth,
          amountEuros: 500,
        },
        deps: {
          repo,
          idGenerator: createIdGenerator(),
          categoryLookup: createCategoryLookup(),
        },
      });
      expect(result.ok).toBe(true);
    });

    it("updates an existing budget", async () => {
      const repo = new TestBudgetRepository();
      const deps = {
        repo,
        idGenerator: createIdGenerator(),
        categoryLookup: createCategoryLookup(),
      };
      await setBudget({
        input: { userId, categoryId: "cat_1", yearMonth, amountEuros: 500 },
        deps,
      });
      const result = await setBudget({
        input: { userId, categoryId: "cat_1", yearMonth, amountEuros: 750 },
        deps,
      });
      expect(result.ok).toBe(true);
      const budgets = await repo.findByUserIdAndYearMonth(
        userId,
        yearMonth.year,
        yearMonth.month,
      );
      expect(budgets[0].amount.cents).toBe(75000);
    });

    it("rejects budgets for unknown categories", async () => {
      const repo = new TestBudgetRepository();
      const result = await setBudget({
        input: {
          userId,
          categoryId: "cat_other",
          yearMonth,
          amountEuros: 500,
        },
        deps: {
          repo,
          idGenerator: createIdGenerator(),
          categoryLookup: createCategoryLookup(),
        },
      });
      expect(result.ok).toBe(false);
    });
  });

  describe("deleteBudget", () => {
    it("deletes a budget", async () => {
      const repo = new TestBudgetRepository();
      const setResult = await setBudget({
        input: { userId, categoryId: "cat_1", yearMonth, amountEuros: 500 },
        deps: {
          repo,
          idGenerator: createIdGenerator(),
          categoryLookup: createCategoryLookup(),
        },
      });
      if (!setResult.ok) throw new Error("unexpected");

      const result = await deleteBudget({
        input: { budgetId: setResult.value.id, userId },
        repo,
      });
      expect(result.ok).toBe(true);
      expect(await repo.findById(setResult.value.id)).toBeNull();
    });
  });

  describe("listBudgetStatusesForMonth", () => {
    it("returns a status for every category", async () => {
      const repo = new TestBudgetRepository();
      await setBudget({
        input: { userId, categoryId: "cat_1", yearMonth, amountEuros: 500 },
        deps: {
          repo,
          idGenerator: createIdGenerator(),
          categoryLookup: createCategoryLookup(["cat_1", "cat_2"]),
        },
      });

      const result = await listBudgetStatusesForMonth({
        userId,
        yearMonth,
        categories: [createCategory("cat_1"), createCategory("cat_2")],
        repo,
        spending: createSpending({ cat_1: 20000 }),
      });

      expect(result).toHaveLength(2);
      const cat1 = result.find((s) => s.category.id === "cat_1")!;
      expect(cat1.plannedCents).toBe(50000);
      expect(cat1.actualCents).toBe(20000);
      const cat2 = result.find((s) => s.category.id === "cat_2")!;
      expect(cat2.plannedCents).toBe(0);
    });
  });
});
