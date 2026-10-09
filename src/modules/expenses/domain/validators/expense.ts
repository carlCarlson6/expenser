import { z } from "zod";

import { parseAmountToCents } from "@/shared/money/money";

export const expenseInputSchema = z.object({
  amount: z
    .string()
    .transform((raw, ctx) => {
      const cents = parseAmountToCents(raw);
      if (cents === null) {
        ctx.addIssue({ code: "custom", message: "invalidAmount" });
        return z.NEVER;
      }
      return cents;
    }),
  categoryId: z.uuid(),
  description: z
    .string()
    .trim()
    .max(200, "descriptionTooLong")
    .transform((v) => (v === "" ? undefined : v))
    .optional(),
  spentAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "invalidDate")
    .refine((v) => !Number.isNaN(Date.parse(v)), "invalidDate"),
});

export type ExpenseInput = z.infer<typeof expenseInputSchema>;

/** Upper bound on one bulk submission, enforced by the action. */
export const MAX_BULK_ROWS = 50;

/** A whole batch goes through the same per-row rules as a single expense. */
export const bulkExpensesSchema = z.object({
  rows: z.array(expenseInputSchema),
});

export type BulkExpensesInput = z.infer<typeof bulkExpensesSchema>;

/**
 * Flattens a failed batch parse into `rows.<index>.<field>` keys, so a form can
 * resolve each row's messages through the same `fieldErrors` map the
 * single-expense form already uses.
 */
export function toBulkFieldErrors(error: z.ZodError): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    // Zod reports paths relative to the wrapped object: ["rows", 1, "amount"].
    // Drop the wrapper so only a row-scoped pair (index, field) is left.
    const path = issue.path[0] === "rows" ? issue.path.slice(1) : issue.path;
    const [index, field] = path;
    const key =
      typeof index === "number" && typeof field === "string"
        ? `rows.${index}.${field}`
        : "rows";
    (fieldErrors[key] ??= []).push(issue.message);
  }
  return fieldErrors;
}

export const expenseFiltersSchema = z.object({
  categoryId: z.uuid().optional(),
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  search: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).catch(1),
});

export type ExpenseFiltersInput = z.infer<typeof expenseFiltersSchema>;
