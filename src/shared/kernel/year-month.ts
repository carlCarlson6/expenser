import { err, ok, type Result } from "./result";

/**
 * YearMonth value object — a calendar month identified by year + month, in the
 * user's timezone. Months travel between client and server as "YYYY-MM"
 * strings, so no server-side timezone math is ever needed.
 */
export class YearMonth {
  readonly year: number;
  /** 1-12 */
  readonly month: number;

  private constructor(year: number, month: number) {
    this.year = year;
    this.month = month;
  }

  static create(year: number, month: number): Result<YearMonth, string> {
    if (!Number.isInteger(year) || year < 1970 || year > 9999) {
      return err("Year must be an integer between 1970 and 9999");
    }
    if (!Number.isInteger(month) || month < 1 || month > 12) {
      return err("Month must be an integer between 1 and 12");
    }
    return ok(new YearMonth(year, month));
  }

  /**
   * Parses a "YYYY-MM" string (the canonical wire/storage format).
   */
  static parse(value: string): Result<YearMonth, string> {
    const match = /^(\d{4})-(\d{2})$/.exec(value.trim());
    if (!match) {
      return err(`Invalid year-month "${value}", expected format YYYY-MM`);
    }
    return YearMonth.create(Number(match[1]), Number(match[2]));
  }

  /** Builds a YearMonth from a Date using the Date's own (local) components. */
  static fromDate(date: Date): YearMonth {
    return new YearMonth(date.getFullYear(), date.getMonth() + 1);
  }

  /** Reconstitutes from trusted persisted parts without revalidation. */
  static reconstitute(year: number, month: number): YearMonth {
    return new YearMonth(year, month);
  }

  /** Canonical "YYYY-MM" format. */
  toString(): string {
    return `${this.year}-${String(this.month).padStart(2, "0")}`;
  }

  equals(other: YearMonth | null | undefined): boolean {
    if (other === null || other === undefined) return false;
    return this.year === other.year && this.month === other.month;
  }

  /** Negative if this < other, zero if equal, positive if this > other. */
  compareTo(other: YearMonth): number {
    return this.year - other.year || this.month - other.month;
  }

  isBefore(other: YearMonth): boolean {
    return this.compareTo(other) < 0;
  }

  isAfter(other: YearMonth): boolean {
    return this.compareTo(other) > 0;
  }

  /** The month n months after this one (negative n moves backwards). */
  addMonths(n: number): YearMonth {
    const total = this.year * 12 + (this.month - 1) + n;
    return new YearMonth(Math.floor(total / 12), (total % 12) + 1);
  }

  next(): YearMonth {
    return this.addMonths(1);
  }

  previous(): YearMonth {
    return this.addMonths(-1);
  }

  /**
   * Inclusive date range [firstDay, lastDay] covering the whole month, as
   * "YYYY-MM-DD" strings suitable for a Postgres `date` column comparison.
   */
  toDateRange(): { start: string; end: string } {
    const start = `${this.toString()}-01`;
    // Day 0 of the next month is the last day of this month.
    const lastDay = new Date(this.year, this.month, 0).getDate();
    const end = `${this.toString()}-${String(lastDay).padStart(2, "0")}`;
    return { start, end };
  }

  /** Number of days in this month (28-31). */
  daysInMonth(): number {
    return new Date(this.year, this.month, 0).getDate();
  }

  /** The last `count` months ending at (and including) this month, oldest first. */
  lastNMonths(count: number): YearMonth[] {
    const months: YearMonth[] = [];
    for (let i = count - 1; i >= 0; i--) {
      months.push(this.addMonths(-i));
    }
    return months;
  }
}
