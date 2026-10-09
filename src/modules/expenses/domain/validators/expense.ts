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
