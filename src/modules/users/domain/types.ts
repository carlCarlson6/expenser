/** The authenticated caller as seen by every command/query. */
export type Actor = {
  profileId: string;
  clerkUserId: string;
  locale: string;
  currency: string;
};

/** Error thrown by domain code; `code` maps to a `validation.*` message key. */
export class DomainError extends Error {
  constructor(public readonly code: string) {
    super(code);
    this.name = "DomainError";
  }
}
