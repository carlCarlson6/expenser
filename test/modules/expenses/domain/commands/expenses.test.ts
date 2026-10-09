import { describe, expect, it } from "vitest";

import type { Category } from "@/modules/categories/data/schema";
import type { Expense } from "@/modules/expenses/data/schema";
import type { Actor } from "@/modules/users/domain/types";
import { createFakeRepos } from "@/shared/testing/fake-repos";

import { createExpense } from "@/modules/expenses/domain/commands/create-expense";
import { deleteExpense } from "@/modules/expenses/domain/commands/delete-expense";
import { updateExpense } from "@/modules/expenses/domain/commands/update-expense";

const actor: Actor = {
  profileId: "p1",
  clerkUserId: "clerk-1",
  locale: "es",
  currency: "USD",
};

const food: Category = {
  id: "cat-food",
  profileId: "p1",
  name: "Supermercado",
  color: "#22c55e",
  isProtected: false,
  createdAt: new Date(),
};

const someoneElsesCategory: Category = {
  id: "cat-foreign",
  profileId: "p2",
  name: "Ajena",
  color: "#ef4444",
  isProtected: false,
  createdAt: new Date(),
};

const input = { amount: 1299, categoryId: food.id, spentAt: "2026-10-09" };

describe("createExpense", () => {
  it("creates an expense in an owned category", async () => {
    const { repos } = createFakeRepos({ categories: [food] });
    const created = await createExpense(repos, actor, input);
    expect(created.amountCents).toBe(1299);
    expect(created.profileId).toBe("p1");
  });

  it("rejects a category owned by another profile", async () => {
    const { repos } = createFakeRepos({
      categories: [food, someoneElsesCategory],
    });
    await expect(
      createExpense(repos, actor, {
        ...input,
        categoryId: someoneElsesCategory.id,
      }),
    ).rejects.toMatchObject({ code: "notFound" });
  });
});

describe("updateExpense", () => {
  const existing: Expense = {
    id: "e1",
    profileId: "p1",
    categoryId: food.id,
    amountCents: 500,
    description: "old",
    spentAt: "2026-10-01",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it("updates an owned expense", async () => {
    const { repos } = createFakeRepos({
      categories: [food],
      expenses: [existing],
    });
    const updated = await updateExpense(repos, actor, {
      id: "e1",
      ...input,
      description: "new",
    });
    expect(updated.amountCents).toBe(1299);
    expect(updated.description).toBe("new");
  });

  it("fails for another profile's expense", async () => {
    const { repos } = createFakeRepos({
      categories: [food],
      expenses: [existing],
    });
    await expect(
      updateExpense(repos, { ...actor, profileId: "p2" }, { id: "e1", ...input }),
    ).rejects.toMatchObject({ code: "notFound" });
  });
});

describe("deleteExpense", () => {
  it("deletes an owned expense", async () => {
    const existing: Expense = {
      id: "e1",
      profileId: "p1",
      categoryId: food.id,
      amountCents: 500,
      description: null,
      spentAt: "2026-10-01",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const { repos, stores } = createFakeRepos({ expenses: [existing] });
    await deleteExpense(repos, actor, { id: "e1" });
    expect(stores.expenses.size).toBe(0);
  });

  it("fails when the expense does not exist", async () => {
    const { repos } = createFakeRepos();
    await expect(
      deleteExpense(repos, actor, { id: "missing" }),
    ).rejects.toMatchObject({ code: "notFound" });
  });
});
