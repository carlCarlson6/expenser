import type { CategoryRepository } from "@/modules/categories/data/repository";
import {
  defaultCategoryNames,
  defaultColorFor,
} from "@/modules/categories/data/defaults";

import type { ProfileRepository } from "../../data/repository";
import type { Profile } from "../../data/schema";

type Repos = {
  profiles: ProfileRepository;
  categories: CategoryRepository;
};

/**
 * Syncs the Clerk user into our database on read (no webhooks): the first
 * call provisions the profile and seeds its default categories.
 */
export async function getProfile(
  repos: Repos,
  clerkUserId: string,
): Promise<Profile> {
  const existing = await repos.profiles.findByClerkUserId(clerkUserId);
  if (existing) return existing;

  const locale = "es";
  const profile = await repos.profiles.create({
    clerkUserId,
    locale,
    currency: "EUR",
  });

  const hasCategories =
    (await repos.categories.listByProfile(profile.id)).length > 0;
  if (!hasCategories) {
    const names = defaultCategoryNames(profile.locale || locale);
    await repos.categories.createMany(
      profile.id,
      names,
      names.length - 1,
      defaultColorFor,
    );
  }
  return profile;
}
