export interface CategoryLookup {
  /** Returns the category if it exists and belongs to the user. */
  findByIdAndUserId(
    categoryId: string,
    userId: string,
  ): Promise<{ id: string } | null>;
}
