/** Uniform result type returned by Server Actions to form components. */
export type ActionResult =
  | { ok: true }
  | {
      ok: false;
      /** Message key under `validation.*` or a plain message. */
      error: string;
      fieldErrors?: Record<string, string[]>;
    };

export const ok: ActionResult = { ok: true };

export function fail(
  error: string,
  fieldErrors?: Record<string, string[]>,
): ActionResult {
  return { ok: false, error, fieldErrors };
}
