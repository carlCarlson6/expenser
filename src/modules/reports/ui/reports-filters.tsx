"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { usePathname, useRouter } from "@/i18n/navigation";
import { Button } from "@/shared/ui/button";
import { Input, Label, Select } from "@/shared/ui/field";

type Values = {
  from: string;
  to: string;
  granularity: string;
  categoryId: string;
};

export function ReportsFilters({
  categories,
  initial,
}: {
  categories: { id: string; name: string }[];
  initial: Values;
}) {
  const t = useTranslations("reports");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const pathname = usePathname();
  const [values, setValues] = useState<Values>(initial);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const qs = new URLSearchParams();
    if (values.from) qs.set("from", values.from);
    if (values.to) qs.set("to", values.to);
    if (values.granularity && values.granularity !== "month") {
      qs.set("granularity", values.granularity);
    }
    if (values.categoryId) qs.set("categoryId", values.categoryId);
    const s = qs.toString();
    router.push(s ? `${pathname}?${s}` : pathname);
  };

  const set = (patch: Partial<Values>) =>
    setValues((v) => ({ ...v, ...patch }));

  return (
    <form
      onSubmit={submit}
      className="mb-4 grid grid-cols-2 gap-3 rounded-xl border border-zinc-200 bg-white p-4 sm:grid-cols-5"
    >
      <div>
        <Label htmlFor="r-from">{t("from")}</Label>
        <Input
          id="r-from"
          type="date"
          value={values.from}
          onChange={(e) => set({ from: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="r-to">{t("to")}</Label>
        <Input
          id="r-to"
          type="date"
          value={values.to}
          onChange={(e) => set({ to: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="r-granularity">{t("granularity")}</Label>
        <Select
          id="r-granularity"
          value={values.granularity}
          onChange={(e) => set({ granularity: e.target.value })}
        >
          <option value="day">{t("day")}</option>
          <option value="week">{t("week")}</option>
          <option value="month">{t("month")}</option>
        </Select>
      </div>
      <div>
        <Label htmlFor="r-category">{t("category")}</Label>
        <Select
          id="r-category"
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
      <div className="flex items-end">
        <Button type="submit" className="w-full">
          {tCommon("confirm")}
        </Button>
      </div>
    </form>
  );
}
