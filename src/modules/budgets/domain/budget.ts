import { Entity } from "@/shared/kernel/entity";
import { Money } from "@/shared/kernel/money";
import { YearMonth } from "@/shared/kernel/year-month";
import { err, ok, type Result } from "@/shared/kernel/result";

export interface BudgetProps {
  id: string;
  userId: string;
  categoryId: string;
  year: number;
  month: number;
  amount: Money;
}

/**
 * Budget aggregate — a planned spending limit for a single category in a
 * single calendar month.
 */
export class Budget extends Entity<string> {
  readonly userId: string;
  readonly categoryId: string;
  readonly year: number;
  readonly month: number;
  private _amount: Money;

  private constructor(props: BudgetProps) {
    super(props.id);
    this.userId = props.userId;
    this.categoryId = props.categoryId;
    this.year = props.year;
    this.month = props.month;
    this._amount = props.amount;
  }

  get amount(): Money {
    return this._amount;
  }

  static create(props: BudgetProps): Result<Budget, string> {
    const yearMonthResult = YearMonth.create(props.year, props.month);
    if (!yearMonthResult.ok) return err(yearMonthResult.error);
    if (props.amount.cents < 0) {
      return err("Budget amount cannot be negative");
    }
    if (!props.categoryId.trim()) {
      return err("Category is required");
    }
    return ok(new Budget(props));
  }

  /** Reconstitutes a persisted budget without revalidation. */
  static reconstitute(props: BudgetProps): Budget {
    return new Budget(props);
  }

  changeAmount(amount: Money): Result<void, string> {
    if (amount.cents < 0) {
      return err("Budget amount cannot be negative");
    }
    this._amount = amount;
    return ok(undefined);
  }
}
