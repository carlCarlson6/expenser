import { randomUUID } from "node:crypto";

import { describe, expect, it } from "vitest";

import { createCategory } from "@/modules/categories/domain/commands/create-category";
import { deleteCategory } from "@/modules/categories/domain/commands/delete-category";
import { renameCategory } from "@/modules/categories/domain/commands/rename-category";
import { setCategoryColor } from "@/modules/categories/domain/commands/set-category-color";
import { createExpense } from "@/modules/expenses/domain/commands/create-expense";

import { runInTransaction } from "@/shared/db/repos";

import { categoryNamed, createTestDb } from "@test/shared/db/fixtures";

const { db, repos, createActor } = createTestDb();

describe("createCategory", () => {
  it("creates a category", async () => {
    const actor = await createActor();
    const created = await createCategory(repos, actor, { name: "Mascotas" });

    expect(created.name).toBe("Mascotas");
    expect(created.isProtected).toBe(false);
    expect(
      await repos.categories.findById(actor.profileId, created.id),
    ).toMatchObject({ name: "Mascotas" });
  });

  it("assigns the requested color", async () => {
    const actor = await createActor();
    const created = await createCategory(repos, actor, {
      name: "Mascotas",
      color: "#ff00ff",
    });
    expect(created.color).toBe("#ff00ff");
  });

  it("picks an unused palette color when none is given", async () => {
    const actor = await createActor();
    // Fresh profiles use every palette color; keep two so a free one exists.
    const keep = new Set(["Supermercado", "Otros"]);
    for (const category of await repos.categories.listByProfile(actor.profileId)) {
      if (!keep.has(category.name)) {
        await runInTransaction(db, (tx) =>
          deleteCategory(tx, actor, { id: category.id }),
        );
      }
    }
    const used = await repos.categories.listByProfile(actor.profileId);

    const created = await createCategory(repos, actor, { name: "Mascotas" });

    expect(created.color).toMatch(/^#[0-9a-f]{6}$/);
    expect(used.map((c) => c.color)).not.toContain(created.color);
  });

  it("rejects duplicate names case-insensitively", async () => {
    const actor = await createActor();
    await expect(
      createCategory(repos, actor, { name: "supermercado" }),
    ).rejects.toMatchObject({ code: "nameTaken" });
  });
});

describe("renameCategory", () => {
  it("renames a category", async () => {
    const actor = await createActor();
    const food = await categoryNamed(repos, actor, "Supermercado");

    const updated = await renameCategory(repos, actor, {
      id: food.id,
      name: "Comida",
    });

    expect(updated.name).toBe("Comida");
    expect(
      await repos.categories.findById(actor.profileId, food.id),
    ).toMatchObject({ name: "Comida" });
  });

  it("allows renaming the protected category", async () => {
    const actor = await createActor();
    const other = await categoryNamed(repos, actor, "Otros");

    const updated = await renameCategory(repos, actor, {
      id: other.id,
      name: "Varios",
    });

    expect(updated.name).toBe("Varios");
  });

  it("fails when the category belongs to another profile", async () => {
    const actor = await createActor();
    const stranger = await createActor();
    const foreign = await categoryNamed(repos, stranger, "Supermercado");

    await expect(
      renameCategory(repos, actor, { id: foreign.id, name: "X" }),
    ).rejects.toMatchObject({ code: "notFound" });
  });

  it("rejects a name used by another category", async () => {
    const actor = await createActor();
    const food = await categoryNamed(repos, actor, "Supermercado");

    await expect(
      renameCategory(repos, actor, { id: food.id, name: "otros" }),
    ).rejects.toMatchObject({ code: "nameTaken" });
  });

  it("updates name and color together", async () => {
    const actor = await createActor();
    const food = await categoryNamed(repos, actor, "Supermercado");

    const updated = await renameCategory(repos, actor, {
      id: food.id,
      name: "Comida",
      color: "#123456",
    });

    expect(updated.name).toBe("Comida");
    expect(updated.color).toBe("#123456");
  });

  it("keeps the existing color when renaming without one", async () => {
    const actor = await createActor();
    const food = await categoryNamed(repos, actor, "Supermercado");

    const updated = await renameCategory(repos, actor, {
      id: food.id,
      name: "Comida",
    });

    expect(updated.color).toBe(food.color);
  });
});

describe("setCategoryColor", () => {
  it("changes only the color", async () => {
    const actor = await createActor();
    const food = await categoryNamed(repos, actor, "Supermercado");

    const updated = await setCategoryColor(repos, actor, {
      id: food.id,
      color: "#abcdef",
    });

    expect(updated.color).toBe("#abcdef");
    expect(updated.name).toBe(food.name);
  });

  it("fails for another profile's category", async () => {
    const actor = await createActor();
    const stranger = await createActor();
    const foreign = await categoryNamed(repos, stranger, "Supermercado");

    await expect(
      setCategoryColor(repos, actor, { id: foreign.id, color: "#abcdef" }),
    ).rejects.toMatchObject({ code: "notFound" });
  });
});

describe("deleteCategory", () => {
  it("reassigns expenses to the protected category before deleting", async () => {
    const actor = await createActor();
    const food = await categoryNamed(repos, actor, "Supermercado");
    const other = await categoryNamed(repos, actor, "Otros");
    await createExpense(repos, actor, {
      amount: 1000,
      categoryId: food.id,
      spentAt: "2026-10-01",
    });
    await createExpense(repos, actor, {
      amount: 500,
      categoryId: food.id,
      spentAt: "2026-10-02",
    });

    await runInTransaction(db, (tx) => deleteCategory(tx, actor, { id: food.id }));

    expect(await repos.categories.findById(actor.profileId, food.id)).toBeNull();
    const page = await repos.expenses.list(actor.profileId, {
      page: 1,
      pageSize: 10,
    });
    expect(page.totalCount).toBe(2);
    expect(page.items.every((e) => e.categoryId === other.id)).toBe(true);
  });

  it("refuses to delete the protected category", async () => {
    const actor = await createActor();
    const other = await categoryNamed(repos, actor, "Otros");

    await expect(
      deleteCategory(repos, actor, { id: other.id }),
    ).rejects.toMatchObject({ code: "protectedCategory" });
  });

  it("fails when the category does not exist", async () => {
    const actor = await createActor();
    await expect(
      deleteCategory(repos, actor, { id: randomUUID() }),
    ).rejects.toMatchObject({ code: "notFound" });
  });
});
