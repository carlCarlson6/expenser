import { and, eq, notInArray } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { seedDevUser } from "@/modules/admin/domain/commands/seed-dev-user";
import type { TransactionRunner } from "@/modules/admin/domain/commands/seed-dev-user";
import { categories } from "@/modules/categories/data/schema";
import { expenses } from "@/modules/expenses/data/schema";
import { DomainError } from "@/modules/users/domain/types";

import { runInTransaction } from "@/shared/db/repos";

import { createTestDb } from "@test/integration/shared/db/fixtures";

const { db, repos, createActor, uniqueClerkId, trackProfile } = createTestDb();

const TODAY = new Date(2026, 9, 9);

const run: TransactionRunner = (fn) => runInTransaction(db, fn);

/**
 * Seeds a fresh clerk user and reads the persisted rows back, so tests
 * assert what actually landed in Postgres.
 */
async function seed(clerkUserId: string, months = 1, force?: boolean) {
  const summary = await seedDevUser(
    repos,
    { clerkUserId, months, force, today: TODAY },
    run,
  );
  const profile = await repos.profiles.findByClerkUserId(clerkUserId);
  if (!profile) throw new Error("Test setup: seeded profile not found");
  trackProfile(profile.id);

  const page = await repos.expenses.list(profile.id, {
    page: 1,
    pageSize: 10_000,
  });
  const rows = page.items
    .map(
      (e): [number, string, string | null] => [
        e.amountCents,
        e.spentAt,
        e.description,
      ],
    )
    .sort();

  return { summary, expenses: rows, profileId: profile.id };
}

describe("seedDevUser", () => {
  it("provisions the profile and fills it with expenses", async () => {
    const { summary, expenses } = await seed(uniqueClerkId());

    expect(summary.profileId).toBeTruthy();
    expect(summary.inserted).toBeGreaterThan(0);
    expect(summary.totalCents).toBeGreaterThan(0);
    expect(expenses).toHaveLength(summary.inserted);
    // Nothing is written outside the seeded months window.
    expect(expenses.every(([, spentAt]) => spentAt <= "2026-10-09")).toBe(true);
  });

  it("is deterministic for the same clerk user", async () => {
    const clerkUserId = uniqueClerkId();
    const first = await seed(clerkUserId);
    await db.delete(expenses).where(eq(expenses.profileId, first.profileId));
    const again = await seed(clerkUserId, 1, true);
    const other = await seed(uniqueClerkId());

    expect(again.expenses).toEqual(first.expenses);
    expect(again.summary.byCategory).toEqual(first.summary.byCategory);
    expect(other.expenses).not.toEqual(first.expenses);
  });

  it("refuses a profile that already has expenses unless forced", async () => {
    const clerkUserId = uniqueClerkId();
    await seed(clerkUserId);

    await expect(
      seedDevUser(repos, { clerkUserId, months: 1, today: TODAY }, run),
    ).rejects.toBeInstanceOf(DomainError);

    const forced = await seedDevUser(
      repos,
      { clerkUserId, months: 1, force: true, today: TODAY },
      run,
    );
    expect(forced.inserted).toBeGreaterThan(0);
  });

  it("only writes expenses for the profile it seeds", async () => {
    const first = await seed(uniqueClerkId());
    const second = await seed(uniqueClerkId());
    const bystander = await createActor();

    expect(await repos.expenses.countByProfile(first.profileId)).toBe(
      first.summary.inserted,
    );
    expect(await repos.expenses.countByProfile(second.profileId)).toBe(
      second.summary.inserted,
    );
    expect(await repos.expenses.countByProfile(bystander.profileId)).toBe(0);
  });

  it("sums the per-category totals it reports", async () => {
    const { summary, expenses } = await seed(uniqueClerkId(), 2);
    const summed = summary.byCategory.reduce((acc, c) => acc + c.totalCents, 0);
    const persisted = expenses.reduce((acc, [amountCents]) => acc + amountCents, 0);

    expect(summed).toBe(summary.totalCents);
    expect(summary.byCategory.reduce((acc, c) => acc + c.count, 0)).toBe(
      summary.inserted,
    );
    expect(persisted).toBe(summary.totalCents);
  });

  it("skips rules whose category the profile does not have", async () => {
    // A profile with only two of the categories the rules reference; the
    // protected "Otros" cannot be deleted through the command, so set the
    // state up directly.
    const actor = await createActor();
    await db
      .delete(categories)
      .where(
        and(
          eq(categories.profileId, actor.profileId),
          notInArray(categories.name, ["Vivienda", "Supermercado"]),
        ),
      );

    const summary = await seedDevUser(
      repos,
      { clerkUserId: actor.clerkUserId, months: 1, today: TODAY },
      run,
    );

    expect(summary.profileId).toBe(actor.profileId);
    expect(summary.missingCategories).toContain("Viajes");
    expect(summary.byCategory.map((c) => c.name).sort()).toEqual([
      "Supermercado",
      "Vivienda",
    ]);
  });
});
