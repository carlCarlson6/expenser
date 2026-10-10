import { randomUUID } from "node:crypto";

import { describe, expect, it } from "vitest";

import { createExpense } from "@/modules/expenses/domain/commands/create-expense";
import { createExpensesBulk } from "@/modules/expenses/domain/commands/create-expenses-bulk";
import { deleteExpense } from "@/modules/expenses/domain/commands/delete-expense";
import { updateExpense } from "@/modules/expenses/domain/commands/update-expense";

import { runInTransaction } from "@/shared/db/repos";

import { categoryNamed, createTestDb } from "@test/shared/db/fixtures";

const { db, repos, createActor } = createTestDb();

describe("createExpense", () => {
  it("persists an expense in an owned category", async () => {
    const actor = await createActor();
    const food = await categoryNamed(repos, actor, "Supermercado");

    const created = await createExpense(repos, actor, {
      amount: 1299,
      categoryId: food.id,
      spentAt: "2026-10-09",
    });

    expect(created.amountCents).toBe(1299);
    expect(created.profileId).toBe(actor.profileId);
    expect(
      await repos.expenses.findById(actor.profileId, created.id),
    ).toMatchObject({ amountCents: 1299 });
  });

  it("rejects a category owned by another profile", async () => {
    const actor = await createActor();
    const stranger = await createActor();
    const foreign = await categoryNamed(repos, stranger, "Supermercado");

    await expect(
      createExpense(repos, actor, {
        amount: 1299,
        categoryId: foreign.id,
        spentAt: "2026-10-09",
      }),
    ).rejects.toMatchObject({ code: "notFound" });
  });
});

describe("createExpensesBulk", () => {
  it("creates every row of a batch", async () => {
    const actor = await createActor();
    const food = await categoryNamed(repos, actor, "Supermercado");

    const inserted = await createExpensesBulk(repos, actor, [
      {
        amount: 1299,
        categoryId: food.id,
        description: "Pan",
        spentAt: "2026-10-01",
      },
      { amount: 450, categoryId: food.id, spentAt: "2026-10-02" },
    ]);

    expect(inserted).toBe(2);
    expect(await repos.expenses.countByProfile(actor.profileId)).toBe(2);
  });

  it("resolves a repeated category only once per batch", async () => {
    const actor = await createActor();
    const food = await categoryNamed(repos, actor, "Supermercado");
    let lookups = 0;
    // Real repository, wrapped only to count the lookups it receives.
    const categories = {
      ...repos.categories,
      findById: (profileId: string, categoryId: string) => {
        lookups++;
        return repos.categories.findById(profileId, categoryId);
      },
    };

    await createExpensesBulk({ ...repos, categories }, actor, [
      { amount: 1299, categoryId: food.id, spentAt: "2026-10-01" },
      { amount: 450, categoryId: food.id, spentAt: "2026-10-02" },
    ]);

    expect(lookups).toBe(1);
  });

  it("writes nothing when one row points at a foreign category", async () => {
    const actor = await createActor();
    const stranger = await createActor();
    const food = await categoryNamed(repos, actor, "Supermercado");
    const foreign = await categoryNamed(repos, stranger, "Supermercado");

    await expect(
      createExpensesBulk(
        repos,
        actor,
        [
          { amount: 1299, categoryId: food.id, spentAt: "2026-10-01" },
          { amount: 700, categoryId: foreign.id, spentAt: "2026-10-03" },
        ],
        (fn) => runInTransaction(db, fn),
      ),
    ).rejects.toMatchObject({ code: "notFound" });

    expect(await repos.expenses.countByProfile(actor.profileId)).toBe(0);
  });

  it("rejects an empty batch", async () => {
    const actor = await createActor();

    await expect(createExpensesBulk(repos, actor, [])).rejects.toMatchObject({
      code: "bulkEmpty",
    });
  });

  it("routes the write through the injected transaction runner", async () => {
    const actor = await createActor();
    const food = await categoryNamed(repos, actor, "Supermercado");
    let ran = false;

    await createExpensesBulk(
      repos,
      actor,
      [
        { amount: 1299, categoryId: food.id, spentAt: "2026-10-01" },
        { amount: 450, categoryId: food.id, spentAt: "2026-10-02" },
      ],
      (fn) => {
        ran = true;
        return runInTransaction(db, fn);
      },
    );

    expect(ran).toBe(true);
    expect(await repos.expenses.countByProfile(actor.profileId)).toBe(2);
  });
});

describe("updateExpense", () => {
  it("updates an owned expense", async () => {
    const actor = await createActor();
    const food = await categoryNamed(repos, actor, "Supermercado");
    const created = await createExpense(repos, actor, {
      amount: 500,
      categoryId: food.id,
      description: "old",
      spentAt: "2026-10-01",
    });

    const updated = await updateExpense(repos, actor, {
      id: created.id,
      amount: 1299,
      categoryId: food.id,
      description: "new",
      spentAt: "2026-10-01",
    });

    expect(updated.amountCents).toBe(1299);
    expect(updated.description).toBe("new");
    expect(
      await repos.expenses.findById(actor.profileId, created.id),
    ).toMatchObject({ amountCents: 1299, description: "new" });
  });

  it("fails for another profile's expense", async () => {
    const actor = await createActor();
    const stranger = await createActor();
    const food = await categoryNamed(repos, actor, "Supermercado");
    const strangerFood = await categoryNamed(repos, stranger, "Supermercado");
    const created = await createExpense(repos, actor, {
      amount: 500,
      categoryId: food.id,
      spentAt: "2026-10-01",
    });

    await expect(
      updateExpense(repos, stranger, {
        id: created.id,
        amount: 700,
        categoryId: strangerFood.id,
        spentAt: "2026-10-01",
      }),
    ).rejects.toMatchObject({ code: "notFound" });
  });
});

describe("deleteExpense", () => {
  it("deletes an owned expense", async () => {
    const actor = await createActor();
    const food = await categoryNamed(repos, actor, "Supermercado");
    const created = await createExpense(repos, actor, {
      amount: 500,
      categoryId: food.id,
      spentAt: "2026-10-01",
    });

    await deleteExpense(repos, actor, { id: created.id });

    expect(
      await repos.expenses.findById(actor.profileId, created.id),
    ).toBeNull();
  });

  it("fails when the expense does not exist", async () => {
    const actor = await createActor();
    await expect(
      deleteExpense(repos, actor, { id: randomUUID() }),
    ).rejects.toMatchObject({ code: "notFound" });
  });
});
