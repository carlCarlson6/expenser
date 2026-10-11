import { cellToText } from "../domain/import/values";

/** Browser-side file size guard; roughly 100k rows of CSV. */
export const MAX_IMPORT_FILE_BYTES = 10 * 1024 * 1024;

export type ImportFileErrorCode = "unsupported" | "parse";

/** File-level failure with a code the modal maps to a translated message. */
export class ImportFileError extends Error {
  constructor(public readonly code: ImportFileErrorCode) {
    super(code);
    this.name = "ImportFileError";
  }
}

function isSpreadsheet(name: string): boolean {
  const lower = name.toLowerCase();
  return lower.endsWith(".xlsx") || lower.endsWith(".xls");
}

/**
 * Reads a CSV, .xlsx or legacy .xls file into a grid of text cells, using the
 * first sheet for spreadsheets. Parsers are loaded on demand so they stay out
 * of the initial bundle.
 */
export async function readImportFile(file: File): Promise<string[][]> {
  const name = file.name.toLowerCase();
  const isCsv = name.endsWith(".csv") || file.type === "text/csv";
  if (!isCsv && !isSpreadsheet(file.name)) {
    throw new ImportFileError("unsupported");
  }

  if (isCsv) {
    const { default: Papa } = await import("papaparse");
    const text = (await file.text()).replace(/^\uFEFF/, "");
    const result = Papa.parse<string[]>(text, { skipEmptyLines: "greedy" });
    return result.data.map((row) => row.map((cell) => String(cell ?? "")));
  }

  try {
    const XLSX = await import("xlsx");
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(new Uint8Array(data), { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) throw new ImportFileError("parse");

    const rows = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      raw: false,
      defval: "",
    }) as unknown[][];

    return rows.map((row) => row.map((cell) => cellToText(cell)));
  } catch {
    throw new ImportFileError("parse");
  }
}
