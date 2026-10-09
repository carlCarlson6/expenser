import { describe, expect, it } from "vitest";

import {
  CATEGORY_PALETTE,
  isHexColor,
  nextColor,
  normalizeHex,
} from "@/modules/categories/data/palette";

describe("isHexColor", () => {
  it.each(["#ffffff", "#000000", "#22C55E", "#6366f1"])(
    "accepts %s",
    (value) => expect(isHexColor(value)).toBe(true),
  );

  it.each(["ffffff", "#fff", "#gggggg", "red", "", "#6366f1ff"])(
    "rejects %s",
    (value) => expect(isHexColor(value)).toBe(false),
  );
});

describe("normalizeHex", () => {
  it("lowercases and trims so stored colors compare equal", () => {
    expect(normalizeHex("  #22C55E ")).toBe("#22c55e");
    expect(normalizeHex("#22c55e")).toBe("#22c55e");
  });
});

describe("nextColor", () => {
  it("returns the first unused palette color", () => {
    expect(nextColor([])).toBe(CATEGORY_PALETTE[0]);
    expect(nextColor([CATEGORY_PALETTE[0]])).toBe(CATEGORY_PALETTE[1]);
  });

  it("is case-insensitive about used colors", () => {
    expect(nextColor([CATEGORY_PALETTE[0].toUpperCase()])).toBe(
      CATEGORY_PALETTE[1],
    );
  });

  it("falls back to the first color when the palette is exhausted", () => {
    expect(nextColor([...CATEGORY_PALETTE])).toBe(CATEGORY_PALETTE[0]);
  });
});
