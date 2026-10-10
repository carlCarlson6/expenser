import { randomUUID } from "node:crypto";

import { inArray } from "drizzle-orm";
import { afterAll } from "vitest";

import type { Category } from "@/modules/categories/data/schema";
import { getProfile } from "@/modules/users/domain/queries/get-profile";
import type { Actor } from "@/modules/users/domain/types";
import { profiles } from "@/modules/users/data/schema";

import { getDb } from "@/shared/db/client";
import { createRepos } from "@/shared/db/repos";
import type { Repos } from "@/shared/db/repos";

/**
 * DB-backed test context: the real repositories against the Testcontainers
 * Postgres from `test/setup/global-db.ts` (started for every `npm test`).
 *
 * `createActor()` provisions a fresh profile with its default categories, so
 * every test works on its own tenant and tests can run in parallel. Profiles
 * are deleted in `afterAll`; categories and expenses cascade with them.
 */
export function createTestDb() {
  const db = getDb();
  const repos = createRepos(db);
  const profileIds: string[] = [];

  afterAll(async () => {
    if (profileIds.length > 0) {
      await db.delete(profiles).where(inArray(profiles.id, profileIds));
    }
  });

  /** A fresh tenant with its seeded default categories. */
  async function createActor(): Promise<Actor> {
    const clerkUserId = uniqueClerkId();
    const profile = await getProfile(repos, clerkUserId);
    profileIds.push(profile.id);
    return {
      profileId: profile.id,
      clerkUserId,
      locale: profile.locale,
      currency: profile.currency,
    };
  }

  /** Collision-free Clerk id; the prefix keeps failures readable. */
  function uniqueClerkId(prefix = "test"): string {
    return `${prefix}-${randomUUID()}`;
  }

  /** Registers a profile created through a repository directly. */
  function trackProfile(profileId: string): void {
    profileIds.push(profileId);
  }

  return { db, repos, createActor, uniqueClerkId, trackProfile };
}

/** Asserts a default category exists and returns it. */
export async function categoryNamed(
  repos: Repos,
  actor: Actor,
  name: string,
): Promise<Category> {
  const category = await repos.categories.findByName(actor.profileId, name);
  if (!category) {
    throw new Error(`Test setup: category "${name}" was not provisioned`);
  }
  return category;
}
