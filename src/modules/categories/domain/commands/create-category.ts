import type { Actor } from "@/modules/users/domain/types";
import { DomainError } from "@/modules/users/domain/types";

import { nextColor } from "../../data/palette";
import type { CategoryRepository } from "../../data/repository";
import type { Category } from "../../data/schema";
import type { CategoryNameInput } from "../validators/category";

type Repos = { categories: CategoryRepository };

export async function createCategory(
  repos: Repos,
  actor: Actor,
  input: CategoryNameInput,
): Promise<Category> {
  const existing = await repos.categories.findByName(
    actor.profileId,
    input.name,
  );
  if (existing) throw new DomainError("nameTaken");

  // Use the user's choice, else the first palette color not yet taken.
  let color = input.color;
  if (!color) {
    const used = (await repos.categories.listByProfile(actor.profileId)).map(
      (c) => c.color,
    );
    color = nextColor(used);
  }

  return repos.categories.create(actor.profileId, input.name, color);
}
