import { describe, expect, it } from "vitest";

import { CATEGORY_PALETTE, isHexColor, nextColor } from "@/modules/categories/data/palette";

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
