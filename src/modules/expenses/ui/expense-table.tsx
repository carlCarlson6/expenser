"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { ActionForm } from "@/shared/ui/action-form";
import { Button } from "@/shared/ui/button";
import { Modal } from "@/shared/ui/modal";

import { CategoryBadge } from "@/modules/reports/ui/category-legend";

import { deleteExpenseAction } from "../actions";
import { ExpensesBulkModal } from "./expense-bulk-form";
import { ExpenseFormModal, type ExpenseFormValues } from "./expense-form";

type Row = {
  id: string;
  spentAt: string;
  description: string;
  categoryName: string;
  categoryColor: string;
  amount: string;
  edit: ExpenseFormValues;
};

export function ExpenseTable({
  rows,
  categories,
  emptyMessage,
}: {
  rows: Row[];
  categories: { id: string; name: string }[];
  emptyMessage: string;
}) {
  const t = useTranslations("expenses");
  const tCommon = useTranslations("common");
  const [formOpen, setFormOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [editing, setEditing] = useState<
    (ExpenseFormValues & { id: string }) | null
  >(null);
  const [deleting, setDeleting] = useState<Row | null>(null);

  // Date inputs use the server-provided "today" from the first row render.
  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <div className="mb-4 flex justify-end gap-2">
        <Button variant="secondary" onClick={() => setBulkOpen(true)}>
          {t("bulkAdd")}
        </Button>
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          {t("add")}
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-left text-zinc-500">
              <th className="px-4 py-3 font-medium">{t("date")}</th>
              <th className="px-4 py-3 font-medium">{t("description")}</th>
              <th className="px-4 py-3 font-medium">{t("category")}</th>
              <th className="px-4 py-3 text-right font-medium">
                {t("amount")}
              </th>
              <th className="px-4 py-3 text-right font-medium">
                {tCommon("actions")}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-zinc-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-zinc-100 last:border-0">
                <td className="px-4 py-3 whitespace-nowrap text-zinc-600">
                  {r.spentAt}
                </td>
                <td className="px-4 py-3 text-zinc-900">
                  {r.description || "—"}
                </td>
                <td className="px-4 py-3">
                  <CategoryBadge
                    color={r.categoryColor}
                    name={r.categoryName}
                  />
                </td>
                <td className="px-4 py-3 text-right font-medium whitespace-nowrap">
                  {r.amount}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setEditing({ id: r.id, ...r.edit });
                        setFormOpen(true);
                      }}
                    >
                      {tCommon("edit")}
                    </Button>
                    <Button
                      variant="ghost"
                      className="text-red-600 hover:bg-red-50"
                      onClick={() => setDeleting(r)}
                    >
                      {tCommon("delete")}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ExpenseFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        categories={categories}
        today={today}
        initial={editing}
      />

      <ExpensesBulkModal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        categories={categories}
        today={today}
      />

      <Modal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title={t("deleteTitle")}
      >
        {deleting && (
          <ActionForm
            action={deleteExpenseAction}
            onSuccess={() => setDeleting(null)}
            className="space-y-4"
          >
            {({ pending }) => (
              <>
                <input type="hidden" name="id" value={deleting.id} />
                <p className="text-sm text-zinc-600">{t("deleteConfirm")}</p>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="secondary"
                    type="button"
                    onClick={() => setDeleting(null)}
                  >
                    {tCommon("cancel")}
                  </Button>
                  <Button variant="danger" type="submit" disabled={pending}>
                    {tCommon("delete")}
                  </Button>
                </div>
              </>
            )}
          </ActionForm>
        )}
      </Modal>
    </>
  );
}
