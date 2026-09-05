"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { budgets } from "@/composition/budget-composition";
import { YearMonth } from "@/shared/kernel/year-month";

const setBudgetSchema = z.object({
  categoryId: z.string().min(1),
  yearMonth: z.string().regex(/^\d{4}-\d{2}$/, "Invalid year-month"),
  amount: z.coerce.number().min(0, "Amount cannot be negative"),
});

export async function setBudgetAction(formData: FormData) {
  const { userId } = await auth();
  if (!userId) return { error: "Unauthorized" };

  const parsed = setBudgetSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues.map((e) => e.message).join(", ") };
  }

  const yearMonthResult = YearMonth.parse(parsed.data.yearMonth);
  if (!yearMonthResult.ok) return { error: yearMonthResult.error };

  const result = await budgets.set({
    userId,
    categoryId: parsed.data.categoryId,
    yearMonth: yearMonthResult.value,
    amountEuros: parsed.data.amount,
  });
  if (!result.ok) return { error: result.error };

  revalidatePath("/budgets");
  return { success: true };
}

const deleteBudgetSchema = z.object({
  budgetId: z.string().min(1),
});

export async function deleteBudgetAction(formData: FormData) {
  const { userId } = await auth();
  if (!userId) return { error: "Unauthorized" };

  const parsed = deleteBudgetSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues.map((e) => e.message).join(", ") };
  }

  const result = await budgets.delete({
    budgetId: parsed.data.budgetId,
    userId,
  });
  if (!result.ok) return { error: result.error };

  revalidatePath("/budgets");
  return { success: true };
}
