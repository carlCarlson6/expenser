import { describe, expect, it } from "vitest";
import { Category } from "@/modules/categories/domain/category";

describe("Category", () => {
  const validProps = {
    id: "cat_123",
    userId: "user_1",
    name: "Food",
    color: "#22c55e",
    icon: "utensils",
  };

  describe("create", () => {
    it("creates a valid category", () => {
      const result = Category.create(validProps);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.id).toBe("cat_123");
        expect(result.value.name).toBe("Food");
        expect(result.value.color).toBe("#22c55e");
        expect(result.value.icon).toBe("utensils");
      }
    });

    it("trims and lowercases the color", () => {
      const result = Category.create({
        ...validProps,
        name: "  Food  ",
        color: "#22C55E",
      });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.name).toBe("Food");
        expect(result.value.color).toBe("#22c55e");
      }
    });

    it("rejects empty names", () => {
      const result = Category.create({ ...validProps, name: "   " });
      expect(result.ok).toBe(false);
    });

    it("rejects names that are too long", () => {
      const result = Category.create({ ...validProps, name: "a".repeat(61) });
      expect(result.ok).toBe(false);
    });

    it("rejects invalid hex colors", () => {
      const result = Category.create({ ...validProps, color: "red" });
      expect(result.ok).toBe(false);
    });

    it("rejects missing icons", () => {
      const result = Category.create({ ...validProps, icon: "   " });
      expect(result.ok).toBe(false);
    });
  });

  describe("rename", () => {
    it("updates the name", () => {
      const category = Category.reconstitute(validProps);
      const result = category.rename("Groceries");
      expect(result.ok).toBe(true);
      expect(category.name).toBe("Groceries");
    });

    it("rejects invalid names", () => {
      const category = Category.reconstitute(validProps);
      const result = category.rename("");
      expect(result.ok).toBe(false);
    });
  });

  describe("changeAppearance", () => {
    it("updates color and icon", () => {
      const category = Category.reconstitute(validProps);
      const result = category.changeAppearance("#3b82f6", "car");
      expect(result.ok).toBe(true);
      expect(category.color).toBe("#3b82f6");
      expect(category.icon).toBe("car");
    });

    it("rejects invalid colors", () => {
      const category = Category.reconstitute(validProps);
      const result = category.changeAppearance("blue", "car");
      expect(result.ok).toBe(false);
    });
  });
});
