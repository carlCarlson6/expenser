import { describe, expect, it } from "vitest";

import { CATEGORY_PALETTE } from "@/modules/categories/data/palette";
import type { TransactionRunner } from "@/modules/expenses/domain/commands/create-expenses-bulk";
import { createExpense } from "@/modules/expenses/domain/commands/create-expense";
import { importExpenses } from "@/modules/expenses/domain/commands/import-expenses";
import { importFingerprint } from "@/modules/expenses/domain/import/values";
import { listDuplicateFingerprints } from "@/modules/expenses/domain/queries/list-duplicate-fingerprints";

import { runInTransaction } from "@/shared/db/repos";

import {
  categoryNamed,
  createTestDb,
} from "@test/integration/shared/db/fixtures";

const { db, repos, createActor } = createTestDb();

const inTx: TransactionRunner = (fn) => runInTransaction(db, fn);

describe("importExpenses", () => {
  it("creates missing categories and imports every row", async () => {
    const actor = await createActor();

    const summary = await importExpenses(
      repos,
      actor,
      [
        {
          spentAt: "2026-10-01",
          amountCents: 1299,
          categoryName: "Nueva",
          description: "Uno",
        },
        { spentAt: "2026-10-02", amountCents: 450, categoryName: "Nueva" },
      ],
      inTx,
    );

    expect(summary).toEqual({ imported: 2, categoriesCreated: 1 });
    expect(await repos.expenses.countByProfile(actor.profileId)).toBe(2);

    const created = await repos.categories.findByName(
      actor.profileId,
      "Nueva",
    );
    expect(created).not.toBeNull();
    expect(CATEGORY_PALETTE).toContain(created!.color);
  });

  it("matches existing categories ignoring case and accents", async () => {
    const actor = await createActor();
    const before = (await repos.categories.listByProfile(actor.profileId))
      .length;
    const cafe = await repos.categories.create(
      actor.profileId,
      "Café",
      "#0ea5e9",
    );

    const summary = await importExpenses(
      repos,
      actor,
      [
        { spentAt: "2026-10-01", amountCents: 100, categoryName: "CAFE" },
        { spentAt: "2026-10-02", amountCents: 200, categoryName: "cafe" },
      ],
      inTx,
    );

    expect(summary.categoriesCreated).toBe(0);
    expect((await repos.categories.listByProfile(actor.profileId)).length).toBe(
      before + 1,
    );
    const { items } = await repos.expenses.list(actor.profileId, {
      page: 1,
      pageSize: 10,
    });
    expect(items.every((expense) => expense.categoryId === cafe.id)).toBe(true);
  });

  it("collapses file spellings that normalize to the same category", async () => {
    const actor = await createActor();

    const summary = await importExpenses(
      repos,
      actor,
      [
        { spentAt: "2026-10-01", amountCents: 100, categoryName: "Café" },
        { spentAt: "2026-10-02", amountCents: 200, categoryName: "cafe" },
      ],
      inTx,
    );

    expect(summary.categoriesCreated).toBe(1);
    const created = await repos.categories.findByName(
      actor.profileId,
      "Café",
    );
    expect(created).not.toBeNull();
    const { items } = await repos.expenses.list(actor.profileId, {
      page: 1,
      pageSize: 10,
    });
    expect(items.every((expense) => expense.categoryId === created!.id)).toBe(
      true,
    );
  });

  it("routes rows without a category to the protected bucket", async () => {
    const actor = await createActor();
    const other = await categoryNamed(repos, actor, "Otros");

    await importExpenses(
      repos,
      actor,
      [
        { spentAt: "2026-10-01", amountCents: 100, categoryName: null },
        { spentAt: "2026-10-02", amountCents: 200, categoryName: "   " },
      ],
      inTx,
    );

    const { items } = await repos.expenses.list(actor.profileId, {
      page: 1,
      pageSize: 10,
    });
    expect(items).toHaveLength(2);
    expect(items.every((expense) => expense.categoryId === other.id)).toBe(
      true,
    );
    expect(other.isProtected).toBe(true);
  });

  it("rolls back expenses and categories when a write fails", async () => {
    const actor = await createActor();
    const before = (await repos.categories.listByProfile(actor.profileId))
      .length;

    await expect(
      importExpenses(
        repos,
        actor,
        [
          { spentAt: "2026-10-01", amountCents: 100, categoryName: "Nueva" },
          { spentAt: "not-a-date", amountCents: 200, categoryName: "Nueva" },
        ],
        inTx,
      ),
    ).rejects.toBeTruthy();

    expect(await repos.expenses.countByProfile(actor.profileId)).toBe(0);
    expect((await repos.categories.listByProfile(actor.profileId)).length).toBe(
      before,
    );
  });

  it("routes the write through the injected transaction runner", async () => {
    const actor = await createActor();
    let ran = false;

    await importExpenses(
      repos,
      actor,
      [{ spentAt: "2026-10-01", amountCents: 100, categoryName: "Nueva" }],
      (fn) => {
        ran = true;
        return runInTransaction(db, fn);
      },
    );

    expect(ran).toBe(true);
    expect(await repos.expenses.countByProfile(actor.profileId)).toBe(1);
  });

  it("rejects an empty import", async () => {
    const actor = await createActor();

    await expect(importExpenses(repos, actor, [])).rejects.toMatchObject({
      code: "bulkEmpty",
    });
  });
});

describe("listDuplicateFingerprints", () => {
  it("returns fingerprints for existing expenses inside the range only", async () => {
    const actor = await createActor();
    const food = await categoryNamed(repos, actor, "Supermercado");
    await createExpense(repos, actor, {
      amount: 1299,
      categoryId: food.id,
      description: "Pan",
      spentAt: "2026-10-05",
    });

    const inside = await listDuplicateFingerprints(repos, actor, {
      from: "2026-10-01",
      to: "2026-10-31",
    });
    expect(inside).toEqual([
      importFingerprint({
        spentAt: "2026-10-05",
        amountCents: 1299,
        description: "Pan",
      }),
    ]);

    const outside = await listDuplicateFingerprints(repos, actor, {
      from: "2026-11-01",
      to: "2026-11-30",
    });
    expect(outside).toEqual([]);
  });

  it("does not leak other profiles' expenses", async () => {
    const actor = await createActor();
    const stranger = await createActor();
    const strangerFood = await categoryNamed(repos, stranger, "Supermercado");
    await createExpense(repos, stranger, {
      amount: 500,
      categoryId: strangerFood.id,
      description: "Secreta",
      spentAt: "2026-10-05",
    });

    expect(
      await listDuplicateFingerprints(repos, actor, {
        from: "2026-10-01",
        to: "2026-10-31",
      }),
    ).toEqual([]);
  });
});
