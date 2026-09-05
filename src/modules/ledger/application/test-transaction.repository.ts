import { Transaction } from "@/modules/ledger/domain/transaction";
import type { TransactionRepository } from "@/modules/ledger/domain/transaction.repository";

export class TestTransactionRepository implements TransactionRepository {
  private transactions = new Map<string, Transaction>();

  async findById(id: string): Promise<Transaction | null> {
    return this.transactions.get(id) ?? null;
  }

  async save(transaction: Transaction): Promise<void> {
    this.transactions.set(transaction.id, transaction);
  }

  async delete(id: string): Promise<void> {
    this.transactions.delete(id);
  }
}
