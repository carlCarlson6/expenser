"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ledger } from "@/composition/ledger-composition";

function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

const transactionTypeSchema = z.enum(["expense", "income"]);

const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date");

const createTransactionSchema = z.object({
  type: transactionTypeSchema,
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  date: isoDateSchema,
  categoryId: z.string().optional(),
  note: z.string().optional(),
});

export async function createTransactionAction(formData: FormData) {
  const { userId } = await auth();
  if (!userId) return { error: "Unauthorized" };

  const parsed = createTransactionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues.map((e) => e.message).join(", ") };
  }

  const result = await ledger.create({
    userId,
    type: parsed.data.type,
    amountEuros: parsed.data.amount,
    date: parseLocalDate(parsed.data.date),
    categoryId: parsed.data.categoryId,
    note: parsed.data.note,
  });
  if (!result.ok) return { error: result.error };

  revalidatePath("/transactions");
  return { success: true };
}

const updateTransactionSchema = z.object({
  transactionId: z.string().min(1),
  type: transactionTypeSchema,
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  date: isoDateSchema,
  categoryId: z.string().optional(),
  note: z.string().optional(),
});

export async function updateTransactionAction(formData: FormData) {
  const { userId } = await auth();
  if (!userId) return { error: "Unauthorized" };

  const parsed = updateTransactionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues.map((e) => e.message).join(", ") };
  }

  const { transactionId, amount, date, categoryId, note, type } = parsed.data;
  const result = await ledger.update({
    transactionId,
    userId,
    type,
    amountEuros: amount,
    date: new Date(date),
    categoryId,
    note,
  });
  if (!result.ok) return { error: result.error };

  revalidatePath("/transactions");
  return { success: true };
}

const deleteTransactionSchema = z.object({
  transactionId: z.string().min(1),
});

export async function deleteTransactionAction(formData: FormData) {
  const { userId } = await auth();
  if (!userId) return { error: "Unauthorized" };

  const parsed = deleteTransactionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues.map((e) => e.message).join(", ") };
  }

  const result = await ledger.delete({
    transactionId: parsed.data.transactionId,
    userId,
  });
  if (!result.ok) return { error: result.error };

  revalidatePath("/transactions");
  return { success: true };
}
