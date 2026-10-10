import { describe, expect, it } from "vitest";

import {
  centsToInput,
  formatCents,
  parseAmountToCents,
} from "@/shared/money/money";

describe("parseAmountToCents", () => {
  it.each([
    ["12.34", 1234],
    ["12,34", 1234],
    ["0.01", 1],
    ["1234", 123400],
    ["1 234,56", 123456],
    ["1,234.56", 123456],
    ["1.234,56", 123456],
    ["1,234", 123400],
    ["1.234", 123400],
  ])("parses %s as %i cents", (input, expected) => {
    expect(parseAmountToCents(input)).toBe(expected);
  });

  it.each(["", "abc", "0", "-5", "0.00", "12,34,56", "1.234.567"])(
    "rejects %s",
    (input) => {
      expect(parseAmountToCents(input)).toBeNull();
    },
  );
});

describe("centsToInput", () => {
  it("formats cents for input default values", () => {
    expect(centsToInput(1234)).toBe("12.34");
    expect(centsToInput(5)).toBe("0.05");
  });
});

describe("formatCents", () => {
  it("formats with currency and locale", () => {
    expect(formatCents(123456, "EUR", "es-ES")).toContain("1");
    expect(formatCents(123456, "EUR", "es-ES")).toContain("234,56");
    expect(formatCents(1234, "USD", "en-US")).toBe("$12.34");
  });
});
