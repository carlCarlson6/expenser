"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { ActionForm } from "@/shared/ui/action-form";
import { Button } from "@/shared/ui/button";
import { FieldError, Input, Label, Select } from "@/shared/ui/field";
import { Modal } from "@/shared/ui/modal";

import { createExpensesBulkAction } from "../actions";
import { MAX_BULK_ROWS } from "../domain/validators/expense";

type Row = {
  /** Stable across reorders/removals so typed values are not lost. */
  key: number;
  amount: string;
  categoryId: string;
  description: string;
  spentAt: string;
};

let nextKey = 0;

function newRow(categoryId: string, today: string): Row {
  return { key: nextKey++, amount: "", categoryId, description: "", spentAt: today };
}

export function ExpensesBulkModal({
  open,
  onClose,
  categories,
  today,
}: {
  open: boolean;
  onClose: () => void;
  categories: { id: string; name: string }[];
  today: string;
}) {
  const t = useTranslations("expenses");
  const tCommon = useTranslations("common");
  const [rows, setRows] = useState<Row[]>(() => [
    newRow(categories[0]?.id ?? "", today),
  ]);

  const full = rows.length >= MAX_BULK_ROWS;
  const setField = (key: number, patch: Partial<Row>) =>
    setRows((prev) =>
      prev.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    );

  return (
    <Modal open={open} onClose={onClose} title={t("bulkTitle")} wide>
      <ActionForm
        action={createExpensesBulkAction}
        onSuccess={() => {
          setRows([newRow(categories[0]?.id ?? "", today)]);
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

            <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
              {rows.map((row, index) => (
                <div
                  key={row.key}
                  className="rounded-lg border border-zinc-200 p-3"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-500">
                      {t("bulkRowLabel", { index: index + 1 })}
                    </span>
                    {rows.length > 1 && (
                      <Button
                        variant="ghost"
                        type="button"
                        className="px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                        onClick={() =>
                          setRows((prev) => prev.filter((r) => r.key !== row.key))
                        }
                      >
                        {tCommon("remove")}
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs" htmlFor={`b-${row.key}-amount`}>
                        {t("amount")}
                      </Label>
                      <Input
                        id={`b-${row.key}-amount`}
                        name={`rows[${index}].amount`}
                        inputMode="decimal"
                        placeholder="0.00"
                        value={row.amount}
                        onChange={(e) =>
                          setField(row.key, { amount: e.target.value })
                        }
                        required
                      />
                      <FieldError
                        message={fieldMessage(`rows.${index}.amount`)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs" htmlFor={`b-${row.key}-date`}>
                        {t("date")}
                      </Label>
                      <Input
                        id={`b-${row.key}-date`}
                        name={`rows[${index}].spentAt`}
                        type="date"
                        value={row.spentAt}
                        onChange={(e) =>
                          setField(row.key, { spentAt: e.target.value })
                        }
                        required
                      />
                      <FieldError
                        message={fieldMessage(`rows.${index}.spentAt`)}
                      />
                    </div>
                  </div>

                  <div className="mt-2">
                    <Label className="text-xs" htmlFor={`b-${row.key}-category`}>
                      {t("category")}
                    </Label>
                    <Select
                      id={`b-${row.key}-category`}
                      name={`rows[${index}].categoryId`}
                      value={row.categoryId}
                      onChange={(e) =>
                        setField(row.key, { categoryId: e.target.value })
                      }
                      required
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </Select>
                    <FieldError
                      message={fieldMessage(`rows.${index}.categoryId`)}
                    />
                  </div>

                  <div className="mt-2">
                    <Label className="text-xs" htmlFor={`b-${row.key}-desc`}>
                      {t("description")}
                    </Label>
                    <Input
                      id={`b-${row.key}-desc`}
                      name={`rows[${index}].description`}
                      placeholder={t("descriptionPlaceholder")}
                      value={row.description}
                      onChange={(e) =>
                        setField(row.key, { description: e.target.value })
                      }
                      maxLength={200}
                    />
                    <FieldError
                      message={fieldMessage(`rows.${index}.description`)}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between gap-2">
              <Button
                variant="secondary"
                type="button"
                disabled={full}
                onClick={() =>
                  setRows((prev) => [
                    ...prev,
                    newRow(prev[prev.length - 1]?.categoryId ?? "", today),
                  ])
                }
              >
                {t("bulkAddRow")}
              </Button>
              <div className="flex gap-2">
                <Button variant="secondary" type="button" onClick={onClose}>
                  {tCommon("cancel")}
                </Button>
                <Button type="submit" disabled={pending}>
                  {t("bulkSubmit")}
                </Button>
              </div>
            </div>
          </>
        )}
      </ActionForm>
    </Modal>
  );
}