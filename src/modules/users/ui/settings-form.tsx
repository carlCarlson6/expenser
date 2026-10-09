"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { usePathname, useRouter } from "@/i18n/navigation";
import { ActionForm } from "@/shared/ui/action-form";
import { Button } from "@/shared/ui/button";
import { Label, Select } from "@/shared/ui/field";

import { updateSettingsAction } from "../actions";
import {
  SUPPORTED_CURRENCIES,
  SUPPORTED_LOCALES,
} from "../domain/validators/settings";

export function SettingsForm({
  locale: initialLocale,
  currency: initialCurrency,
}: {
  locale: string;
  currency: string;
}) {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const pathname = usePathname();

  const [locale, setLocale] = useState(initialLocale);
  const [currency, setCurrency] = useState(initialCurrency);
  const [saved, setSaved] = useState(false);

  return (
    <ActionForm
      action={updateSettingsAction}
      onSuccess={() => {
        setSaved(true);
        if (locale !== initialLocale) {
          // The URL drives the UI language — move to the new locale.
          router.replace(pathname, { locale });
        }
      }}
      className="space-y-5"
    >
      {({ pending }) => (
        <>
          <div>
            <Label htmlFor="locale">{t("language")}</Label>
            <Select
              id="locale"
              name="locale"
              value={locale}
              onChange={(e) => {
                setLocale(e.target.value);
                setSaved(false);
              }}
            >
              {SUPPORTED_LOCALES.map((l) => (
                <option key={l} value={l}>
                  {t(l === "es" ? "spanish" : "english")}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label htmlFor="currency">{t("currency")}</Label>
            <Select
              id="currency"
              name="currency"
              value={currency}
              onChange={(e) => {
                setCurrency(e.target.value);
                setSaved(false);
              }}
            >
              {SUPPORTED_CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
            <p className="mt-1 text-xs text-zinc-500">{t("currencyHint")}</p>
          </div>

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={pending}>
              {tCommon("save")}
            </Button>
            {saved && (
              <span className="text-sm text-green-600">{t("saved")}</span>
            )}
          </div>
        </>
      )}
    </ActionForm>
  );
}
