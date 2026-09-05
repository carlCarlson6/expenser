import { Entity } from "@/shared/kernel/entity";
import { Money } from "@/shared/kernel/money";
import { err, ok, type Result } from "@/shared/kernel/result";

export type TransactionType = "expense" | "income";

export interface TransactionProps {
  id: string;
  userId: string;
  type: TransactionType;
  amount: Money;
  date: Date;
  categoryId: string | null;
  note: string;
}

/**
 * Transaction aggregate — a single expense or income entry.
 *
 * Invariants:
 * - amount must be greater than zero
 * - an expense must have a category
 * - income must not have a category
 */
export class Transaction extends Entity<string> {
  readonly userId: string;
  readonly type: TransactionType;
  readonly amount: Money;
  readonly date: Date;
  readonly categoryId: string | null;
  readonly note: string;

  private constructor(props: TransactionProps) {
    super(props.id);
    this.userId = props.userId;
    this.type = props.type;
    this.amount = props.amount;
    this.date = props.date;
    this.categoryId = props.categoryId;
    this.note = props.note;
  }

  static create(props: TransactionProps): Result<Transaction, string> {
    if (props.type !== "expense" && props.type !== "income") {
      return err("Transaction type must be expense or income");
    }
    if (props.amount.isZero()) {
      return err("Amount must be greater than zero");
    }
    if (props.type === "expense" && !props.categoryId) {
      return err("An expense must have a category");
    }
    if (props.type === "income" && props.categoryId) {
      return err("Income cannot have a category");
    }
    return ok(
      new Transaction({
        ...props,
        note: props.note.trim(),
        date: props.date,
      }),
    );
  }

  /** Reconstitutes a persisted transaction without revalidation. */
  static reconstitute(props: TransactionProps): Transaction {
    return new Transaction(props);
  }
}
