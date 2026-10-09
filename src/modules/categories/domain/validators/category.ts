import { z } from "zod";

export const categoryNameSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "required")
    .max(50, "nameTooLong"),
});

export type CategoryNameInput = z.infer<typeof categoryNameSchema>;
