import { describe, expect, it } from "vitest";

import type { Profile } from "@/modules/users/data/schema";
import { createFakeRepos } from "@/shared/testing/fake-repos";

import { getProfile } from "./get-profile";

const existing: Profile = {
  id: "p1",
  clerkUserId: "clerk-1",
  locale: "en",
  currency: "EUR",
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("getProfile", () => {
  it("returns the existing profile without reseeding", async () => {
    const { repos, stores } = createFakeRepos({ profiles: [existing] });
    const profile = await getProfile(repos, "clerk-1");
    expect(profile.id).toBe("p1");
    expect(stores.categories.size).toBe(0);
  });

  it("provisions a profile and seeds default categories on first read", async () => {
    const { repos, stores } = createFakeRepos();
    const profile = await getProfile(repos, "clerk-new");

    expect(profile.clerkUserId).toBe("clerk-new");
    expect(profile.locale).toBe("es");

    const categories = [...stores.categories.values()].filter(
      (c) => c.profileId === profile.id,
    );
    expect(categories.length).toBeGreaterThan(5);
    expect(categories.filter((c) => c.isProtected)).toHaveLength(1);
  });
});
