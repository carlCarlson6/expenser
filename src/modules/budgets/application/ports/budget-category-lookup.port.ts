export interface BudgetCategoryLookup {
  /** Returns true if the category exists and belongs to the user. */
  exists(categoryId: string, userId: string): Promise<boolean>;
}
