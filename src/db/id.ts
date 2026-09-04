import { customAlphabet } from "nanoid";

// URL-safe, lowercase alphabet without lookalike characters.
const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 20);

/**
 * Generates a prefixed, application-side text id, e.g. `cat_3x9k1...`.
 * Prefixes make entity types distinguishable in logs and debugging. See the
 * project's Drizzle conventions — we avoid auto-increment PKs in favor of
 * application-generated text ids.
 */
export function generateId(prefix: string): string {
  return `${prefix}_${nanoid()}`;
}
