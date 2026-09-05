import { err, ok, type Result } from "@/shared/kernel/result";
import type { TransactionRepository } from "@/modules/ledger/domain/transaction.repository";

export interface DeleteTransactionInput {
  transactionId: string;
  userId: string;
}

export async function deleteTransaction({
  input,
  repo,
}: {
  input: DeleteTransactionInput;
  repo: TransactionRepository;
}): Promise<Result<void, string>> {
  const existing = await repo.findById(input.transactionId);
  if (!existing || existing.userId !== input.userId) {
    return err("Transaction not found");
  }

  await repo.delete(input.transactionId);
  return ok(undefined);
}
