"use client";

import { useTranslations } from "next-intl";

import { ActionForm } from "@/shared/ui/action-form";
import { Button } from "@/shared/ui/button";
import { FieldError, Input, Label, Select } from "@/shared/ui/field";
import { Modal } from "@/shared/ui/modal";

import { createExpenseAction, updateExpenseAction } from "../actions";

export type ExpenseFormValues = {
  amount: string;
  categoryId: string;
  description: string;
  spentAt: string;
};

export function ExpenseFormModal({
  open,
  onClose,
  categories,
  today,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  categories: { id: string; name: string }[];
  today: string;
  /** Present for edit, null for create. */
  initial: (ExpenseFormValues & { id: string }) | null;
}) {
  const t = useTranslations("expenses");
  const tCommon = useTranslations("common");

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? t("editTitle") : t("newTitle")}
    >
      {/* key resets the form when switching between add/edit targets */}
      <ActionForm
        key={initial?.id ?? "new"}
        action={initial ? updateExpenseAction : createExpenseAction}
        onSuccess={onClose}
        className="space-y-4"
      >
        {({ pending, fieldMessage }) => (
          <>
            {initial && <input type="hidden" name="id" value={initial.id} />}
            <div>
              <Label htmlFor="e-amount">{t("amount")}</Label>
              <Input
                id="e-amount"
                name="amount"
                inputMode="decimal"
                placeholder="0.00"
                defaultValue={initial?.amount ?? ""}
                autoFocus
                required
              />
              <FieldError message={fieldMessage("amount")} />
            </div>
            <div>
              <Label htmlFor="e-category">{t("category")}</Label>
              <Select
                id="e-category"
                name="categoryId"
                defaultValue={initial?.categoryId ?? categories[0]?.id}
                required
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
              <FieldError message={fieldMessage("categoryId")} />
            </div>
            <div>
              <Label htmlFor="e-description">{t("description")}</Label>
              <Input
                id="e-description"
                name="description"
                placeholder={t("descriptionPlaceholder")}
                defaultValue={initial?.description ?? ""}
                maxLength={200}
              />
              <FieldError message={fieldMessage("description")} />
            </div>
            <div>
              <Label htmlFor="e-date">{t("date")}</Label>
              <Input
                id="e-date"
                name="spentAt"
                type="date"
                defaultValue={initial?.spentAt ?? today}
                required
              />
              <FieldError message={fieldMessage("spentAt")} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" type="button" onClick={onClose}>
                {tCommon("cancel")}
              </Button>
              <Button type="submit" disabled={pending}>
                {tCommon("save")}
              </Button>
            </div>
          </>
        )}
      </ActionForm>
    </Modal>
  );
}
