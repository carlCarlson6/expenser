import { Money } from "@/shared/kernel/money";
import { err, ok, type Result } from "@/shared/kernel/result";
import { Transaction } from "@/modules/ledger/domain/transaction";
import type { TransactionRepository } from "@/modules/ledger/domain/transaction.repository";
import { toTransactionDto, type TransactionDto } from "../transaction.dto";
import type { CategoryLookup } from "../ports/category-lookup.port";

export interface UpdateTransactionInput {
  transactionId: string;
  userId: string;
  type?: "expense" | "income";
  amountEuros?: number;
  date?: Date;
  categoryId?: string | null;
  note?: string;
}

export async function updateTransaction({
  input,
  repo,
  categoryLookup,
}: {
  input: UpdateTransactionInput;
  repo: TransactionRepository;
  categoryLookup: CategoryLookup;
}): Promise<Result<TransactionDto, string>> {
  const existing = await repo.findById(input.transactionId);
  if (!existing || existing.userId !== input.userId) {
    return err("Transaction not found");
  }

  const type = input.type ?? existing.type;

  let amount = existing.amount;
  if (input.amountEuros !== undefined) {
    const amountResult = Money.fromEuros(input.amountEuros);
    if (!amountResult.ok) return err(amountResult.error);
    amount = amountResult.value;
  }

  const date = input.date ?? existing.date;
  const note = input.note !== undefined ? input.note : existing.note;

  let categoryId =
    input.categoryId !== undefined
      ? input.categoryId?.trim() || null
      : existing.categoryId;

  if (type === "expense") {
    if (!categoryId) return err("An expense must have a category");
    const category = await categoryLookup.findByIdAndUserId(
      categoryId,
      input.userId,
    );
    if (!category) return err("Category not found");
  } else {
    categoryId = null;
  }

  const transactionResult = Transaction.create({
    id: existing.id,
    userId: input.userId,
    type,
    amount,
    date,
    categoryId,
    note,
  });
  if (!transactionResult.ok) return err(transactionResult.error);

  await repo.save(transactionResult.value);
  return ok(toTransactionDto(transactionResult.value));
}
