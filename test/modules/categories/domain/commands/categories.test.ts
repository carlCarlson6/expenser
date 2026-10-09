import { describe, expect, it } from "vitest";

import type { Category } from "@/modules/categories/data/schema";
import type { Expense } from "@/modules/expenses/data/schema";
import type { Actor } from "@/modules/users/domain/types";
import { DomainError } from "@/modules/users/domain/types";
import { createFakeRepos } from "@/shared/testing/fake-repos";

import { createCategory } from "@/modules/categories/domain/commands/create-category";
import { deleteCategory } from "@/modules/categories/domain/commands/delete-category";
import { renameCategory } from "@/modules/categories/domain/commands/rename-category";
import { setCategoryColor } from "@/modules/categories/domain/commands/set-category-color";

const actor: Actor = {
  profileId: "p1",
  clerkUserId: "clerk-1",
  locale: "es",
  currency: "USD",
};

const other: Category = {
  id: "cat-other",
  profileId: "p1",
  name: "Otros",
  color: "#64748b",
  isProtected: true,
  createdAt: new Date(),
};

const food: Category = {
  id: "cat-food",
  profileId: "p1",
  name: "Supermercado",
  color: "#22c55e",
  isProtected: false,
  createdAt: new Date(),
};

const expense = (overrides: Partial<Expense> = {}): Expense => ({
  id: "e1",
  profileId: "p1",
  categoryId: "cat-food",
  amountCents: 1000,
  description: null,
  spentAt: "2026-10-01",
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe("createCategory", () => {
  it("creates a category", async () => {
    const { repos } = createFakeRepos();
    const created = await createCategory(repos, actor, { name: "Mascotas" });
    expect(created.name).toBe("Mascotas");
    expect(created.isProtected).toBe(false);
  });

  it("assigns the requested color", async () => {
    const { repos } = createFakeRepos();
    const created = await createCategory(repos, actor, {
      name: "Mascotas",
      color: "#ff00ff",
    });
    expect(created.color).toBe("#ff00ff");
  });

  it("picks an unused palette color when none is given", async () => {
    const { repos } = createFakeRepos({ categories: [food, other] });
    const created = await createCategory(repos, actor, { name: "Mascotas" });
    expect(created.color).toMatch(/^#[0-9a-f]{6}$/);
    expect([food.color, other.color]).not.toContain(created.color);
  });

  it("rejects duplicate names case-insensitively", async () => {
    const { repos } = createFakeRepos({ categories: [food] });
    await expect(
      createCategory(repos, actor, { name: "supermercado" }),
    ).rejects.toThrow(DomainError);
    await expect(
      createCategory(repos, actor, { name: "supermercado" }),
    ).rejects.toMatchObject({ code: "nameTaken" });
  });
});

describe("renameCategory", () => {
  it("renames a category", async () => {
    const { repos } = createFakeRepos({ categories: [food] });
    const updated = await renameCategory(repos, actor, {
      id: food.id,
      name: "Comida",
    });
    expect(updated.name).toBe("Comida");
  });

  it("allows renaming the protected category", async () => {
    const { repos } = createFakeRepos({ categories: [other] });
    const updated = await renameCategory(repos, actor, {
      id: other.id,
      name: "Varios",
    });
    expect(updated.name).toBe("Varios");
  });

  it("fails when the category belongs to another profile", async () => {
    const { repos } = createFakeRepos({ categories: [food] });
    const stranger: Actor = { ...actor, profileId: "p2" };
    await expect(
      renameCategory(repos, stranger, { id: food.id, name: "X" }),
    ).rejects.toMatchObject({ code: "notFound" });
  });

  it("rejects a name used by another category", async () => {
    const { repos } = createFakeRepos({ categories: [food, other] });
    await expect(
      renameCategory(repos, actor, { id: food.id, name: "otros" }),
    ).rejects.toMatchObject({ code: "nameTaken" });
  });

  it("updates name and color together", async () => {
    const { repos } = createFakeRepos({ categories: [food] });
    const updated = await renameCategory(repos, actor, {
      id: food.id,
      name: "Comida",
      color: "#123456",
    });
    expect(updated.name).toBe("Comida");
    expect(updated.color).toBe("#123456");
  });

  it("keeps the existing color when renaming without one", async () => {
    const { repos } = createFakeRepos({ categories: [food] });
    const updated = await renameCategory(repos, actor, {
      id: food.id,
      name: "Comida",
    });
    expect(updated.color).toBe(food.color);
  });
});

describe("setCategoryColor", () => {
  it("changes only the color", async () => {
    const { repos } = createFakeRepos({ categories: [food] });
    const updated = await setCategoryColor(repos, actor, {
      id: food.id,
      color: "#abcdef",
    });
    expect(updated.color).toBe("#abcdef");
    expect(updated.name).toBe(food.name);
  });

  it("fails for another profile's category", async () => {
    const { repos } = createFakeRepos({ categories: [food] });
    await expect(
      setCategoryColor(repos, { ...actor, profileId: "p2" }, {
        id: food.id,
        color: "#abcdef",
      }),
    ).rejects.toMatchObject({ code: "notFound" });
  });
});

describe("deleteCategory", () => {
  it("reassigns expenses to the protected category before deleting", async () => {
    const { repos, stores } = createFakeRepos({
      categories: [food, other],
      expenses: [expense({ id: "e1" }), expense({ id: "e2" })],
    });
    await deleteCategory(repos, actor, { id: food.id });

    expect(stores.categories.has(food.id)).toBe(false);
    for (const e of stores.expenses.values()) {
      expect(e.categoryId).toBe(other.id);
    }
  });

  it("refuses to delete the protected category", async () => {
    const { repos } = createFakeRepos({ categories: [other] });
    await expect(
      deleteCategory(repos, actor, { id: other.id }),
    ).rejects.toMatchObject({ code: "protectedCategory" });
  });

  it("fails when the category does not exist", async () => {
    const { repos } = createFakeRepos({ categories: [other] });
    await expect(
      deleteCategory(repos, actor, { id: "missing" }),
    ).rejects.toMatchObject({ code: "notFound" });
  });
});
