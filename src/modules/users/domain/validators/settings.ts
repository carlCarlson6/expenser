import { z } from "zod";

export const SUPPORTED_CURRENCIES = [
  "USD",
  "EUR",
  "GBP",
  "MXN",
  "ARS",
  "COP",
  "CLP",
  "PEN",
  "BRL",
  "CHF",
] as const;

export const SUPPORTED_LOCALES = ["es", "en"] as const;

export const settingsSchema = z.object({
  locale: z.enum(SUPPORTED_LOCALES),
  currency: z.enum(SUPPORTED_CURRENCIES),
});

export type SettingsInput = z.infer<typeof settingsSchema>;
