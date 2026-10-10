"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { useLocale, useTranslations } from "next-intl";

import { normalizeCategoryName } from "@/modules/categories/domain/normalize-name";
import { ActionForm } from "@/shared/ui/action-form";
import { Button } from "@/shared/ui/button";
import { cx } from "@/shared/ui/cx";
import { FieldError, Input, Label, Select } from "@/shared/ui/field";
import { Modal } from "@/shared/ui/modal";

import { checkImportDuplicatesAction, importExpensesAction } from "../actions";
import {
  buildDraftRows,
  hasErrors,
  newCategorySummary,
  toImportPayload,
  validateDraftRow,
  type DraftRow,
  type ValidatedRow,
} from "../domain/import/draft";
import {
  EMPTY_MAPPING,
  guessColumnMapping,
  IMPORT_COLUMNS,
  looksLikeHeader,
  type ColumnMapping,
  type ImportColumnKey,
} from "../domain/import/mapping";
import { importFingerprint } from "../domain/import/values";
import { MAX_IMPORT_ROWS } from "../domain/validators/import";
import {
  ImportFileError,
  MAX_IMPORT_FILE_BYTES,
  readImportFile,
} from "./import-file";

const PAGE_SIZE = 100;

type Row = DraftRow & { key: number };

type PreparedRow = ValidatedRow & {
  key: number;
  row: Row;
  fingerprint: string | null;
  duplicate: boolean;
  /** Normalized category key; null when the row uses the protected bucket. */
  categoryKey: string | null;
};

type Filter = "all" | "invalid" | "duplicates";

const COLUMN_LABEL_KEYS: Record<ImportColumnKey, string> = {
  spentAt: "import.columnDate",
  amount: "import.columnAmount",
  categoryName: "import.columnCategory",
  description: "import.columnDescription",
};

