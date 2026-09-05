/** Driven port for generating new category ids without coupling to nanoid. */
export interface CategoryIdGenerator {
  generate(): string;
}
