import { YearMonth } from "@/shared/kernel/year-month";
import type { Transaction } from "@/modules/ledger/domain/transaction";

export interface CategorySnapshotDto {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export interface TransactionDto {
  id: string;
  userId: string;
  type: "expense" | "income";
  amountCents: number;
  date: string; // YYYY-MM-DD
  categoryId: string | null;
  note: string;
}

export interface TransactionListItemDto extends TransactionDto {
  category: CategorySnapshotDto | null;
}

export function toTransactionDto(transaction: Transaction): TransactionDto {
  return {
    id: transaction.id,
    userId: transaction.userId,
    type: transaction.type,
    amountCents: transaction.amount.cents,
    date: toIsoDate(transaction.date),
    categoryId: transaction.categoryId,
    note: transaction.note,
  };
}

export interface TransactionReadModel {
  /** List all transactions for a user in the given month, newest first. */
  findByMonth(
    userId: string,
    yearMonth: YearMonth,
  ): Promise<TransactionListItemDto[]>;

  /** Count how many transactions reference a given category. */
  countByCategoryId(categoryId: string): Promise<number>;
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
