/**
 * A discriminated-union result type for use cases that can fail with a known,
 * recoverable error. Throwing is reserved for unexpected/exceptional failures;
 * domain-rule violations and validation failures are returned as `err`.
 */
export type Result<T, E = string> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

export function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}
