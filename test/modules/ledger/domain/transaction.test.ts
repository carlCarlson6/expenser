import { describe, expect, it } from "vitest";
import { Money } from "@/shared/kernel/money";
import { Transaction } from "@/modules/ledger/domain/transaction";

describe("Transaction", () => {
  const baseProps = {
    id: "txn_1",
    userId: "user_1",
    type: "expense" as const,
    amount: Money.reconstitute(1234),
    date: new Date("2026-09-15"),
    categoryId: "cat_1",
    note: "Lunch",
  };

  describe("create", () => {
    it("creates a valid expense", () => {
      const result = Transaction.create(baseProps);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.type).toBe("expense");
        expect(result.value.amount.cents).toBe(1234);
        expect(result.value.categoryId).toBe("cat_1");
      }
    });

    it("creates a valid income without a category", () => {
      const result = Transaction.create({
        ...baseProps,
        type: "income",
        categoryId: null,
      });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.type).toBe("income");
        expect(result.value.categoryId).toBeNull();
      }
    });

    it("rejects an expense without a category", () => {
      const result = Transaction.create({ ...baseProps, categoryId: null });
      expect(result.ok).toBe(false);
    });

    it("rejects income with a category", () => {
      const result = Transaction.create({
        ...baseProps,
        type: "income",
      });
      expect(result.ok).toBe(false);
    });

    it("rejects zero amount", () => {
      const result = Transaction.create({
        ...baseProps,
        amount: Money.reconstitute(0),
      });
      expect(result.ok).toBe(false);
    });
  });
});
