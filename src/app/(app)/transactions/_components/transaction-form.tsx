"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CategoryDto } from "@/modules/categories/application/category.dto";

export interface TransactionFormData {
  type: "expense" | "income";
  amount: string;
  date: string;
  categoryId?: string;
  note?: string;
}

export function TransactionForm({
  action,
  categories,
  defaultValues,
  submitLabel,
  onSuccess,
}: {
  action: (formData: FormData) => Promise<{ error?: string; success?: boolean }>;
  categories: CategoryDto[];
  defaultValues?: Partial<TransactionFormData> & { transactionId?: string };
  submitLabel: string;
  onSuccess?: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [type, setType] = useState<"expense" | "income">(
    defaultValues?.type ?? "expense",
  );
  const [amount, setAmount] = useState(defaultValues?.amount ?? "");
  const [date, setDate] = useState(
    defaultValues?.date ?? new Date().toISOString().slice(0, 10),
  );
  const [categoryId, setCategoryId] = useState(defaultValues?.categoryId ?? "");
  const [note, setNote] = useState(defaultValues?.note ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const formData = new FormData();
    if (defaultValues?.transactionId) {
      formData.set("transactionId", defaultValues.transactionId);
    }
    formData.set("type", type);
    formData.set("amount", amount);
    formData.set("date", date);
    if (type === "expense" && categoryId) {
      formData.set("categoryId", categoryId);
    }
    formData.set("note", note);

    startTransition(async () => {
      const result = await action(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(
          defaultValues?.transactionId
            ? "Transaction updated"
            : "Transaction created",
        );
        if (!defaultValues?.transactionId) {
          setAmount("");
          setNote("");
          setCategoryId("");
        }
        onSuccess?.();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Type</Label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={type === "expense" ? "default" : "outline"}
            onClick={() => setType("expense")}
            className="flex-1"
          >
            Expense
          </Button>
          <Button
            type="button"
            variant={type === "income" ? "default" : "outline"}
            onClick={() => setType("income")}
            className="flex-1"
          >
            Income
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount">Amount (€)</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          min="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="date">Date</Label>
        <Input
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>

      {type === "expense" && (
        <div className="space-y-2">
          <Label htmlFor="categoryId">Category</Label>
          <select
            id="categoryId"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="" disabled>
              Select a category
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="note">Note</Label>
        <Input
          id="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Optional note"
        />
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}
