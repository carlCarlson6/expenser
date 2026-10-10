/**
 * Turns mapped spreadsheet columns into editable draft rows and validates
 * them with the same rules the Server Action re-checks. Everything here is
 * pure so the import preview stays responsive and unit-testable.
 */

import { normalizeCategoryName } from "@/modules/categories/domain/normalize-name";

import {
  CATEGORY_NAME_MAX,
  DESCRIPTION_MAX,
  type ImportRowInput,
} from "../validators/import";
import type { ColumnMapping, ImportColumnKey } from "./mapping";
import { parseImportAmount, parseImportDate } from "./values";

/** One row as shown in the preview: raw text per field, before validation. */
export type DraftRow = Record<ImportColumnKey, string>;

/** Validation message keys keyed by field; empty when the row is valid. */
export type RowErrors = Partial<Record<ImportColumnKey, string>>;

export type ValidatedRow = {
  isoDate: string | null;
  amountCents: number | null;
  /** Trimmed display name; null means "use the protected category". */
  categoryName: string | null;
  description: string | null;
  errors: RowErrors;
};

function cellAt(cells: string[], index: number | null): string {
  return index === null ? "" : (cells[index] ?? "");
}

/**
 * Projects a parsed sheet onto draft rows. `sheet` holds every row including
 * the header; `hasHeader` skips the first one.
 */
export function buildDraftRows(
  sheet: string[][],
  hasHeader: boolean,
  mapping: ColumnMapping,
): DraftRow[] {
  const data = hasHeader ? sheet.slice(1) : sheet;
  return data.map((cells) => ({
    spentAt: cellAt(cells, mapping.spentAt),
    amount: cellAt(cells, mapping.amount),
    categoryName: cellAt(cells, mapping.categoryName),
    description: cellAt(cells, mapping.description),
  }));
}

/** Validates one draft row, mirroring `importRowSchema` on the server. */
export function validateDraftRow(row: DraftRow, dayFirst: boolean): ValidatedRow {
  const errors: RowErrors = {};

  const isoDate = parseImportDate(row.spentAt, dayFirst);
  if (isoDate === null) errors.spentAt = "invalidDate";

  const amountCents = parseImportAmount(row.amount);
  if (amountCents === null) errors.amount = "invalidAmount";

  const categoryName = row.categoryName.trim();
  if (categoryName.length > CATEGORY_NAME_MAX) {
    errors.categoryName = "nameTooLong";
  }

  const description = row.description.trim();
  if (description.length > DESCRIPTION_MAX) {
    errors.description = "descriptionTooLong";
  }

  return {
    isoDate,
    amountCents,
    categoryName: categoryName === "" ? null : categoryName,
    description: description === "" ? null : description,
    errors,
  };
}

export function hasErrors(row: { errors: RowErrors }): boolean {
  return Object.keys(row.errors).length > 0;
}

/** Builds the wire payload sent to the import Server Action. */
export function toImportPayload(rows: ValidatedRow[]): ImportRowInput[] {
  return rows.map((row) => ({
    spentAt: row.isoDate!,
    amountCents: row.amountCents!,
    categoryName: row.categoryName,
    description: row.description,
  }));
}

/**
 * Distinct categories the import would create, in first-seen order, with the
 * row count each would cover. Rows with errors are ignored.
 */
export function newCategorySummary(
  rows: ValidatedRow[],
  existingNames: Set<string>,
): { name: string; count: number }[] {
  const summary = new Map<string, { name: string; count: number }>();
  for (const row of rows) {
    if (hasErrors(row) || row.categoryName === null) continue;
    const key = normalizeCategoryName(row.categoryName);
    if (existingNames.has(key)) continue;
    const entry = summary.get(key) ?? { name: row.categoryName, count: 0 };
    entry.count++;
    summary.set(key, entry);
  }
  return [...summary.values()].sort((a, b) => a.name.localeCompare(b.name));
}
