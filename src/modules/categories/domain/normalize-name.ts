/**
 * Matching key for category names. Importers compare names with this instead
 * of raw equality, so "Alimentación", "alimentacion" and " ALIMENTACIÓN "
 * all resolve to the same category. Case, diacritics and whitespace are
 * ignored; everything else is significant.
 */
export function normalizeCategoryName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}
