import { santanderSpainParser } from "./santander-spain";
import type { BankKey, BankParser } from "./types";

export const BANK_PARSERS: Record<BankKey, BankParser> = {
  "santander-spain": santanderSpainParser,
};

export const BANK_KEYS = Object.keys(BANK_PARSERS) as BankKey[];

export function getBankParser(key: BankKey | null): BankParser | null {
  if (key === null) return null;
  return BANK_PARSERS[key] ?? null;
}