export function ExpenseImportModal({
  open,
  onClose,
  categories,
  protectedCategoryName,
}: {
  open: boolean;
  onClose: () => void;
  categories: { id: string; name: string }[];
  protectedCategoryName: string;
}) {
  const t = useTranslations("expenses");
  const tValidation = useTranslations("validation");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const [sheet, setSheet] = useState<string[][] | null>(null);
  const [columnCount, setColumnCount] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);
  const [hasHeader, setHasHeader] = useState(true);
  const [mapping, setMapping] = useState<ColumnMapping>(EMPTY_MAPPING);
  const [rows, setRows] = useState<Row[]>([]);
  const [dayFirst, setDayFirst] = useState(() => locale.startsWith("es"));
  const [parsing, setParsing] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [page, setPage] = useState(1);
  const [fingerprints, setFingerprints] = useState<Set<string>>(new Set());
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const nextKeyRef = useRef(0);
  const fingerprintCache = useRef(new Map<string, string[]>());

  const reset = () => {
    setSheet(null);
    setColumnCount(0);
    setFileName(null);
    setHasHeader(true);
    setMapping(EMPTY_MAPPING);
    setRows([]);
    setFileError(null);
    setFilter("all");
    setPage(1);
    setFingerprints(new Set());
    fingerprintCache.current.clear();
  };

  const close = () => {
    reset();
    onClose();
  };

  const rebuild = (
    data: string[][],
    header: boolean,
    map: ColumnMapping,
  ) => {
    setRows(
      buildDraftRows(data, header, map).map((draft) => ({
        key: nextKeyRef.current++,
        ...draft,
      })),
    );
    setPage(1);
  };

  const handleFile = async (file: File) => {
    setFileError(null);
    setParsing(true);
    try {
      if (file.size > MAX_IMPORT_FILE_BYTES) {
        setFileError(
          t("import.fileTooLarge", {
            max: Math.round(MAX_IMPORT_FILE_BYTES / (1024 * 1024)),
          }),
        );
        return;
      }
      const grid = (await readImportFile(file)).filter((row) =>
        row.some((cell) => cell !== ""),
      );
      if (grid.length === 0) {
        setFileError(t("import.fileEmpty"));
        return;
      }
      if (grid.length > MAX_IMPORT_ROWS + 1) {
        setFileError(t("import.tooManyRows", { max: MAX_IMPORT_ROWS }));
        return;
      }

      const header = looksLikeHeader(grid[0]);
      const guessed = header ? guessColumnMapping(grid[0]) : EMPTY_MAPPING;
      setSheet(grid);
      setColumnCount(Math.max(...grid.map((row) => row.length)));
      setFileName(file.name);
      setHasHeader(header);
      setMapping(guessed);
      setFingerprints(new Set());
      rebuild(grid, header, guessed);
    } catch (error) {
      setFileError(
        error instanceof ImportFileError && error.code === "unsupported"
          ? t("import.unsupportedFile")
          : t("import.parseError"),
      );
    } finally {
      setParsing(false);
    }
  };

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
    // Allows picking the same file again after an error.
    e.target.value = "";
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  };

  const setColumn = (column: ImportColumnKey, value: string) => {
    const next: ColumnMapping = {
      ...mapping,
      [column]: value === "" ? null : Number(value),
    };
    setMapping(next);
    if (sheet) rebuild(sheet, hasHeader, next);
  };

  const setHeaderRow = (header: boolean) => {
    setHasHeader(header);
    if (sheet) rebuild(sheet, header, mapping);
  };

  const updateRow = (key: number, patch: Partial<DraftRow>) =>
    setRows((prev) =>
      prev.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    );

  const removeRow = (key: number) =>
    setRows((prev) => prev.filter((row) => row.key !== key));

  const existingNames = useMemo(
    () => new Set(categories.map((c) => normalizeCategoryName(c.name))),
    [categories],
  );

  const prepared = useMemo<PreparedRow[]>(
    () =>
      rows.map((row) => {
        const validated = validateDraftRow(row, dayFirst);
        const fingerprint =
          validated.isoDate && validated.amountCents
            ? importFingerprint({
                spentAt: validated.isoDate,
                amountCents: validated.amountCents,
                description: validated.description,
              })
            : null;
        return {
          ...validated,
          key: row.key,
          row,
          fingerprint,
          duplicate: fingerprint !== null && fingerprints.has(fingerprint),
          categoryKey: validated.categoryName
            ? normalizeCategoryName(validated.categoryName)
            : null,
        };
      }),
    [rows, dayFirst, fingerprints],
  );

  const invalidCount = useMemo(
    () => prepared.filter(hasErrors).length,
    [prepared],
  );
  const duplicateCount = useMemo(
    () => prepared.filter((p) => p.duplicate).length,
    [prepared],
  );
  const newCategories = useMemo(
    () => newCategorySummary(prepared, existingNames),
    [prepared, existingNames],
  );
  const usesOther = useMemo(
    () => prepared.some((p) => !hasErrors(p) && p.categoryKey === null),
    [prepared],
  );

  const visible = useMemo(() => {
    if (filter === "invalid") return prepared.filter(hasErrors);
    if (filter === "duplicates") return prepared.filter((p) => p.duplicate);
    return prepared;
  }, [prepared, filter]);

  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageRows = visible.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  const indexByKey = useMemo(
    () => new Map(prepared.map((p, index) => [p.key, index])),
    [prepared],
  );

  // Date range of the import, used to fetch possibly-duplicate expenses.
  const rangeKey = useMemo(() => {
    let min: string | null = null;
    let max: string | null = null;
    for (const p of prepared) {
      if (p.isoDate === null) continue;
      if (min === null || p.isoDate < min) min = p.isoDate;
      if (max === null || p.isoDate > max) max = p.isoDate;
    }
    return min !== null && max !== null ? `${min}|${max}` : null;
  }, [prepared]);

  useEffect(() => {
    if (!open || rangeKey === null) return;
    const cached = fingerprintCache.current.get(rangeKey);
    if (cached) {
      setFingerprints(new Set(cached));
      setCheckingDuplicates(false);
      return;
    }
    let cancelled = false;
    setCheckingDuplicates(true);
    const [from, to] = rangeKey.split("|");
    // Small debounce so editing dates does not fire a request per keystroke.
    const timer = setTimeout(() => {
      checkImportDuplicatesAction({ from, to })
        .then((keys) => {
          fingerprintCache.current.set(rangeKey, keys);
          if (!cancelled) setFingerprints(new Set(keys));
        })
        .catch(() => {})
        .finally(() => {
          if (!cancelled) setCheckingDuplicates(false);
        });
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [open, rangeKey]);

  const columnLabels = useMemo(() => {
    const header = hasHeader && sheet ? sheet[0] : null;
    return Array.from({ length: columnCount }, (_, index) => {
      const label = header?.[index]?.trim();
      return label
        ? `${index + 1}. ${label}`
        : t("import.columnN", { n: index + 1 });
    });
  }, [sheet, hasHeader, columnCount, t]);

  const removeInvalid = () => {
    const keys = new Set(prepared.filter(hasErrors).map((p) => p.key));
    setRows((prev) => prev.filter((row) => !keys.has(row.key)));
    setPage(1);
  };

  const excludeDuplicates = () => {
    const keys = new Set(prepared.filter((p) => p.duplicate).map((p) => p.key));
    setRows((prev) => prev.filter((row) => !keys.has(row.key)));
    setPage(1);
  };

  const readyCount = rows.length - invalidCount;
  const tooManyRows = rows.length > MAX_IMPORT_ROWS;
  const canSubmit =
    rows.length > 0 &&
    invalidCount === 0 &&
    !tooManyRows &&
    mapping.spentAt !== null &&
    mapping.amount !== null;

  const payload = useMemo(
    () => (canSubmit ? JSON.stringify({ rows: toImportPayload(prepared) }) : ""),
    [canSubmit, prepared],
  );

  return (
    <Modal open={open} onClose={close} title={t("import.title")} xl>
      <ActionForm
        action={importExpensesAction}
        onSuccess={() => {
          reset();
          onClose();
        }}
        className="space-y-4"
      >
        {({ pending, fieldMessage, errorMessage }) => (
          <>
            {errorMessage && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {errorMessage}
              </p>
            )}

            <input type="hidden" name="payload" value={payload} readOnly />
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx"
              className="hidden"
              onChange={onFileChange}
            />

            {sheet === null ? (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={onDrop}
                className="rounded-xl border-2 border-dashed border-zinc-300 p-8 text-center"
              >
                <p className="text-sm text-zinc-600">{t("import.fileHint")}</p>
                <div className="mt-4 flex justify-center">
                  <Button
                    variant="secondary"
                    type="button"
                    disabled={parsing}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {parsing ? t("import.parsing") : t("import.chooseFile")}
                  </Button>
                </div>
                {fileError && (
                  <p className="mt-3 text-sm text-red-600">{fileError}</p>
                )}
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-xs text-zinc-500">{fileName}</p>
                  <Button
                    variant="ghost"
                    type="button"
                    className="px-2 py-1 text-xs"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {t("import.changeFile")}
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {IMPORT_COLUMNS.map((column) => (
                    <div key={column}>
                      <Label
                        className="text-xs"
                        htmlFor={`import-map-${column}`}
                      >
                        {t(COLUMN_LABEL_KEYS[column])}
                      </Label>
                      <Select
                        id={`import-map-${column}`}
                        value={mapping[column] ?? ""}
                        onChange={(e) => setColumn(column, e.target.value)}
                      >
                        <option value="">{t("import.columnNone")}</option>
                        {columnLabels.map((label, index) => (
                          <option key={index} value={index}>
                            {label}
                          </option>
                        ))}
                      </Select>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-700">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={hasHeader}
                      onChange={(e) => setHeaderRow(e.target.checked)}
                    />
                    {t("import.firstRowHeader")}
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={dayFirst}
                      onChange={(e) => setDayFirst(e.target.checked)}
                    />
                    {t("import.dayFirst")}
                  </label>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <FilterChip
                    active={filter === "all"}
                    onClick={() => {
                      setFilter("all");
                      setPage(1);
                    }}
                    label={t("import.filterAll", { count: prepared.length })}
                  />
                  <FilterChip
                    active={filter === "invalid"}
                    onClick={() => {
                      setFilter("invalid");
                      setPage(1);
                    }}
                    label={t("import.filterInvalid", { count: invalidCount })}
                  />
                  <FilterChip
                    active={filter === "duplicates"}
                    onClick={() => {
                      setFilter("duplicates");
                      setPage(1);
                    }}
                    label={t("import.filterDuplicates", {
                      count: duplicateCount,
                    })}
                  />
                  <span className="flex-1" />
                  <Button
                    variant="ghost"
                    type="button"
                    className="px-2 py-1 text-xs"
                    disabled={invalidCount === 0}
                    onClick={removeInvalid}
                  >
                    {t("import.removeInvalid")}
                  </Button>
                  <Button
                    variant="ghost"
                    type="button"
                    className="px-2 py-1 text-xs"
                    disabled={duplicateCount === 0}
                    onClick={excludeDuplicates}
                  >
                    {t("import.excludeDuplicates")}
                  </Button>
                </div>

                {(newCategories.length > 0 || usesOther) && (
                  <div className="max-h-32 overflow-y-auto rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    {newCategories.length > 0 && (
                      <>
                        <p className="font-medium">
                          {t("import.newCategoriesTitle")}
                        </p>
                        <p className="mt-1">
                          {newCategories
                            .map((c) => `${c.name} (${c.count})`)
                            .join(", ")}
                        </p>
                      </>
                    )}
                    {usesOther && protectedCategoryName && (
                      <p className="mt-1">
                        {t("import.otherHint", {
                          other: protectedCategoryName,
                        })}
                      </p>
                    )}
                  </div>
                )}

                {(duplicateCount > 0 || checkingDuplicates) && (
                  <p className="text-xs text-amber-700">
                    {checkingDuplicates
                      ? t("import.checkingDuplicates")
                      : t("import.duplicateHint")}
                  </p>
                )}

                <datalist id="import-category-names">
                  {categories.map((c) => (
                    <option key={c.id} value={c.name} />
                  ))}
                </datalist>

                <div className="max-h-80 overflow-y-auto rounded-lg border border-zinc-200">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 z-10 bg-zinc-50 text-left text-zinc-500">
                      <tr>
                        <th className="px-2 py-2 font-medium">{t("date")}</th>
                        <th className="px-2 py-2 font-medium">{t("amount")}</th>
                        <th className="px-2 py-2 font-medium">
                          {t("category")}
                        </th>
                        <th className="px-2 py-2 font-medium">
                          {t("description")}
                        </th>
                        <th className="w-10 px-2 py-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {pageRows.map((p) => {
                        const index = indexByKey.get(p.key)!;
                        const cellError = (field: ImportColumnKey) =>
                          p.errors[field]
                            ? tValidation(p.errors[field]!)
                            : fieldMessage(`rows.${index}.${field}`);
                        return (
                          <tr
                            key={p.key}
                            className={cx(
                              "border-b border-zinc-100 align-top last:border-0",
                              hasErrors(p)
                                ? "bg-red-50/60"
                                : p.duplicate
                                  ? "bg-amber-50/60"
                                  : undefined,
                            )}
                          >
                            <td className="px-2 py-2">
                              <Input
                                className="px-2 py-1 text-xs"
                                value={p.row.spentAt}
                                placeholder={
                                  dayFirst ? "DD/MM/YYYY" : "MM/DD/YYYY"
                                }
                                onChange={(e) =>
                                  updateRow(p.key, { spentAt: e.target.value })
                                }
                              />
                              <FieldError message={cellError("spentAt")} />
                            </td>
                            <td className="px-2 py-2">
                              <Input
                                className="px-2 py-1 text-xs"
                                inputMode="decimal"
                                value={p.row.amount}
                                placeholder="0,00"
                                onChange={(e) =>
                                  updateRow(p.key, { amount: e.target.value })
                                }
                              />
                              <FieldError message={cellError("amount")} />
                            </td>
                            <td className="px-2 py-2">
                              <Input
                                className="px-2 py-1 text-xs"
                                list="import-category-names"
                                value={p.row.categoryName}
                                placeholder={protectedCategoryName}
                                onChange={(e) =>
                                  updateRow(p.key, {
                                    categoryName: e.target.value,
                                  })
                                }
                              />
                              <FieldError message={cellError("categoryName")} />
                              {!p.errors.categoryName &&
                                p.categoryKey === null &&
                                protectedCategoryName && (
                                  <p className="mt-0.5 text-[10px] text-zinc-500">
                                    {t("import.usesOther", {
                                      other: protectedCategoryName,
                                    })}
                                  </p>
                                )}
                              {!p.errors.categoryName &&
                                p.categoryKey !== null &&
                                !existingNames.has(p.categoryKey) && (
                                  <p className="mt-0.5 text-[10px] text-amber-700">
                                    {t("import.willCreate")}
                                  </p>
                                )}
                            </td>
                            <td className="px-2 py-2">
                              <Input
                                className="px-2 py-1 text-xs"
                                value={p.row.description}
                                onChange={(e) =>
                                  updateRow(p.key, {
                                    description: e.target.value,
                                  })
                                }
                              />
                              <FieldError message={cellError("description")} />
                              {p.duplicate && (
                                <p className="mt-0.5 text-[10px] text-amber-700">
                                  {t("import.duplicate")}
                                </p>
                              )}
                            </td>
                            <td className="px-2 py-2">
                              <Button
                                variant="ghost"
                                type="button"
                                className="px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                                onClick={() => removeRow(p.key)}
                              >
                                {tCommon("remove")}
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {pageRows.length === 0 && (
                    <p className="px-3 py-6 text-center text-sm text-zinc-500">
                      {tCommon("noResults")}
                    </p>
                  )}
                </div>

                {pageCount > 1 && (
                  <div className="flex items-center justify-between text-xs text-zinc-500">
                    <span>
                      {tCommon("pageOf", {
                        page: currentPage,
                        total: pageCount,
                      })}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        type="button"
                        className="px-2 py-1 text-xs"
                        disabled={currentPage <= 1}
                        onClick={() => setPage(currentPage - 1)}
                      >
                        {tCommon("previous")}
                      </Button>
                      <Button
                        variant="secondary"
                        type="button"
                        className="px-2 py-1 text-xs"
                        disabled={currentPage >= pageCount}
                        onClick={() => setPage(currentPage + 1)}
                      >
                        {tCommon("next")}
                      </Button>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-zinc-500">
                    {rows.length === 0
                      ? t("import.fileEmpty")
                      : tooManyRows
                        ? t("import.tooManyRows", { max: MAX_IMPORT_ROWS })
                        : invalidCount > 0
                          ? t("import.fixErrors")
                          : checkingDuplicates
                            ? t("import.checkingDuplicates")
                            : ""}
                  </p>
                  <div className="flex gap-2">
                    <Button variant="secondary" type="button" onClick={close}>
                      {tCommon("cancel")}
                    </Button>
                    <Button type="submit" disabled={pending || !canSubmit}>
                      {t("import.submit", { count: readyCount })}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </ActionForm>
    </Modal>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "rounded-full border px-3 py-1 text-xs",
        active
          ? "border-zinc-900 bg-zinc-900 text-white"
          : "border-zinc-300 bg-white text-zinc-600 hover:bg-zinc-50",
      )}
    >
      {label}
    </button>
  );
}
