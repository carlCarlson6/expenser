import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["es", "en"],
  defaultLocale: "es",
  // Default locale (es) has no URL prefix: `/expenses` instead of `/es/expenses`.
  localePrefix: "as-needed",
  // URL locale is the source of truth; do not redirect based on the cookie or
  // accept-language header. This prevents a redirect loop when the profile's
  // durable locale disagrees with the browser's locale cookie.
  localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];
