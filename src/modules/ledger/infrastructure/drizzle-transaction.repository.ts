import { eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { Money } from "@/shared/kernel/money";
import { Transaction } from "@/modules/ledger/domain/transaction";
import type { TransactionRepository } from "@/modules/ledger/domain/transaction.repository";
import {
  transactions,
  type TransactionRow,
} from "@/modules/ledger/infrastructure/transactions.schema";

function toDomain(row: TransactionRow): Transaction {
  return Transaction.reconstitute({
    id: row.id,
    userId: row.userId,
    type: row.type,
    amount: Money.reconstitute(row.amountCents),
    date: new Date(row.date),
    categoryId: row.categoryId ?? null,
    note: row.note ?? "",
  });
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export class DrizzleTransactionRepository implements TransactionRepository {
  constructor(private readonly db: NodePgDatabase) {}

  async findById(id: string): Promise<Transaction | null> {
    const [row] = await this.db
      .select()
      .from(transactions)
      .where(eq(transactions.id, id))
      .limit(1);
    return row ? toDomain(row) : null;
  }

  async save(transaction: Transaction): Promise<void> {
    await this.db
      .insert(transactions)
      .values({
        id: transaction.id,
        userId: transaction.userId,
        type: transaction.type,
        amountCents: transaction.amount.cents,
        date: toIsoDate(transaction.date),
        categoryId: transaction.categoryId,
        note: transaction.note || null,
      })
      .onConflictDoUpdate({
        target: transactions.id,
        set: {
          type: transaction.type,
          amountCents: transaction.amount.cents,
          date: toIsoDate(transaction.date),
          categoryId: transaction.categoryId,
          note: transaction.note || null,
          updatedAt: new Date(),
        },
      });
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(transactions).where(eq(transactions.id, id));
  }
}
