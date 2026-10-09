import { z } from "zod";

export const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

export const categoryNameSchema = z.object({
  name: z.string().trim().min(1, "required").max(50, "nameTooLong"),
  color: z
    .string()
    .regex(HEX_COLOR, "invalidColor")
    .optional(),
});

export type CategoryNameInput = z.infer<typeof categoryNameSchema>;
