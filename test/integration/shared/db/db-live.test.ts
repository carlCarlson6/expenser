import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { deleteCategory } from "@/modules/categories/domain/commands/delete-category";
import { listCategoriesWithTotals } from "@/modules/categories/domain/queries/list-categories";
import { createExpense } from "@/modules/expenses/domain/commands/create-expense";
import { listExpenses } from "@/modules/expenses/domain/queries/list-expenses";
import { getDashboardData } from "@/modules/reports/domain/queries/get-dashboard-data";
import { getProfile } from "@/modules/users/domain/queries/get-profile";
import { profiles } from "@/modules/users/data/schema";
import type { Actor } from "@/modules/users/domain/types";

import { getDb, type Db } from "@/shared/db/client";
import { createRepos } from "@/shared/db/repos";

/**
 * End-to-end flow test against the Testcontainers Postgres the global setup
 * boots for `npm test`: provision → record → aggregate → delete. The
 * per-module suites live next to their slices; this one exercises the whole
 * stack on one tenant.
 */
const clerkUserId = `flow-test-${Date.now()}`;

describe("database (integration)", () => {
  let db: Db;
  let actor: Actor;
  let foodId: string;
  let otherId: string;

  beforeAll(async () => {
    db = getDb();
    const repos = createRepos(db);
    const profile = await getProfile(repos, clerkUserId);
    actor = {
      profileId: profile.id,
      clerkUserId,
      locale: profile.locale,
      currency: profile.currency,
    };
    const categories = await listCategoriesWithTotals(repos, actor);
    foodId = categories[0].id;
    otherId = categories.find((c) => c.isProtected)!.id;
  });

  afterAll(async () => {
    const rows = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(eq(profiles.clerkUserId, clerkUserId));
    for (const row of rows) {
      await db.delete(profiles).where(eq(profiles.id, row.id));
    }
  });

  it("seeds default categories including one protected category", async () => {
    const categories = await listCategoriesWithTotals(createRepos(db), actor);
    expect(categories.length).toBeGreaterThan(5);
    expect(categories.filter((c) => c.isProtected)).toHaveLength(1);
  });

  it("creates expenses and aggregates them", async () => {
    const repos = createRepos(db);
    await createExpense(repos, actor, {
      amount: 1299,
      categoryId: foodId,
      description: "Weekly groceries",
      spentAt: "2026-10-01",
    });
    await createExpense(repos, actor, {
      amount: 500,
      categoryId: foodId,
      description: "Bus ticket",
      spentAt: "2026-10-01",
    });
    await createExpense(repos, actor, {
      amount: 10000,
      categoryId: otherId,
      description: "Rent",
      spentAt: "2026-09-01",
    });

    const page = await listExpenses(repos, actor, { page: 1 });
    expect(page.totalCount).toBe(3);

    const searched = await listExpenses(repos, actor, {
      page: 1,
      search: "groceries",
    });
    expect(searched.totalCount).toBe(1);

    const byCategory = await listCategoriesWithTotals(repos, actor);
    const food = byCategory.find((c) => c.id === foodId)!;
    expect(food.expenseCount).toBe(2);
    expect(food.totalCents).toBe(1799);
  });

  it("buckets spending by time period", async () => {
    const repos = createRepos(db);
    const data = await getDashboardData(
      repos,
      actor,
      { from: "2026-09-01", to: "2026-10-01", granularity: "month" },
      new Date(2026, 9, 9),
    );
    expect(data.totalCents).toBe(11799);
    const september = data.buckets.find((b) => b.bucket === "2026-09-01");
    expect(september?.totalCents).toBe(10000);
    const october = data.buckets.find((b) => b.bucket === "2026-10-01");
    expect(october?.totalCents).toBe(1799);
    expect(data.preset).toBe("custom");
  });

  it("compares against the previous period of equal length", async () => {
    const repos = createRepos(db);
    const data = await getDashboardData(
      repos,
      actor,
      { from: "2026-09-01", to: "2026-09-30", granularity: "day" },
      new Date(2026, 9, 9),
    );
    // September window holds only the 10.000 rent expense.
    expect(data.totalCents).toBe(10000);
    // The 30 days before it (Aug) hold nothing.
    expect(data.previousTotalCents).toBe(0);
    expect(data.change).toBeNull();
    expect(data.buckets).toHaveLength(30);
  });

  it("scopes the dashboard to a single category", async () => {
    const repos = createRepos(db);
    const data = await getDashboardData(
      repos,
      actor,
      {
        from: "2026-09-01",
        to: "2026-10-31",
        granularity: "month",
        categoryId: otherId,
      },
      new Date(2026, 9, 9),
    );
    expect(data.totalCents).toBe(10000);
    expect(data.count).toBe(1);
    expect(data.byCategory).toHaveLength(1);
    expect(data.byCategory[0].name).toBeTruthy();
  });

  it("builds a stacked matrix and a daily series over the same window", async () => {
    const repos = createRepos(db);
    const data = await getDashboardData(
      repos,
      actor,
      { from: "2026-09-01", to: "2026-10-31", granularity: "month" },
      new Date(2026, 9, 9),
    );

    // Largest first: the 100.00 rent beats the 17.99 of October groceries.
    expect(data.stacked.categories[0].categoryId).toBe(otherId);
    expect(data.stacked.categories[0].totalCents).toBe(10000);
    expect(data.stacked.buckets).toHaveLength(2);

    const september = data.stacked.buckets.find(
      (b) => b.bucket === "2026-09-01",
    )!;
    expect(september.byCategory[otherId]).toBe(10000);
    expect(september.byCategory[foodId]).toBe(0);

    const october = data.stacked.buckets.find(
      (b) => b.bucket === "2026-10-01",
    )!;
    expect(october.byCategory[foodId]).toBe(1799);
    expect(october.byCategory[otherId]).toBe(0);

    // Monthly buckets still come with a daily series for the heatmap.
    expect(data.daily).toHaveLength(61);
    expect(data.daily.find((d) => d.date === "2026-10-01")?.totalCents).toBe(
      1799,
    );
    expect(data.daily.find((d) => d.date === "2026-09-15")?.totalCents).toBe(0);
  });

  it("buckets the previous window so the chart can overlay it", async () => {
    const repos = createRepos(db);
    const data = await getDashboardData(
      repos,
      actor,
      { from: "2026-09-10", to: "2026-10-09", granularity: "day" },
      new Date(2026, 9, 9),
    );

    expect(data.totalCents).toBe(1799);
    // The 30 days before the window hold the September rent.
    expect(data.previousTotalCents).toBe(10000);
    expect(data.previousBuckets).toHaveLength(data.buckets.length);
    expect(
      data.previousBuckets.find((b) => b.bucket === "2026-09-01")?.totalCents,
    ).toBe(10000);
    expect(
      data.previousBuckets.find((b) => b.bucket === "2026-08-11")?.totalCents,
    ).toBe(0);
  });

  it("reassigns expenses when deleting a category", async () => {
    await db.transaction(async (tx) => {
      await deleteCategory(createRepos(tx as unknown as Db), actor, {
        id: foodId,
      });
    });

    const page = await listExpenses(createRepos(db), actor, { page: 1 });
    expect(page.totalCount).toBe(3);
    for (const item of page.items) {
      expect(item.categoryId).toBe(otherId);
    }
  });
});
