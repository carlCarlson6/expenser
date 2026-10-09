/** Message keys emitted by validators/domain code. Anything else (zod
 *  internals, unexpected errors) maps to `generic`. */
const KNOWN_KEYS = new Set([
  "required",
  "invalidAmount",
  "invalidDate",
  "futureDate",
  "descriptionTooLong",
  "nameTooLong",
  "nameTaken",
  "invalidColor",
  "notFound",
  "protectedCategory",
  "generic",
]);

export function validationKey(message: string | undefined): string {
  return message && KNOWN_KEYS.has(message) ? message : "generic";
}
