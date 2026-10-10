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

/**
 * Reads a CSV or .xlsx file into a grid of text cells, using the first sheet.
 * Both parsers are loaded on demand, so they stay out of the initial bundle.
 */
export async function readImportFile(file: File): Promise<string[][]> {
  const name = file.name.toLowerCase();
  const isCsv = name.endsWith(".csv") || file.type === "text/csv";
  const isXlsx = name.endsWith(".xlsx");
  if (!isCsv && !isXlsx) throw new ImportFileError("unsupported");

  if (isCsv) {
    const { default: Papa } = await import("papaparse");
    const text = (await file.text()).replace(/^\uFEFF/, "");
    const result = Papa.parse<string[]>(text, { skipEmptyLines: "greedy" });
    return result.data.map((row) => row.map((cell) => String(cell ?? "")));
  }

  try {
    const { readSheet } = await import("read-excel-file/browser");
    const sheet = (await readSheet(file)) as unknown as unknown[][];
    return sheet.map((row) => row.map(cellToText));
  } catch {
    throw new ImportFileError("parse");
  }
}
