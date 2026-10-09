import { describe, expect, it } from "vitest";

import { CATEGORY_PALETTE } from "@/modules/categories/data/palette";
import { categoryNameSchema } from "@/modules/categories/domain/validators/category";

describe("categoryNameSchema color", () => {
  it("accepts any valid hex, not just palette entries", () => {
    const parsed = categoryNameSchema.parse({
      name: "Pets",
      color: "#0b7285",
    });
    expect(parsed.color).toBe("#0b7285");
  });

  it("normalizes casing and surrounding whitespace", () => {
    const parsed = categoryNameSchema.parse({
      name: "Pets",
      color: "  #22C55E ",
    });
    expect(parsed.color).toBe("#22c55e");
  });

  it("leaves the color undefined when omitted", () => {
    expect(categoryNameSchema.parse({ name: "Pets" }).color).toBeUndefined();
  });

  it.each(["red", "#fff", "#22c55", "#22c55eff", "22c55e"])(
    "rejects %s with invalidColor",
    (color) => {
      const parsed = categoryNameSchema.safeParse({ name: "Pets", color });
      expect(parsed.success).toBe(false);
      expect(parsed.error?.flatten().fieldErrors.color).toEqual([
        "invalidColor",
      ]);
    },
  );

  it("keeps palette colors unchanged", () => {
    for (const swatch of CATEGORY_PALETTE) {
      expect(categoryNameSchema.parse({ name: "X", color: swatch }).color).toBe(
        swatch,
      );
    }
  });
});