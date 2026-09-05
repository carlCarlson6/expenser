import { describe, expect, it } from "vitest";
import { Money } from "@/shared/kernel/money";
import { Budget } from "@/modules/budgets/domain/budget";
import { BudgetStatus } from "@/modules/budgets/domain/budget-status";

describe("Budget", () => {
  const baseProps = {
    id: "bud_1",
    userId: "user_1",
    categoryId: "cat_1",
    year: 2026,
    month: 9,
    amount: Money.reconstitute(50000),
  };

  describe("create", () => {
    it("creates a valid budget", () => {
      const result = Budget.create(baseProps);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.amount.cents).toBe(50000);
        expect(result.value.year).toBe(2026);
        expect(result.value.month).toBe(9);
      }
    });

    it("allows a zero budget", () => {
      const result = Budget.create({ ...baseProps, amount: Money.zero() });
      expect(result.ok).toBe(true);
    });

    it("rejects negative budgets", () => {
      const result = Budget.create({
        ...baseProps,
        amount: Money.reconstitute(-100),
      });
      expect(result.ok).toBe(false);
    });

    it("rejects invalid months", () => {
      const result = Budget.create({ ...baseProps, month: 13 });
      expect(result.ok).toBe(false);
    });
  });

  describe("changeAmount", () => {
    it("updates the amount", () => {
      const budget = Budget.reconstitute(baseProps);
      const result = budget.changeAmount(Money.reconstitute(75000));
      expect(result.ok).toBe(true);
      expect(budget.amount.cents).toBe(75000);
    });

    it("rejects negative amounts", () => {
      const budget = Budget.reconstitute(baseProps);
      const result = budget.changeAmount(Money.reconstitute(-1));
      expect(result.ok).toBe(false);
    });
  });
});

describe("BudgetStatus", () => {
  it("reports under budget", () => {
    const status = BudgetStatus.calculate(
      Money.reconstitute(50000),
      Money.reconstitute(20000),
    );
    expect(status.isOverBudget).toBe(false);
    expect(status.remaining.cents).toBe(30000);
    expect(status.percentUsed).toBe(40);
  });

  it("reports over budget", () => {
    const status = BudgetStatus.calculate(
      Money.reconstitute(50000),
      Money.reconstitute(70000),
    );
    expect(status.isOverBudget).toBe(true);
    expect(status.overspend.cents).toBe(20000);
    expect(status.percentUsed).toBe(100);
  });

  it("handles zero planned budget with spending", () => {
    const status = BudgetStatus.calculate(
      Money.zero(),
      Money.reconstitute(1000),
    );
    expect(status.isOverBudget).toBe(true);
    expect(status.percentUsed).toBe(100);
  });
});
