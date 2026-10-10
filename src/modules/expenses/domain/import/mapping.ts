/**
 * Column detection for expense imports. Headers are matched against common
 * English/Spanish spreadsheet labels; unmatched files fall back to the manual
 * mapping selects in the import preview.
 */

export const IMPORT_COLUMNS = [
  "spentAt",
  "amount",
  "categoryName",
  "description",
] as const;

export type ImportColumnKey = (typeof IMPORT_COLUMNS)[number];

/** Source column index for each expense field, or null when unmapped. */
export type ColumnMapping = Record<ImportColumnKey, number | null>;

export const EMPTY_MAPPING: ColumnMapping = {
  spentAt: null,
  amount: null,
  categoryName: null,
  description: null,
};

const ALIASES: Record<ImportColumnKey, string[]> = {
  spentAt: [
    "date",
    "fecha",
    "day",
    "dia",
    "fecha operacion",
    "fecha valor",
    "fecha gasto",
    "transaction date",
    "operation date",
    "value date",
    "booking date",
    "posting date",
  ],
  amount: [
    "amount",
    "importe",
    "cantidad",
    "total",
    "monto",
    "valor",
    "euros",
    "precio",
    "value",
    "betrag",
    "suma",
  ],
  categoryName: [
    "category",
    "categoria",
    "tipo",
    "type",
    "tag",
    "etiqueta",
    "tipo de gasto",
  ],
  description: [
    "description",
    "descripcion",
    "concepto",
    "detalle",
    "detalles",
    "nota",
    "notas",
    "notes",
    "memo",
    "comentario",
    "comentarios",
    "merchant",
    "comercio",
    "establecimiento",
    "referencia",
    "reference",
    "payee",
    "observaciones",
  ],
};

/** Lowercase, accent-free, punctuation-free form used for header matching. */
function normalizeHeader(header: string): string {
  return header
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Best-guess mapping from a candidate header row. Each source column is only
 * ever claimed by one field; unknown headers stay unmapped.
 */
export function guessColumnMapping(header: string[]): ColumnMapping {
  const mapping: ColumnMapping = { ...EMPTY_MAPPING };
  const normalized = header.map(normalizeHeader);

  for (const column of IMPORT_COLUMNS) {
    const index = normalized.findIndex(
      (value) => value !== "" && ALIASES[column].includes(value),
    );
    if (index === -1) continue;
    // A column already claimed by another field is not reused.
    if (Object.values(mapping).includes(index)) continue;
    mapping[column] = index;
  }
  return mapping;
}

/**
 * Whether the first row looks like a header: at least two fields are
 * recognized. Single matches are not trusted because a data row could
 * coincidentally contain one alias.
 */
export function looksLikeHeader(header: string[]): boolean {
  const guessed = guessColumnMapping(header);
  return (
    Object.values(guessed).filter((index) => index !== null).length >= 2
  );
}
