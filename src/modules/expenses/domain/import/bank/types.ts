import type { DraftRow } from "../draft";

export type BankKey = "santander-spain";

export type BankParseSuccess = {
  rows: DraftRow[];
};

export type BankParseFailure = {
  error: string;
};

export type BankParseResult = BankParseSuccess | BankParseFailure;

export function isBankParseFailure(
  result: BankParseResult,
): result is BankParseFailure {
  return "error" in result;
}

export type BankParser = {
  key: BankKey;
  labelKey: string;
  parse: (sheet: string[][]) => BankParseResult;
};
