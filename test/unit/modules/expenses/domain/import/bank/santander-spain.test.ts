import { describe, expect, it } from "vitest";

import {
  isBankParseFailure,
  parseSantanderSpainSheet,
} from "@/modules/expenses/domain/import/bank";

import grid from "./fixtures/santander-grid.json";

describe("parseSantanderSpainSheet", () => {
  it("locates the Movimientos header and returns only expense rows", () => {
    const result = parseSantanderSpainSheet(grid as string[][]);

    expect(isBankParseFailure(result)).toBe(false);
    if (isBankParseFailure(result)) return;

    expect(result.rows).toHaveLength(9);

    expect(result.rows[0]).toEqual({
      spentAt: "2026-10-09",
      amount: "22.80",
      categoryName: "",
      description: "Pago Movil En Supermercado Local, Tarj. :*841010",
    });

    expect(result.rows[1]).toEqual({
      spentAt: "2026-10-08",
      amount: "6.95",
      categoryName: "",
      description: "Pago Movil En Cafeteria, Tarj. :*841010",
    });
  });

  it("converts Spanish-formatted amounts to positive expense amounts", () => {
    const result = parseSantanderSpainSheet(grid as string[][]);
    if (isBankParseFailure(result)) return;

    const largeAmountRow = result.rows.find(
      (row) => row.description === "Compra Online Marketplace",
    );
    expect(largeAmountRow).toEqual({
      spentAt: "2026-09-25",
      amount: "1234.56",
      categoryName: "",
      description: "Compra Online Marketplace",
    });
  });

  it("skips income (positive) and zero-amount rows", () => {
    const result = parseSantanderSpainSheet(grid as string[][]);
    if (isBankParseFailure(result)) return;

    const descriptions = result.rows.map((row) => row.description);
    expect(descriptions).not.toContain(
      "Transferencia De Empresa, Concepto Nomina Septiembre.",
    );
    expect(descriptions).not.toContain("Pago Movil En Estanco");
  });

  it("keeps malformed rows as invalid so the user can fix them", () => {
    const result = parseSantanderSpainSheet(grid as string[][]);
    if (isBankParseFailure(result)) return;

    const malformedDate = result.rows.find(
      (row) => row.description === "Fecha malformada",
    );
    expect(malformedDate?.spentAt).toBe("fecha inválida");

    const malformedAmount = result.rows.find(
      (row) => row.description === "Importe malformado",
    );
    expect(malformedAmount?.amount).toBe("no es un importe");
  });

  it("rejects files that do not contain the Santander header", () => {
    const result = parseSantanderSpainSheet([
      ["Date", "Description", "Amount"],
      ["2026-10-09", "Coffee", "-2.50"],
    ]);

    expect(isBankParseFailure(result)).toBe(true);
    if (!isBankParseFailure(result)) return;

    expect(result.error).toBe("import.bankFormatMismatch");
  });

  it("returns an error when no expense rows are found", () => {
    const result = parseSantanderSpainSheet([
      ["", "", "", "", "", ""],
      ["FECHA OPERACIÓN", "FECHA VALOR", "CONCEPTO", "IMPORTE EUR", "SALDO", ""],
      ["09/10/2026", "09/10/2026", "Salary", "2.500,00", "2.500,00", ""],
    ]);

    expect(isBankParseFailure(result)).toBe(true);
    if (!isBankParseFailure(result)) return;

    expect(result.error).toBe("import.bankNoExpenses");
  });
});
