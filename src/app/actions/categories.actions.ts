"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { categories } from "@/composition/categories-composition";

const hexColorSchema = z
  .string()
  .min(1)
  .regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Invalid hex color");

const createCategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(60, "Name is too long"),
  color: hexColorSchema,
  icon: z.string().min(1, "Icon is required"),
});

export async function createCategoryAction(formData: FormData) {
  const { userId } = await auth();
  if (!userId) return { error: "Unauthorized" };

  const parsed = createCategorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues.map((e) => e.message).join(", ") };
  }

  const result = await categories.create({ userId, ...parsed.data });
  if (!result.ok) return { error: result.error };

  revalidatePath("/categories");
  return { success: true };
}

const updateCategorySchema = z.object({
  categoryId: z.string().min(1),
  name: z.string().min(1, "Name is required").max(60, "Name is too long"),
  color: hexColorSchema,
  icon: z.string().min(1, "Icon is required"),
});

export async function updateCategoryAction(formData: FormData) {
  const { userId } = await auth();
  if (!userId) return { error: "Unauthorized" };

  const parsed = updateCategorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues.map((e) => e.message).join(", ") };
  }

  const { categoryId, ...fields } = parsed.data;
  const result = await categories.update({ categoryId, userId, ...fields });
  if (!result.ok) return { error: result.error };

  revalidatePath("/categories");
  return { success: true };
}

const deleteCategorySchema = z.object({
  categoryId: z.string().min(1),
});

export async function deleteCategoryAction(formData: FormData) {
  const { userId } = await auth();
  if (!userId) return { error: "Unauthorized" };

  const parsed = deleteCategorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues.map((e) => e.message).join(", ") };
  }

  const result = await categories.delete({
    categoryId: parsed.data.categoryId,
    userId,
  });
  if (!result.ok) return { error: result.error };

  revalidatePath("/categories");
  return { success: true };
}
