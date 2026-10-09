"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { usePathname, useRouter } from "@/i18n/navigation";
import { Button } from "@/shared/ui/button";
import { Input, Label, Select } from "@/shared/ui/field";

type Values = {
  categoryId: string;
  from: string;
  to: string;
  search: string;
};

export function ExpenseFiltersBar({
  categories,
  initial,
}: {
  categories: { id: string; name: string }[];
  initial: Values;
}) {
  const t = useTranslations("expenses");
  const router = useRouter();
  const pathname = usePathname();
  const [values, setValues] = useState<Values>(initial);

  const apply = (next: Values) => {
    setValues(next);
    const qs = new URLSearchParams();
    if (next.categoryId) qs.set("categoryId", next.categoryId);
    if (next.from) qs.set("from", next.from);
    if (next.to) qs.set("to", next.to);
    if (next.search) qs.set("search", next.search);
    const s = qs.toString();
    router.replace(s ? `${pathname}?${s}` : pathname);
  };

  const set = (patch: Partial<Values>) => apply({ ...values, ...patch });

  return (
    <div className="mb-4 grid grid-cols-2 gap-3 rounded-xl border border-zinc-200 bg-white p-4 sm:grid-cols-4">
      <div>
        <Label htmlFor="f-category">{t("category")}</Label>
        <Select
          id="f-category"
          value={values.categoryId}
          onChange={(e) => set({ categoryId: e.target.value })}
        >
          <option value="">{t("allCategories")}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="f-from">{t("from")}</Label>
        <Input
          id="f-from"
          type="date"
          value={values.from}
          onChange={(e) => set({ from: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="f-to">{t("to")}</Label>
        <Input
          id="f-to"
          type="date"
          value={values.to}
          onChange={(e) => set({ to: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="f-search">{t("search")}</Label>
        <div className="flex gap-2">
          <Input
            id="f-search"
            value={values.search}
            placeholder={t("searchPlaceholder")}
            onChange={(e) => set({ search: e.target.value })}
          />
          <Button
            variant="ghost"
            type="button"
            onClick={() =>
              apply({ categoryId: "", from: "", to: "", search: "" })
            }
          >
            ✕
          </Button>
        </div>
      </div>
    </div>
  );
}
