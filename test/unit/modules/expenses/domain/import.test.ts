import { describe, expect, it } from "vitest";

import {
  buildDraftRows,
  newCategorySummary,
  toImportPayload,
  validateDraftRow,
} from "@/modules/expenses/domain/import/draft";
import {
  EMPTY_MAPPING,
  guessColumnMapping,
  looksLikeHeader,
} from "@/modules/expenses/domain/import/mapping";
import {
  cellToText,
  importFingerprint,
  parseImportAmount,
  parseImportDate,
} from "@/modules/expenses/domain/import/values";

describe("guessColumnMapping", () => {
  it("detects English headers regardless of order", () => {
    expect(guessColumnMapping(["Description", "Amount", "Date"])).toEqual({
      spentAt: 2,
      amount: 1,
      categoryName: null,
      description: 0,
    });
  });

  it("detects Spanish headers with accents and punctuation", () => {
    expect(
      guessColumnMapping([
        "Fecha operación",
        "Importe (€)",
        "Categoría",
        "Concepto",
      ]),
    ).toEqual({ spentAt: 0, amount: 1, categoryName: 2, description: 3 });
  });

  it("leaves unknown headers unmapped", () => {
    expect(guessColumnMapping(["Foo", "Bar"])).toEqual(EMPTY_MAPPING);
  });

  it("does not claim the same column for two fields", () => {
    // "total" only aliases amount; the duplicate "Total" column is ignored.
    expect(guessColumnMapping(["Total", "Total", "Fecha"]).amount).toBe(0);
  });
});

describe("looksLikeHeader", () => {
  it("accepts a row with at least two known fields", () => {
    expect(looksLikeHeader(["Fecha", "Importe"])).toBe(true);
  });

  it("rejects a row that only coincidentally matches one alias", () => {
    expect(looksLikeHeader(["Fecha", "Foo"])).toBe(false);
  });

  it("rejects data rows", () => {
    expect(looksLikeHeader(["2026-10-01", "12,50"])).toBe(false);
  });
});

describe("parseImportDate", () => {
  it("accepts ISO dates", () => {
    expect(parseImportDate("2026-10-01", true)).toBe("2026-10-01");
    expect(parseImportDate("2026/10/01", true)).toBe("2026-10-01");
    expect(parseImportDate("2026.10.01", true)).toBe("2026-10-01");
  });

  it("drops any time part", () => {
    expect(parseImportDate("2026-10-01T12:30:00Z", true)).toBe("2026-10-01");
    expect(parseImportDate("01/10/2026 12:30", true)).toBe("2026-10-01");
  });

  it("resolves ambiguous dates with the day-first flag", () => {
    expect(parseImportDate("03/04/2026", true)).toBe("2026-04-03");
    expect(parseImportDate("03/04/2026", false)).toBe("2026-03-04");
    expect(parseImportDate("03-04-2026", true)).toBe("2026-04-03");
  });

  it("resolves unambiguous dates regardless of the flag", () => {
    expect(parseImportDate("25/12/2026", false)).toBe("2026-12-25");
    expect(parseImportDate("12/25/2026", true)).toBe("2026-12-25");
  });

  it("rejects impossible or unparseable dates", () => {
    expect(parseImportDate("31/02/2026", true)).toBeNull();
    expect(parseImportDate("13/13/2026", true)).toBeNull();
    expect(parseImportDate("", true)).toBeNull();
    expect(parseImportDate("not a date", true)).toBeNull();
    expect(parseImportDate("01/10/26", true)).toBeNull();
  });
});

describe("parseImportAmount", () => {
  it("parses both decimal separators", () => {
    expect(parseImportAmount("12.34")).toBe(1234);
    expect(parseImportAmount("12,34")).toBe(1234);
    expect(parseImportAmount("1.234,56")).toBe(123456);
    expect(parseImportAmount("1,234.56")).toBe(123456);
  });

  it("ignores currency symbols, letters and spaces", () => {
    expect(parseImportAmount("€ 12,50")).toBe(1250);
    expect(parseImportAmount("$12.50")).toBe(1250);
    expect(parseImportAmount("EUR 1.234,56")).toBe(123456);
  });

  it("treats negative amounts as expenses", () => {
    expect(parseImportAmount("-12.34")).toBe(1234);
    expect(parseImportAmount("(12,34)")).toBe(1234);
    expect(parseImportAmount("12,34-")).toBe(1234);
  });

  it("rejects zero and unparseable amounts", () => {
    expect(parseImportAmount("0")).toBeNull();
    expect(parseImportAmount("")).toBeNull();
    expect(parseImportAmount("abc")).toBeNull();
  });
});

describe("cellToText", () => {
  it("maps empty cells to an empty string", () => {
    expect(cellToText(null)).toBe("");
    expect(cellToText(undefined)).toBe("");
  });

  it("stringifies numbers and booleans", () => {
    expect(cellToText(42)).toBe("42");
    expect(cellToText(12.5)).toBe("12.5");
    expect(cellToText(true)).toBe("true");
  });

  it("formats dates in UTC so Excel serial dates keep their day", () => {
    expect(cellToText(new Date(Date.UTC(2026, 9, 1)))).toBe("2026-10-01");
  });
});

