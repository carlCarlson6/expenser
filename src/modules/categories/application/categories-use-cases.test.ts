import { describe, expect, it } from "vitest";
import { Category } from "@/modules/categories/domain/category";
import { createCategory } from "./commands/create-category.command";
import { deleteCategory } from "./commands/delete-category.command";
import { seedDefaultCategories } from "./commands/seed-default-categories.command";
import { updateCategory } from "./commands/update-category.command";
import { listCategories } from "./queries/list-categories.query";
import { TestCategoryRepository } from "./test-category.repository";
import type { CategoryIdGenerator } from "./ports/category-id-generator.port";
import type { CategoryUsageChecker } from "./ports/category-usage-checker.port";

function createIdGenerator(): CategoryIdGenerator {
  let counter = 0;
  return {
    generate: () => `cat_${++counter}`,
  };
}

function createUsageChecker(inUseIds: string[] = []): CategoryUsageChecker {
  return {
    isCategoryInUse: async (id) => inUseIds.includes(id),
  };
}

describe("Categories application", () => {
  const userId = "user_1";

  describe("listCategories", () => {
    it("returns categories for a user sorted by name", async () => {
      const repo = new TestCategoryRepository();
      const category = Category.create({
        id: "cat_1",
        userId,
        name: "Food",
        color: "#22c55e",
        icon: "utensils",
      });
      if (!category.ok) throw new Error("unexpected");
      await repo.save(category.value);

      const result = await listCategories({ userId, repo });
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Food");
    });
  });

  describe("createCategory", () => {
    it("creates a category and returns a DTO", async () => {
      const repo = new TestCategoryRepository();
      const result = await createCategory({
        input: { userId, name: "Food", color: "#22c55e", icon: "utensils" },
        deps: { repo, idGenerator: createIdGenerator() },
      });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.name).toBe("Food");
      }
    });

    it("rejects duplicate names case-insensitively", async () => {
      const repo = new TestCategoryRepository();
      const deps = { repo, idGenerator: createIdGenerator() };
      await createCategory({
        input: { userId, name: "Food", color: "#22c55e", icon: "utensils" },
        deps,
      });
      const result = await createCategory({
        input: { userId, name: "  food  ", color: "#22c55e", icon: "utensils" },
        deps,
      });
      expect(result.ok).toBe(false);
    });

    it("rejects invalid domain input", async () => {
      const repo = new TestCategoryRepository();
      const result = await createCategory({
        input: { userId, name: "", color: "#22c55e", icon: "utensils" },
        deps: { repo, idGenerator: createIdGenerator() },
      });
      expect(result.ok).toBe(false);
    });
  });

  describe("updateCategory", () => {
    it("updates a category", async () => {
      const repo = new TestCategoryRepository();
      const category = Category.create({
        id: "cat_1",
        userId,
        name: "Food",
        color: "#22c55e",
        icon: "utensils",
      });
      if (!category.ok) throw new Error("unexpected");
      await repo.save(category.value);

      const result = await updateCategory({
        input: { categoryId: "cat_1", userId, name: "Groceries" },
        repo,
      });
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value.name).toBe("Groceries");
    });

    it("rejects updates to another user's category", async () => {
      const repo = new TestCategoryRepository();
      const category = Category.create({
        id: "cat_1",
        userId,
        name: "Food",
        color: "#22c55e",
        icon: "utensils",
      });
      if (!category.ok) throw new Error("unexpected");
      await repo.save(category.value);

      const result = await updateCategory({
        input: { categoryId: "cat_1", userId: "user_2", name: "Groceries" },
        repo,
      });
      expect(result.ok).toBe(false);
    });
  });

  describe("deleteCategory", () => {
    it("deletes an unused category", async () => {
      const repo = new TestCategoryRepository();
      const category = Category.create({
        id: "cat_1",
        userId,
        name: "Food",
        color: "#22c55e",
        icon: "utensils",
      });
      if (!category.ok) throw new Error("unexpected");
      await repo.save(category.value);

      const result = await deleteCategory({
        input: { categoryId: "cat_1", userId },
        repo,
        usageChecker: createUsageChecker(),
      });
      expect(result.ok).toBe(true);
      expect(await repo.findById("cat_1")).toBeNull();
    });

    it("refuses to delete a category that is in use", async () => {
      const repo = new TestCategoryRepository();
      const category = Category.create({
        id: "cat_1",
        userId,
        name: "Food",
        color: "#22c55e",
        icon: "utensils",
      });
      if (!category.ok) throw new Error("unexpected");
      await repo.save(category.value);

      const result = await deleteCategory({
        input: { categoryId: "cat_1", userId },
        repo,
        usageChecker: createUsageChecker(["cat_1"]),
      });
      expect(result.ok).toBe(false);
    });
  });

  describe("seedDefaultCategories", () => {
    it("seeds defaults when the user has no categories", async () => {
      const repo = new TestCategoryRepository();
      const result = await seedDefaultCategories({
        input: { userId },
        deps: { repo, idGenerator: createIdGenerator() },
      });
      expect(result.length).toBeGreaterThan(0);
      const all = await listCategories({ userId, repo });
      expect(all.length).toBe(result.length);
    });

    it("is idempotent", async () => {
      const repo = new TestCategoryRepository();
      const deps = { repo, idGenerator: createIdGenerator() };
      const first = await seedDefaultCategories({ input: { userId }, deps });
      const second = await seedDefaultCategories({ input: { userId }, deps });
      expect(second.length).toBe(first.length);
    });
  });
});
