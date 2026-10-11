import { centsToInput, parseAmountToCents } from "@/shared/money/money";

import type { DraftRow } from "../draft";
import type { BankParser, BankParseResult } from "./types";

/** Headers observed in Santander Spain `.xls` exports. */
const EXPECTED_HEADERS = [
  "fecha operacion",
  "fecha valor",
  "concepto",
  "importe eur",
  "saldo",
];

function normalizeHeader(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function findHeaderRow(sheet: string[][]): number | null {
  for (let index = 0; index < sheet.length; index++) {
    const normalized = sheet[index].map(normalizeHeader);
    const hasOperationDate = normalized.includes("fecha operacion");
    const hasConcept = normalized.includes("concepto");
    const hasAmount = normalized.some((value) => value.includes("importe"));
    if (hasOperationDate && hasConcept && hasAmount) {
      return index;
    }
  }
  return null;
}

/**
 * Parses a signed amount cell into integer cents, using the app's existing
 * amount parser so both "-1.234,56" and "-1,234.56" styles work. Zero amounts
 * return 0 so callers can skip them; malformed amounts return null.
 */
function parseSignedCents(raw: string): number | null {
  const cleaned = raw.replace(/[^\d.,-]/g, "");
  if (cleaned === "" || cleaned === "-") return null;

  const negative = cleaned.startsWith("-");
  const digits = cleaned.replace(/-/g, "");

  // Detect zero early so the parser can skip zero-amount rows cleanly.
  const numeric = digits.replace(/[.,]/g, "");
  if (numeric === "" || Number(numeric) === 0) return 0;

  const cents = parseAmountToCents(digits);
  if (cents === null) return null;

  return negative ? -cents : cents;
}

function parseDate(raw: string): string | null {
  const value = raw.trim();
  const parts = value.split("/");
  if (parts.length !== 3) return null;

  const day = Number(parts[0]);
  const month = Number(parts[1]);
  const year = Number(parts[2]);
  if (Number.isNaN(day) || Number.isNaN(month) || Number.isNaN(year)) {
    return null;
  }

  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  const yyyy = String(year);
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function buildDraftRow(
  cells: string[],
  dateIndex: number,
  conceptIndex: number,
  amountIndex: number,
): DraftRow {
  const rawAmount = String(cells[amountIndex] ?? "").trim();
  const rawDate = String(cells[dateIndex] ?? "").trim();
  const description = String(cells[conceptIndex] ?? "").trim();

  const signedCents = parseSignedCents(rawAmount);

  const amount =
    signedCents !== null && signedCents < 0
      ? centsToInput(Math.abs(signedCents))
      : rawAmount;

  const spentAt = parseDate(rawDate) ?? rawDate;

  return {
    spentAt,
    amount,
    categoryName: "",
    description,
  };
}

export function parseSantanderSpainSheet(sheet: string[][]): BankParseResult {
  const headerRow = findHeaderRow(sheet);
  if (headerRow === null) {
    return { error: "import.bankFormatMismatch" };
  }

  const header = sheet[headerRow].map(normalizeHeader);
  const dateIndex = header.indexOf("fecha operacion");
  const conceptIndex = header.indexOf("concepto");
  const amountIndex = header.findIndex((value) => value.includes("importe"));

  if (dateIndex === -1 || conceptIndex === -1 || amountIndex === -1) {
    return { error: "import.bankFormatMismatch" };
  }

  const rows: DraftRow[] = [];
  for (let index = headerRow + 1; index < sheet.length; index++) {
    const cells = sheet[index];
    const rawAmount = String(cells[amountIndex] ?? "").trim();
    const rawDate = String(cells[dateIndex] ?? "").trim();
    const description = String(cells[conceptIndex] ?? "").trim();

    // Skip completely empty rows.
    if (rawAmount === "" && rawDate === "" && description === "") {
      continue;
    }

    const signedCents = parseSignedCents(rawAmount);

    // Skip income and zero-amount rows; only expenses (negative amounts) count.
    if (signedCents !== null && signedCents >= 0) {
      continue;
    }

    rows.push(buildDraftRow(cells, dateIndex, conceptIndex, amountIndex));
  }

  if (rows.length === 0) {
    return { error: "import.bankNoExpenses" };
  }

  return { rows };
}

export const santanderSpainParser: BankParser = {
  key: "santander-spain",
  labelKey: "expenses:import.bankSantanderSpain",
  parse: parseSantanderSpainSheet,
};
