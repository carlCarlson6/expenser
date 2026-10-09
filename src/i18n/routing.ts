import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["es", "en"],
  defaultLocale: "es",
  // Default locale (es) has no URL prefix: `/expenses` instead of `/es/expenses`.
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];
