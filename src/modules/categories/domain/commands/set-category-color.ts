import { DomainError, type Actor } from "@/modules/users/domain/types";

import type { CategoryRepository } from "../../data/repository";
import type { Category } from "../../data/schema";

type Repos = { categories: CategoryRepository };

/** Updates only the color, e.g. from the inline swatch picker. */
export async function setCategoryColor(
  repos: Repos,
  actor: Actor,
  input: { id: string; color: string },
): Promise<Category> {
  const category = await repos.categories.findById(actor.profileId, input.id);
  if (!category) throw new DomainError("notFound");

  const updated = await repos.categories.setColor(
    actor.profileId,
    input.id,
    input.color,
  );
  if (!updated) throw new DomainError("notFound");
  return updated;
}
