/**
 * Money is stored as integer cents everywhere. These helpers are the only
 * place where conversion/parsing/formatting happens.
 */

export function formatCents(
  cents: number,
  currency: string,
  locale: string,
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(cents / 100);
}

/**
 * Parses a user-typed amount into cents, accepting both '.' and ',' as
 * decimal separator ("12.34", "12,34") and either as thousands separator
 * ("1,234.56", "1.234,56", "1 234,56"). A single separator followed by
 * exactly 3 digits is treated as thousands ("1.234" → 1234).
 * Returns null when the input is not a valid positive amount.
 */
export function parseAmountToCents(input: string): number | null {
  let s = input.trim().replace(/\s/g, "");
  if (s === "" || !/^[\d.,]+$/.test(s)) return null;

  const lastDot = s.lastIndexOf(".");
  const lastComma = s.lastIndexOf(",");

  if (lastDot !== -1 && lastComma !== -1) {
    // Both present: the rightmost one is the decimal separator.
    const decimal = lastDot > lastComma ? "." : ",";
    const thousands = decimal === "." ? "," : ".";
    s = s.split(thousands).join("");
    if (decimal === ",") s = s.replace(",", ".");
  } else if (lastDot !== -1 || lastComma !== -1) {
    const sep = lastDot !== -1 ? "." : ",";
    const last = sep === "." ? lastDot : lastComma;
    const singleSep = s.indexOf(sep) === last;
    const digitsAfter = s.length - last - 1;
    if (singleSep && digitsAfter === 3) {
      // Thousands separator ("1,234" / "1.234").
      s = s.replace(sep, "");
    } else if (sep === ",") {
      s = s.replace(",", ".");
    }
  }

  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  const cents = Math.round(Number.parseFloat(s) * 100);
  return cents > 0 ? cents : null;
}

/** Inverse of parseAmountToCents: cents -> "12.34" for <input> default values. */
export function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2);
}
