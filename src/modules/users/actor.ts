import "server-only";

import { cache } from "react";

import { requireClerkUserId } from "@/shared/auth/auth";
import { getDb } from "@/shared/db/client";
import type { Result } from "@/shared/result";

import { createCategoryRepository } from "../categories/data/repository";
import { createProfileRepository } from "./data/repository";
import { getProfile } from "./domain/queries/get-profile";
import type { Actor } from "./domain/types";

/**
 * Builds the Actor for the current request. Memoized with React `cache`, so
 * the layout, pages and actions share one profile lookup per request.
 */
export const getActor = cache(
  async (): Promise<Result<Actor, "unauthorized">> => {
    const userResult = await requireClerkUserId();
    if (!userResult.ok) return userResult;

    const db = getDb();
    const profile = await getProfile(
      {
        profiles: createProfileRepository(db),
        categories: createCategoryRepository(db),
      },
      userResult.value,
    );
    return {
      ok: true,
      value: {
        profileId: profile.id,
        clerkUserId: userResult.value,
        locale: profile.locale,
        currency: profile.currency,
      },
    };
  },
);
