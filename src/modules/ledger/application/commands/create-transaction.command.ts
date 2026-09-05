import { Money } from "@/shared/kernel/money";
import { err, ok, type Result } from "@/shared/kernel/result";
import { Transaction } from "@/modules/ledger/domain/transaction";
import type { TransactionRepository } from "@/modules/ledger/domain/transaction.repository";
import { toTransactionDto, type TransactionDto } from "../transaction.dto";
import type { CategoryLookup } from "../ports/category-lookup.port";
import type { TransactionIdGenerator } from "../ports/transaction-id-generator.port";

export interface CreateTransactionInput {
  userId: string;
  type: "expense" | "income";
  amountEuros: number;
  date: Date;
  categoryId?: string | null;
  note?: string;
}

export interface CreateTransactionDeps {
  repo: TransactionRepository;
  idGenerator: TransactionIdGenerator;
  categoryLookup: CategoryLookup;
}

export async function createTransaction({
  input,
  deps,
}: {
  input: CreateTransactionInput;
  deps: CreateTransactionDeps;
}): Promise<Result<TransactionDto, string>> {
  const amountResult = Money.fromEuros(input.amountEuros);
  if (!amountResult.ok) return err(amountResult.error);

  const categoryId = input.categoryId?.trim() || null;

  if (input.type === "expense") {
    if (!categoryId) return err("An expense must have a category");
    const category = await deps.categoryLookup.findByIdAndUserId(
      categoryId,
      input.userId,
    );
    if (!category) return err("Category not found");
  }

  const transactionResult = Transaction.create({
    id: deps.idGenerator.generate(),
    userId: input.userId,
    type: input.type,
    amount: amountResult.value,
    date: input.date,
    categoryId: input.type === "income" ? null : categoryId,
    note: input.note ?? "",
  });
  if (!transactionResult.ok) return err(transactionResult.error);

  await deps.repo.save(transactionResult.value);
  return ok(toTransactionDto(transactionResult.value));
}