describe("importFingerprint", () => {
  it("ignores description case and whitespace", () => {
    expect(
      importFingerprint({
        spentAt: "2026-10-01",
        amountCents: 1234,
        description: "  Pan   de leche ",
      }),
    ).toBe(
      importFingerprint({
        spentAt: "2026-10-01",
        amountCents: 1234,
        description: "pan de leche",
      }),
    );
  });

  it("changes with day, amount and description", () => {
    const base = { spentAt: "2026-10-01", amountCents: 1234, description: "Pan" };
    expect(importFingerprint({ ...base, spentAt: "2026-10-02" })).not.toBe(
      importFingerprint(base),
    );
    expect(importFingerprint({ ...base, amountCents: 1235 })).not.toBe(
      importFingerprint(base),
    );
    expect(importFingerprint({ ...base, description: "Leche" })).not.toBe(
      importFingerprint(base),
    );
  });

  it("treats missing and empty descriptions the same", () => {
    const row = { spentAt: "2026-10-01", amountCents: 100 };
    expect(importFingerprint(row)).toBe(
      importFingerprint({ ...row, description: "  " }),
    );
  });
});

describe("buildDraftRows", () => {
  const mapping = { spentAt: 0, amount: 1, categoryName: 2, description: 3 };

  it("skips the header row when told to", () => {
    const rows = buildDraftRows(
      [
        ["Fecha", "Importe", "Categoría", "Concepto"],
        ["2026-10-01", "12,50", "Café", "Desayuno"],
      ],
      true,
      mapping,
    );
    expect(rows).toEqual([
      {
        spentAt: "2026-10-01",
        amount: "12,50",
        categoryName: "Café",
        description: "Desayuno",
      },
    ]);
  });

  it("keeps the first row when there is no header", () => {
    const rows = buildDraftRows([["2026-10-01", "12,50"]], false, mapping);
    expect(rows).toHaveLength(1);
    expect(rows[0].categoryName).toBe("");
  });

  it("maps missing columns to empty strings", () => {
    const rows = buildDraftRows([["2026-10-01", "12,50"]], false, EMPTY_MAPPING);
    expect(rows[0]).toEqual({
      spentAt: "",
      amount: "",
      categoryName: "",
      description: "",
    });
  });
});

describe("validateDraftRow", () => {
  const valid = {
    spentAt: "2026-10-01",
    amount: "12,50",
    categoryName: "  ",
    description: "  ",
  };

  it("normalizes a valid row", () => {
    const result = validateDraftRow(valid, true);
    expect(result).toEqual({
      isoDate: "2026-10-01",
      amountCents: 1250,
      categoryName: null,
      description: null,
      errors: {},
    });
  });

  it("reports date and amount problems per field", () => {
    const result = validateDraftRow(
      { ...valid, spentAt: "31/02/2026", amount: "abc" },
      true,
    );
    expect(result.errors).toEqual({
      spentAt: "invalidDate",
      amount: "invalidAmount",
    });
  });

  it("enforces the server-side length limits", () => {
    const result = validateDraftRow(
      {
        ...valid,
        categoryName: "x".repeat(51),
        description: "y".repeat(201),
      },
      true,
    );
    expect(result.errors).toEqual({
      categoryName: "nameTooLong",
      description: "descriptionTooLong",
    });
  });
});

describe("newCategorySummary", () => {
  it("groups spellings that normalize together and skips existing names", () => {
    const rows = [
      validateDraftRow(
        {
          spentAt: "2026-10-01",
          amount: "1",
          categoryName: "Café",
          description: "",
        },
        true,
      ),
      validateDraftRow(
        {
          spentAt: "2026-10-02",
          amount: "2",
          categoryName: "cafe",
          description: "",
        },
        true,
      ),
      validateDraftRow(
        {
          spentAt: "2026-10-03",
          amount: "3",
          categoryName: "Supermercado",
          description: "",
        },
        true,
      ),
      validateDraftRow(
        {
          spentAt: "",
          amount: "4",
          categoryName: "Rota",
          description: "",
        },
        true,
      ),
    ];

    expect(newCategorySummary(rows, new Set(["supermercado"]))).toEqual([
      { name: "Café", count: 2 },
    ]);
  });
});

describe("toImportPayload", () => {
  it("maps validated rows to the wire shape", () => {
    const row = validateDraftRow(
      {
        spentAt: "01/10/2026",
        amount: "€12,50",
        categoryName: " Café ",
        description: " Desayuno ",
      },
      true,
    );
    expect(toImportPayload([row])).toEqual([
      {
        spentAt: "2026-10-01",
        amountCents: 1250,
        categoryName: "Café",
        description: "Desayuno",
      },
    ]);
  });
});
