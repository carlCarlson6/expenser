import { Money } from "@/shared/kernel/money";

export interface BudgetStatusResult {
  planned: Money;
  actual: Money;
  remaining: Money;
  overspend: Money;
  percentUsed: number;
  isOverBudget: boolean;
}

/**
 * Domain service that computes the status of a budget against actual spending.
 */
export class BudgetStatus {
  static calculate(planned: Money, actual: Money): BudgetStatusResult {
    const isOverBudget = actual.isGreaterThan(planned);
    const overspend = isOverBudget
      ? actual.subtractClamped(planned)
      : Money.zero();
    const remaining = planned.subtractClamped(actual);

    let percentUsed: number;
    if (planned.isZero()) {
      percentUsed = actual.isZero() ? 0 : 100;
    } else {
      percentUsed = Math.min(
        100,
        Math.round((actual.cents / planned.cents) * 100),
      );
    }

    return {
      planned,
      actual,
      remaining,
      overspend,
      percentUsed,
      isOverBudget,
    };
  }
}
