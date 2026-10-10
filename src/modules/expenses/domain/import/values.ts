/**
 * Value parsing for expense imports. Spreadsheet cells and CSV fields are
 * normalized to the plain string forms the rest of the app already speaks:
 * dates as 'YYYY-MM-DD' and amounts as decimal strings.
 */

import { parseAmountToCents } from "@/shared/money/money";

/** Formats a UTC-midnight date (how xlsx date cells are decoded) as a date. */
function formatUtcDate(date: Date): string {
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${date.getUTCFullYear()}-${month}-${day}`;
}

/**
 * Normalizes one spreadsheet cell to text. Dates (from .xlsx date styles)
 * become 'YYYY-MM-DD' using UTC components, matching how the reader decodes
 * Excel serial dates.
 */
export function cellToText(cell: unknown): string {
  if (cell === null || cell === undefined) return "";
  if (cell instanceof Date) return formatUtcDate(cell);
  return String(cell);
}

function buildDate(year: number, month: number, day: number): string | null {
  if (year < 1900 || year > 2100 || month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  // Rejects impossible days like 31/02.
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

/**
 * Parses a date cell into 'YYYY-MM-DD'. Accepts ISO (YYYY-MM-DD) and
 * day/month-first forms with `/`, `-` or `.` separators, ignoring any time
 * part. Ambiguous dates such as 03/04/2026 follow `dayFirst` (the profile
 * locale). Returns null when unparseable.
 */
export function parseImportDate(raw: string, dayFirst: boolean): string | null {
  const value = raw.trim().split(/[T ]/)[0];
  if (!value) return null;

  const iso = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/.exec(value);
  if (iso) return buildDate(Number(iso[1]), Number(iso[2]), Number(iso[3]));

  const parts = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/.exec(value);
  if (!parts) return null;
  const a = Number(parts[1]);
  const b = Number(parts[2]);
  const year = Number(parts[3]);

  if (a > 12) return buildDate(year, b, a);
  if (b > 12) return buildDate(year, a, b);
  return dayFirst ? buildDate(year, b, a) : buildDate(year, a, b);
}

/**
 * Parses an amount cell into integer cents. Currency symbols, letters,
 * spaces, parentheses and signs are ignored; negative amounts count as
 * expenses (absolute value). Returns null when no positive amount is found.
 */
export function parseImportAmount(raw: string): number | null {
  const digits = raw.replace(/[^\d.,]/g, "");
  if (digits === "") return null;
  return parseAmountToCents(digits);
}

/** Comparison form for descriptions when looking for likely duplicates. */
export function normalizeDescription(description: string | null | undefined): string {
  return (description ?? "").trim().replace(/\s+/g, " ").toLowerCase();
}

/**
 * Identity of an expense for duplicate detection: same day, same cents and
 * same (whitespace/case-insensitive) description.
 */
export function importFingerprint(input: {
  spentAt: string;
  amountCents: number;
  description?: string | null;
}): string {
  return `${input.spentAt}|${input.amountCents}|${normalizeDescription(input.description)}`;
}
