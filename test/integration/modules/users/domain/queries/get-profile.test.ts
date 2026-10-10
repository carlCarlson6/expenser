import { describe, expect, it } from "vitest";

import { getProfile } from "@/modules/users/domain/queries/get-profile";

import { createTestDb } from "@test/integration/shared/db/fixtures";

const { repos, uniqueClerkId, trackProfile } = createTestDb();

describe("getProfile", () => {
  it("returns the existing profile without reseeding", async () => {
    const clerkUserId = uniqueClerkId();
    const existing = await repos.profiles.create({
      clerkUserId,
      locale: "en",
      currency: "EUR",
    });
    trackProfile(existing.id);

    const profile = await getProfile(repos, clerkUserId);

    expect(profile.id).toBe(existing.id);
    expect(await repos.categories.listByProfile(existing.id)).toHaveLength(0);
  });

  it("provisions a profile and seeds default categories on first read", async () => {
    const clerkUserId = uniqueClerkId();

    const profile = await getProfile(repos, clerkUserId);
    trackProfile(profile.id);

    expect(profile.clerkUserId).toBe(clerkUserId);
    expect(profile.locale).toBe("es");

    const categories = await repos.categories.listByProfile(profile.id);
    expect(categories.length).toBeGreaterThan(5);
    expect(categories.filter((c) => c.isProtected)).toHaveLength(1);
  });
});
