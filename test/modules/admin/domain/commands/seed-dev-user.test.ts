import { describe, expect, it } from "vitest";

import { seedDevUser } from "@/modules/admin/domain/commands/seed-dev-user";
import { DomainError } from "@/modules/users/domain/types";
import { createFakeRepos } from "@/shared/testing/fake-repos";

const TODAY = new Date(2026, 9, 9);

async function seed(clerkUserId: string, months = 1, force?: boolean) {
  const { repos, stores } = createFakeRepos();
  const summary = await seedDevUser(repos, { clerkUserId, months, force, today: TODAY });
  const expenses = [...stores.expenses.values()]
    .map(
      (e): [number, string, string | null] => [
        e.amountCents,
        e.spentAt,
        e.description,
      ],
    )
    .sort();
  return { summary, expenses };
}

describe("seedDevUser", () => {
  it("provisions the profile and fills it with expenses", async () => {
    const { summary, expenses } = await seed("clerk-1");

    expect(summary.profileId).toBeTruthy();
    expect(summary.inserted).toBeGreaterThan(0);
    expect(summary.totalCents).toBeGreaterThan(0);
    expect(expenses).toHaveLength(summary.inserted);
    // Nothing is written outside the seeded months window.
    expect(expenses.every(([, spentAt]) => spentAt <= "2026-10-09")).toBe(true);
  });

  it("is deterministic for the same clerk user", async () => {
    const a = await seed("clerk-1");
    const b = await seed("clerk-1");
    const c = await seed("clerk-2");

    expect(a.expenses).toEqual(b.expenses);
    expect(c.expenses).not.toEqual(a.expenses);
  });

  it("refuses a profile that already has expenses unless forced", async () => {
    const { repos, stores } = createFakeRepos();
    await seedDevUser(repos, { clerkUserId: "clerk-1", months: 1, today: TODAY });

    const second = await createFakeRepos({
      profiles: [...stores.profiles.values()],
      categories: [...stores.categories.values()],
      expenses: [...stores.expenses.values()],
    });
    await expect(
      seedDevUser(second.repos, { clerkUserId: "clerk-1", months: 1, today: TODAY }),
    ).rejects.toBeInstanceOf(DomainError);

    const forced = await seedDevUser(second.repos, {
      clerkUserId: "clerk-1",
      months: 1,
      force: true,
      today: TODAY,
    });
    expect(forced.inserted).toBeGreaterThan(0);
  });

  it("only writes expenses for the profile it seeds", async () => {
    const { repos, stores } = createFakeRepos();
    await seedDevUser(repos, { clerkUserId: "clerk-1", months: 1, today: TODAY });
    await seedDevUser(repos, { clerkUserId: "clerk-2", months: 1, today: TODAY });

    const byProfile = new Map<string, number>();
    for (const e of stores.expenses.values()) {
      byProfile.set(e.profileId, (byProfile.get(e.profileId) ?? 0) + 1);
    }

    expect(byProfile.size).toBe(2);
    expect([...byProfile.values()].every((n) => n > 0)).toBe(true);
    const profileIds = new Set([...stores.profiles.values()].map((p) => p.id));
    for (const e of stores.expenses.values()) {
      expect(profileIds.has(e.profileId)).toBe(true);
    }
  });

  it("sums the per-category totals it reports", async () => {
    const { summary } = await seed("clerk-1", 2);
    const summed = summary.byCategory.reduce((acc, c) => acc + c.totalCents, 0);

    expect(summed).toBe(summary.totalCents);
    expect(summary.byCategory.reduce((acc, c) => acc + c.count, 0)).toBe(
      summary.inserted,
    );
  });

  it("skips rules whose category the profile does not have", async () => {
    // A profile with only two of the categories the rules reference.
    const { repos } = createFakeRepos({
      profiles: [
        {
          id: "p1",
          clerkUserId: "clerk-partial",
          locale: "es",
          currency: "USD",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      categories: [
        {
          id: "cat-rent",
          profileId: "p1",
          name: "Vivienda",
          color: "#22c55e",
          isProtected: false,
          createdAt: new Date(),
        },
        {
          id: "cat-food",
          profileId: "p1",
          name: "Supermercado",
          color: "#ef4444",
          isProtected: false,
          createdAt: new Date(),
        },
      ],
    });

    const summary = await seedDevUser(repos, {
      clerkUserId: "clerk-partial",
      months: 1,
      today: TODAY,
    });

    expect(summary.profileId).toBe("p1");
    expect(summary.missingCategories).toContain("Viajes");
    expect(summary.byCategory.map((c) => c.name).sort()).toEqual([
      "Supermercado",
      "Vivienda",
    ]);
  });
});