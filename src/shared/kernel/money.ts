import { err, ok, type Result } from "./result";

/**
 * Money value object. Amounts are stored as integer minor units (cents) to
 * avoid floating-point errors. The POC is single-currency EUR.
 *
 * Money is immutable: every arithmetic operation returns a new instance.
 */
export class Money {
  /** Non-negative integer number of cents. */
  readonly cents: number;

  private static readonly EUR_FORMATTER = new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  });

  private constructor(cents: number) {
    this.cents = cents;
  }

  /**
   * Creates Money from an integer number of cents. Fails if the value is not
   * a finite, non-negative integer.
   */
  static fromCents(cents: number): Result<Money, string> {
    if (!Number.isFinite(cents)) {
      return err("Amount must be a finite number");
    }
    if (!Number.isInteger(cents)) {
      return err("Amount must be a whole number of cents");
    }
    if (cents < 0) {
      return err("Amount cannot be negative");
    }
    return ok(new Money(cents));
  }

  /**
   * Creates Money from a decimal euro amount (e.g. 12.34 -> 1234 cents).
   * Rounds to the nearest cent to absorb float imprecision from user input.
   */
  static fromEuros(euros: number): Result<Money, string> {
    if (!Number.isFinite(euros)) {
      return err("Amount must be a finite number");
    }
    if (euros < 0) {
      return err("Amount cannot be negative");
    }
    return Money.fromCents(Math.round(euros * 100));
  }

  static zero(): Money {
    return new Money(0);
  }

  /** Reconstitutes Money from a trusted, already-persisted cents value. */
  static reconstitute(cents: number): Money {
    return new Money(cents);
  }

  add(other: Money): Money {
    return new Money(this.cents + other.cents);
  }

  /**
   * Subtracts another Money. Fails if the result would be negative, since
   * Money represents a magnitude and cannot go below zero.
   */
  subtract(other: Money): Result<Money, string> {
    return Money.fromCents(this.cents - other.cents);
  }

  /** Returns this minus other, clamped at zero. Useful for "remaining budget". */
  subtractClamped(other: Money): Money {
    return new Money(Math.max(0, this.cents - other.cents));
  }

  isZero(): boolean {
    return this.cents === 0;
  }

  isGreaterThan(other: Money): boolean {
    return this.cents > other.cents;
  }

  isGreaterThanOrEqual(other: Money): boolean {
    return this.cents >= other.cents;
  }

  equals(other: Money | null | undefined): boolean {
    if (other === null || other === undefined) return false;
    return this.cents === other.cents;
  }

  /** Decimal euro value (cents / 100). For display/serialization only. */
  toEuros(): number {
    return this.cents / 100;
  }

  /** Localized EUR string, e.g. "1.234,56 €". */
  format(): string {
    return Money.EUR_FORMATTER.format(this.toEuros());
  }
}
