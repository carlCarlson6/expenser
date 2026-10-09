import { eq } from "drizzle-orm";

import type { Db } from "@/shared/db/client";

import { type Profile, profiles } from "./schema";

export interface ProfileRepository {
  findByClerkUserId(clerkUserId: string): Promise<Profile | null>;
  create(input: {
    clerkUserId: string;
    locale: string;
    currency: string;
  }): Promise<Profile>;
  updateSettings(
    profileId: string,
    input: { locale?: string; currency?: string },
  ): Promise<Profile>;
}

export function createProfileRepository(db: Db): ProfileRepository {
  return {
    async findByClerkUserId(clerkUserId) {
      const rows = await db
        .select()
        .from(profiles)
        .where(eq(profiles.clerkUserId, clerkUserId))
        .limit(1);
      return rows[0] ?? null;
    },

    async create(input) {
      const rows = await db
        .insert(profiles)
        .values({
          clerkUserId: input.clerkUserId,
          locale: input.locale,
          currency: input.currency,
        })
        .onConflictDoNothing({ target: profiles.clerkUserId })
        .returning();
      // Lost a race with a concurrent first request — read the winner's row.
      if (rows[0]) return rows[0];
      const existing = await db
        .select()
        .from(profiles)
        .where(eq(profiles.clerkUserId, input.clerkUserId))
        .limit(1);
      if (!existing[0]) throw new Error("Failed to provision profile");
      return existing[0];
    },

    async updateSettings(profileId, input) {
      const rows = await db
        .update(profiles)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(profiles.id, profileId))
        .returning();
      if (!rows[0]) throw new Error("Profile not found");
      return rows[0];
    },
  };
}
