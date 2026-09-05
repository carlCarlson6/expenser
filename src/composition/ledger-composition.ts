import { db } from "@/db";
import { generateId } from "@/db/id";
import { DrizzleCategoryRepository } from "@/modules/categories/infrastructure/drizzle-category.repository";
import { createTransaction } from "@/modules/ledger/application/commands/create-transaction.command";
import { deleteTransaction } from "@/modules/ledger/application/commands/delete-transaction.command";
import { updateTransaction } from "@/modules/ledger/application/commands/update-transaction.command";
import { listTransactionsForMonth } from "@/modules/ledger/application/queries/list-transactions-for-month.query";
import type { CategoryLookup } from "@/modules/ledger/application/ports/category-lookup.port";
import type { TransactionIdGenerator } from "@/modules/ledger/application/ports/transaction-id-generator.port";
import { DrizzleTransactionReadModel } from "@/modules/ledger/infrastructure/drizzle-transaction.read-model";
import { DrizzleTransactionRepository } from "@/modules/ledger/infrastructure/drizzle-transaction.repository";
import type { YearMonth } from "@/shared/kernel/year-month";

const transactionRepository = new DrizzleTransactionRepository(db);
const transactionReadModel = new DrizzleTransactionReadModel(db);
const categoryRepository = new DrizzleCategoryRepository(db);

const transactionIdGenerator: TransactionIdGenerator = {
  generate: () => generateId("txn"),
};

const categoryLookup: CategoryLookup = {
  async findByIdAndUserId(categoryId: string, userId: string) {
    const category = await categoryRepository.findById(categoryId);
    if (!category || category.userId !== userId) return null;
    return { id: category.id };
  },
};

export const ledger = {
  listForMonth: (userId: string, yearMonth: YearMonth) =>
    listTransactionsForMonth({
      userId,
      yearMonth,
      readModel: transactionReadModel,
    }),

  create: (input: {
    userId: string;
    type: "expense" | "income";
    amountEuros: number;
    date: Date;
    categoryId?: string | null;
    note?: string;
  }) =>
    createTransaction({
      input,
      deps: {
        repo: transactionRepository,
        idGenerator: transactionIdGenerator,
        categoryLookup,
      },
    }),

  update: (input: {
    transactionId: string;
    userId: string;
    type?: "expense" | "income";
    amountEuros?: number;
    date?: Date;
    categoryId?: string | null;
    note?: string;
  }) =>
    updateTransaction({
      input,
      repo: transactionRepository,
      categoryLookup,
    }),

  delete: (input: { transactionId: string; userId: string }) =>
    deleteTransaction({ input, repo: transactionRepository }),

  countByCategoryId: (categoryId: string) =>
    transactionReadModel.countByCategoryId(categoryId),
};
