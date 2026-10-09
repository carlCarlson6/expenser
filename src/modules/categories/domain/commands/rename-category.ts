import { DomainError, type Actor } from "@/modules/users/domain/types";

import type { CategoryRepository } from "../../data/repository";
import type { Category } from "../../data/schema";
import type { CategoryNameInput } from "../validators/category";

type Repos = { categories: CategoryRepository };

export async function renameCategory(
  repos: Repos,
  actor: Actor,
  input: CategoryNameInput & { id: string },
): Promise<Category> {
  const category = await repos.categories.findById(actor.profileId, input.id);
  if (!category) throw new DomainError("notFound");

  const clash = await repos.categories.findByName(actor.profileId, input.name);
  if (clash && clash.id !== category.id) throw new DomainError("nameTaken");

  // Omitting the color keeps the existing one (the form always sends it,
  // but renaming programmatically should not reset the color).
  const color = input.color ?? category.color;
  const updated = await repos.categories.rename(
    actor.profileId,
    input.id,
    input.name,
    color,
  );
  if (!updated) throw new DomainError("notFound");
  return updated;
}
