"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { usePathname, useRouter } from "@/i18n/navigation";
import { cx } from "@/shared/ui/cx";
import { Button } from "@/shared/ui/button";
import { Label, Select } from "@/shared/ui/field";

const PRESET_KEYS = {
  "30d": "last30Days",
  "6m": "last6Months",
  "12m": "last12Months",
  month: "thisMonth",
  custom: "customRange",
} as const;

export function DashboardFilters({
  categories,
  initial,
}: {
  categories: { id: string; name: string }[];
  initial: {
    preset: "30d" | "6m" | "12m" | "month" | "custom";
    from: string;
    to: string;
    granularity: string;
    categoryId: string;
  };
}) {
  const t = useTranslations("dashboard");
  const router = useRouter();
  const pathname = usePathname();
  const [values, setValues] = useState(initial);

  const push = (next: typeof values) => {
    setValues(next);
    const qs = new URLSearchParams();
    if (next.preset !== "custom") qs.set("preset", next.preset);
    else {
      if (next.from) qs.set("from", next.from);
      if (next.to) qs.set("to", next.to);
    }
    if (next.granularity !== "month") qs.set("granularity", next.granularity);
    if (next.categoryId) qs.set("categoryId", next.categoryId);
    const s = qs.toString();
    router.replace(s ? `${pathname}?${s}` : pathname);
  };

  const pickPreset = (preset: typeof values.preset) =>
    push({ ...values, preset });

  const set = (patch: Partial<typeof values>) => {
    // Touching a date or the category leaves the preset range: it is custom.
    const next = { ...values, ...patch, preset: "custom" as const };
    push(next);
  };

  return (
    <div className="mb-4 rounded-xl border border-zinc-200 bg-white p-4">
      <div className="mb-3 flex flex-wrap gap-2">
        {(["30d", "6m", "12m", "month"] as const).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => pickPreset(p)}
            className={cx(
              "cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              values.preset === p
                ? "bg-zinc-900 text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200",
            )}
          >
            {t(PRESET_KEYS[p])}
          </button>
        ))}
        {values.preset === "custom" && (
          <span className="self-center text-sm text-zinc-500">
            {t(PRESET_KEYS.custom)}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <Label htmlFor="d-from">{t("from")}</Label>
          <input
            id="d-from"
            type="date"
            value={values.from}
            onChange={(e) => set({ from: e.target.value })}
            className="w-full cursor-pointer rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
          />
        </div>
        <div>
          <Label htmlFor="d-to">{t("to")}</Label>
          <input
            id="d-to"
            type="date"
            value={values.to}
            onChange={(e) => set({ to: e.target.value })}
            className="w-full cursor-pointer rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
          />
        </div>
        <div>
          <Label htmlFor="d-granularity">{t("granularity")}</Label>
          <Select
            id="d-granularity"
            value={values.granularity}
            onChange={(e) => set({ granularity: e.target.value })}
          >
            <option value="day">{t("day")}</option>
            <option value="week">{t("week")}</option>
            <option value="month">{t("month")}</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="d-category">{t("category")}</Label>
          <Select
            id="d-category"
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
      </div>

      {values.preset === "custom" && (
        <div className="mt-3 text-right">
          <Button variant="ghost" onClick={() => pickPreset("6m")}>
            {t("reset")}
          </Button>
        </div>
      )}
    </div>
  );
}
