/** Default categories seeded when a profile is provisioned. The LAST entry
 *  is the protected "Other" bucket that receives reassigned expenses. */

const DEFAULTS: Record<string, string[]> = {
  es: [
    "Supermercado",
    "Restaurantes",
    "Transporte",
    "Vivienda",
    "Suministros",
    "Ocio",
    "Salud",
    "Compras",
    "Viajes",
    "Otros",
  ],
  en: [
    "Groceries",
    "Dining out",
    "Transport",
    "Housing",
    "Utilities",
    "Entertainment",
    "Health",
    "Shopping",
    "Travel",
    "Other",
  ],
};

export function defaultCategoryNames(locale: string): string[] {
  return DEFAULTS[locale] ?? DEFAULTS.es;
}
