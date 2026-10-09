import { z } from "zod";

import { HEX_COLOR, normalizeHex } from "../../data/palette";

export const categoryNameSchema = z.object({
  name: z.string().trim().min(1, "required").max(50, "nameTooLong"),
  /** Free-form hex, so the color wheel is not limited to the palette.
   *  Normalized to lowercase `#rrggbb` so stored colors are comparable. */
  color: z
    .string()
    .trim()
    .regex(HEX_COLOR, "invalidColor")
    .transform(normalizeHex)
    .optional(),
});

export type CategoryNameInput = z.infer<typeof categoryNameSchema>;