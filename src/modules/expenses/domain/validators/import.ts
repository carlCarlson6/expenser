import { z } from "zod";

/** Hard cap per import; the client enforces it before submitting. */
export const MAX_IMPORT_ROWS = 10_000;

/** Rows per INSERT inside the import transaction. */
export const IMPORT_INSERT_BATCH = 500;

export const CATEGORY_NAME_MAX = 50;
export const DESCRIPTION_MAX = 200;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * One ready-to-write import row, as produced by the client preview: dates
 * normalized to ISO, amounts to cents, category names as display text and
 * `null` category routing to the protected bucket.
 */
export const importRowSchema = z.object({
  spentAt: z
    .string()
    .regex(DATE_PATTERN, "invalidDate")
    .refine((value) => !Number.isNaN(Date.parse(value)), "invalidDate"),
  amountCents: z.number().int().positive("invalidAmount"),
  categoryName: z
    .string()
    .trim()
    .min(1, "required")
    .max(CATEGORY_NAME_MAX, "nameTooLong")
    .nullish(),
  description: z
    .string()
    .trim()
    .max(DESCRIPTION_MAX, "descriptionTooLong")
    .nullish(),
});

export type ImportRowInput = z.infer<typeof importRowSchema>;

export const importPayloadSchema = z.object({
  rows: z
    .array(importRowSchema)
    .min(1, "bulkEmpty")
    .max(MAX_IMPORT_ROWS, "tooManyRows"),
});

export const duplicateRangeSchema = z.object({
  from: z.string().regex(DATE_PATTERN),
  to: z.string().regex(DATE_PATTERN),
});
