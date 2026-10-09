"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { ActionForm } from "@/shared/ui/action-form";
import { Button } from "@/shared/ui/button";
import { FieldError, Input, Label } from "@/shared/ui/field";
import { Modal } from "@/shared/ui/modal";

import {
  createCategoryAction,
  deleteCategoryAction,
  renameCategoryAction,
  setCategoryColorAction,
} from "../actions";
import { ColorControls, ColorPicker } from "./color-picker";

type Row = {
  id: string;
  name: string;
  color: string;
  isProtected: boolean;
  expenseCount: number;
  total: string;
};

type Dialog =
  | { type: "add" }
  | { type: "rename"; category: Row }
  | { type: "delete"; category: Row }
  | null;

/** One-click recolor straight from the row: calls the Server Action directly
 *  with a FormData payload. The picker drives local preview state while
 *  dragging; only the committed value reaches the server. */
function InlineColorForm({ category }: { category: Row }) {
  const t = useTranslations("categories");
  const tCommon = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [draft, setDraft] = useState(category.color);
  const [synced, setSynced] = useState(category.color);

  // Re-sync the preview when the row's persisted color changes underneath us.
  if (category.color !== synced) {
    setSynced(category.color);
    setDraft(category.color);
  }

  const apply = (color: string) => {
    setOpen(false);
    const data = new FormData();
    data.set("id", category.id);
    data.set("color", color);
    startTransition(async () => {
      await setCategoryColorAction(null, data);
    });
  };

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={t("colorTrigger", { name: category.name })}
        aria-expanded={open}
        disabled={pending}
        onClick={() => setOpen((v) => !v)}
        className="h-6 w-6 cursor-pointer rounded-full border-2 border-zinc-200 transition-transform hover:scale-110 disabled:opacity-50"
        style={{ backgroundColor: open ? draft : category.color }}
      />
      {open && (
        <>
          <button
            type="button"
            aria-label={tCommon("close")}
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-20 mt-1 w-52 rounded-lg border border-zinc-200 bg-white p-2 shadow-lg">
            <ColorControls
              value={draft}
              onChange={setDraft}
              onCommit={apply}
              size="sm"
            />
          </div>
        </>
      )}
    </div>
  );
}

export function CategoryList({
  categories,
  protectedName,
}: {
  categories: Row[];
  protectedName: string;
}) {
  const t = useTranslations("categories");
  const tCommon = useTranslations("common");
  const [dialog, setDialog] = useState<Dialog>(null);
  const close = () => setDialog(null);

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setDialog({ type: "add" })}>{t("add")}</Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-left text-zinc-500">
              <th className="px-4 py-3 font-medium">{t("name")}</th>
              <th className="px-4 py-3 text-right font-medium">
                {t("expenseCount")}
              </th>
              <th className="px-4 py-3 text-right font-medium">{t("total")}</th>
              <th className="px-4 py-3 text-right font-medium">
                {tCommon("actions")}
              </th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id} className="border-b border-zinc-100 last:border-0">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      aria-hidden
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: c.color }}
                    />
                    <span className="font-medium text-zinc-900">{c.name}</span>
                    {c.isProtected && (
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">
                        {t("protectedBadge")}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-right text-zinc-600">
                  {c.expenseCount}
                </td>
                <td className="px-4 py-3 text-right font-medium">{c.total}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <InlineColorForm category={c} />
                    <Button
                      variant="ghost"
                      onClick={() => setDialog({ type: "rename", category: c })}
                    >
                      {tCommon("edit")}
                    </Button>
                    {!c.isProtected && (
                      <Button
                        variant="ghost"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() =>
                          setDialog({ type: "delete", category: c })
                        }
                      >
                        {tCommon("delete")}
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-zinc-500">
        {t("protectedHint", { name: protectedName })}
      </p>

      <Modal
        open={dialog?.type === "add" || dialog?.type === "rename"}
        onClose={close}
        title={dialog?.type === "rename" ? t("renameTitle") : t("newTitle")}
      >
        {dialog && dialog.type !== "delete" && (
          <ActionForm
            action={
              dialog.type === "rename"
                ? renameCategoryAction
                : createCategoryAction
            }
            onSuccess={close}
            className="space-y-4"
          >
            {({ pending, fieldMessage }) => (
              <>
                {dialog.type === "rename" && (
                  <input type="hidden" name="id" value={dialog.category.id} />
                )}
                <div>
                  <Label htmlFor="category-name">{t("name")}</Label>
                  <Input
                    id="category-name"
                    name="name"
                    defaultValue={
                      dialog.type === "rename" ? dialog.category.name : ""
                    }
                    placeholder={t("namePlaceholder")}
                    maxLength={50}
                    autoFocus
                    required
                  />
                  <FieldError message={fieldMessage("name")} />
                </div>
                <ColorPicker
                  label={t("color")}
                  initial={dialog.type === "rename" ? dialog.category.color : undefined}
                />
                {fieldMessage("color") && (
                  <FieldError message={fieldMessage("color")} />
                )}
                <div className="flex justify-end gap-2">
                  <Button variant="secondary" type="button" onClick={close}>
                    {tCommon("cancel")}
                  </Button>
                  <Button type="submit" disabled={pending}>
                    {tCommon("save")}
                  </Button>
                </div>
              </>
            )}
          </ActionForm>
        )}
      </Modal>

      <Modal
        open={dialog?.type === "delete"}
        onClose={close}
        title={t("deleteTitle")}
      >
        {dialog?.type === "delete" && (
          <ActionForm
            action={deleteCategoryAction}
            onSuccess={close}
            className="space-y-4"
          >
            {({ pending, errorMessage }) => (
              <>
                <input type="hidden" name="id" value={dialog.category.id} />
                <p className="text-sm text-zinc-600">
                  {dialog.category.expenseCount > 0
                    ? t("deleteReassign", {
                        count: dialog.category.expenseCount,
                        name: dialog.category.name,
                        other: protectedName,
                      })
                    : t("deleteEmpty", { name: dialog.category.name })}
                </p>
                {errorMessage && (
                  <p className="text-sm text-red-600">{errorMessage}</p>
                )}
                <div className="flex justify-end gap-2">
                  <Button variant="secondary" type="button" onClick={close}>
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
