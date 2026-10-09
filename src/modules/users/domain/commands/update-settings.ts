import type { ProfileRepository } from "../../data/repository";
import type { Profile } from "../../data/schema";
import type { Actor } from "../types";
import type { SettingsInput } from "../validators/settings";

type Repos = { profiles: ProfileRepository };

export async function updateSettings(
  repos: Repos,
  actor: Actor,
  input: SettingsInput,
): Promise<Profile> {
  return repos.profiles.updateSettings(actor.profileId, {
    locale: input.locale,
    currency: input.currency,
  });
}
