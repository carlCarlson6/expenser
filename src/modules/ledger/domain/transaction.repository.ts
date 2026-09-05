import type { Transaction } from "./transaction";

/**
 * Driven port for persisting and retrieving Transaction aggregates.
 */
export interface TransactionRepository {
  /** Find a transaction by id, or null if not found. */
  findById(id: string): Promise<Transaction | null>;

  /** Persist a transaction (insert or update by id). */
  save(transaction: Transaction): Promise<void>;

  /** Remove a transaction by id. */
  delete(id: string): Promise<void>;
}
