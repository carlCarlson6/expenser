import { describe, expect, it } from "vitest";
import { createTransaction } from "@/modules/ledger/application/commands/create-transaction.command";
import { deleteTransaction } from "@/modules/ledger/application/commands/delete-transaction.command";
import { updateTransaction } from "@/modules/ledger/application/commands/update-transaction.command";
import { TestTransactionRepository } from "./test-transaction.repository";
import type { CategoryLookup } from "@/modules/ledger/application/ports/category-lookup.port";
import type { TransactionIdGenerator } from "@/modules/ledger/application/ports/transaction-id-generator.port";

function createIdGenerator(): TransactionIdGenerator {
  let counter = 0;
  return { generate: () => `txn_${++counter}` };
}

function createCategoryLookup(
  ownedIds: string[] = ["cat_1"],
): CategoryLookup {
  return {
    findByIdAndUserId: async (id) =>
      ownedIds.includes(id) ? { id } : null,
  };
}

describe("Ledger application", () => {
  const userId = "user_1";

  describe("createTransaction", () => {
    it("creates an expense", async () => {
      const repo = new TestTransactionRepository();
      const result = await createTransaction({
        input: {
          userId,
          type: "expense",
          amountEuros: 12.34,
          date: new Date("2026-09-15"),
          categoryId: "cat_1",
          note: "Lunch",
        },
        deps: {
          repo,
          idGenerator: createIdGenerator(),
          categoryLookup: createCategoryLookup(),
        },
      });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.amountCents).toBe(1234);
        expect(result.value.categoryId).toBe("cat_1");
      }
    });

    it("creates an income without a category", async () => {
      const repo = new TestTransactionRepository();
      const result = await createTransaction({
        input: {
          userId,
          type: "income",
          amountEuros: 1000,
          date: new Date("2026-09-15"),
        },
        deps: {
          repo,
          idGenerator: createIdGenerator(),
          categoryLookup: createCategoryLookup(),
        },
      });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.type).toBe("income");
        expect(result.value.categoryId).toBeNull();
      }
    });

    it("rejects an expense with a missing category", async () => {
      const repo = new TestTransactionRepository();
      const result = await createTransaction({
        input: {
          userId,
          type: "expense",
          amountEuros: 12.34,
          date: new Date("2026-09-15"),
        },
        deps: {
          repo,
          idGenerator: createIdGenerator(),
          categoryLookup: createCategoryLookup(),
        },
      });
      expect(result.ok).toBe(false);
    });

    it("rejects an expense referencing another user's category", async () => {
      const repo = new TestTransactionRepository();
      const result = await createTransaction({
        input: {
          userId,
          type: "expense",
          amountEuros: 12.34,
          date: new Date("2026-09-15"),
          categoryId: "cat_other",
        },
        deps: {
          repo,
          idGenerator: createIdGenerator(),
          categoryLookup: createCategoryLookup(),
        },
      });
      expect(result.ok).toBe(false);
    });
  });

  describe("updateTransaction", () => {
    it("updates the amount", async () => {
      const repo = new TestTransactionRepository();
      const createResult = await createTransaction({
        input: {
          userId,
          type: "expense",
          amountEuros: 10,
          date: new Date("2026-09-15"),
          categoryId: "cat_1",
        },
        deps: {
          repo,
          idGenerator: createIdGenerator(),
          categoryLookup: createCategoryLookup(),
        },
      });
      if (!createResult.ok) throw new Error("unexpected");

      const result = await updateTransaction({
        input: {
          transactionId: createResult.value.id,
          userId,
          amountEuros: 20,
        },
        repo,
        categoryLookup: createCategoryLookup(),
      });
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value.amountCents).toBe(2000);
    });

    it("rejects updates to another user's transaction", async () => {
      const repo = new TestTransactionRepository();
      const createResult = await createTransaction({
        input: {
          userId,
          type: "expense",
          amountEuros: 10,
          date: new Date("2026-09-15"),
          categoryId: "cat_1",
        },
        deps: {
          repo,
          idGenerator: createIdGenerator(),
          categoryLookup: createCategoryLookup(),
        },
      });
      if (!createResult.ok) throw new Error("unexpected");

      const result = await updateTransaction({
        input: {
          transactionId: createResult.value.id,
          userId: "user_2",
          amountEuros: 20,
        },
        repo,
        categoryLookup: createCategoryLookup(),
      });
      expect(result.ok).toBe(false);
    });
  });

  describe("deleteTransaction", () => {
    it("deletes a transaction", async () => {
      const repo = new TestTransactionRepository();
      const createResult = await createTransaction({
        input: {
          userId,
          type: "expense",
          amountEuros: 10,
          date: new Date("2026-09-15"),
          categoryId: "cat_1",
        },
        deps: {
          repo,
          idGenerator: createIdGenerator(),
          categoryLookup: createCategoryLookup(),
        },
      });
      if (!createResult.ok) throw new Error("unexpected");

      const result = await deleteTransaction({
        input: { transactionId: createResult.value.id, userId },
        repo,
      });
      expect(result.ok).toBe(true);
      expect(await repo.findById(createResult.value.id)).toBeNull();
    });
  });
});
