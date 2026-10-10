import { describe, expect, it } from "vitest";

import { normalizeCategoryName } from "@/modules/categories/domain/normalize-name";

describe("normalizeCategoryName", () => {
  it("ignores case", () => {
    expect(normalizeCategoryName("GROCERIES")).toBe("groceries");
  });

  it("strips diacritics", () => {
    expect(normalizeCategoryName("Alimentación")).toBe("alimentacion");
    expect(normalizeCategoryName("Café")).toBe("cafe");
  });

  it("trims and collapses internal whitespace", () => {
    expect(normalizeCategoryName("  Dining   out  ")).toBe("dining out");
  });

  it("treats accented and plain spellings as the same key", () => {
    expect(normalizeCategoryName("Alimentación")).toBe(
      normalizeCategoryName("alimentacion"),
    );
  });

  it("keeps otherwise significant characters", () => {
    expect(normalizeCategoryName("E2E")).toBe("e2e");
    expect(normalizeCategoryName("C++")).toBe("c++");
  });
});
