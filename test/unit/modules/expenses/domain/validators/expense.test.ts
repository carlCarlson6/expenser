import { describe, expect, it } from "vitest";

import {
  bulkExpensesSchema,
  toBulkFieldErrors,
} from "@/modules/expenses/domain/validators/expense";

const CAT = "3f6a1c22-0000-4000-8000-000000000001";

const validRow = {
  amount: "12.50",
  categoryId: CAT,
  spentAt: "2026-10-01",
};

describe("bulkExpensesSchema", () => {
  it("parses amounts into cents, like the single-expense schema", () => {
    const parsed = bulkExpensesSchema.parse({ rows: [validRow] });
    expect(parsed.rows[0].amount).toBe(1250);
  });

  it("treats an empty description as absent", () => {
    const parsed = bulkExpensesSchema.parse({
      rows: [{ ...validRow, description: "  " }],
    });
    expect(parsed.rows[0].description).toBeUndefined();
  });

  it("reports which row and field failed", () => {
    const parsed = bulkExpensesSchema.safeParse({
      rows: [validRow, { ...validRow, amount: "abc" }],
    });
    expect(parsed.success).toBe(false);
    if (parsed.success) return;

    const fieldErrors = toBulkFieldErrors(parsed.error);
    expect(fieldErrors["rows.1.amount"]).toContain("invalidAmount");
    expect(fieldErrors["rows.0.amount"]).toBeUndefined();
  });

  it("collects several failures across different rows at once", () => {
    const parsed = bulkExpensesSchema.safeParse({
      rows: [
        { ...validRow, amount: "nope" },
        { ...validRow, spentAt: "01/10/2026" },
      ],
    });
    expect(parsed.success).toBe(false);
    if (parsed.success) return;

    const fieldErrors = toBulkFieldErrors(parsed.error);
    expect(fieldErrors["rows.0.amount"]).toBeDefined();
    expect(fieldErrors["rows.1.spentAt"]).toContain("invalidDate");
  });
});