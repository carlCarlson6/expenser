/**
 * Base class for domain entities. Equality is by identity, not by attribute
 * value: two entities are the same if and only if they share the same id.
 */
export abstract class Entity<TId> {
  readonly id: TId;

  protected constructor(id: TId) {
    this.id = id;
  }

  equals(other: Entity<TId> | null | undefined): boolean {
    if (other === null || other === undefined) return false;
    if (this === other) return true;
    return this.id === other.id;
  }
}
