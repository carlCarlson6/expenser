export { getBankParser, BANK_KEYS, BANK_PARSERS } from "./registry";
export { parseSantanderSpainSheet, santanderSpainParser } from "./santander-spain";
export type {
  BankKey,
  BankParseFailure,
  BankParseResult,
  BankParseSuccess,
  BankParser,
} from "./types";
export { isBankParseFailure } from "./types";
