"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Money } from "@/shared/kernel/money";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Progress,
  ProgressIndicator,
  ProgressLabel,
  ProgressTrack,
  ProgressValue,
} from "@/components/ui/progress";
import { CategoryIcon } from "@/components/category-icon";
import type { BudgetStatusDto } from "@/modules/budgets/application/budget.dto";
import { cn } from "@/lib/utils";

export function BudgetCard({
  status,
  yearMonth,
  action,
}: {
  status: BudgetStatusDto;
  yearMonth: string;
  action: (formData: FormData) => Promise<{ error?: string; success?: boolean }>;
}) {
  const [isPending, startTransition] = useTransition();
  const [amount, setAmount] = useState(
    Money.reconstitute(status.plannedCents).toEuros().toFixed(2),
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const formData = new FormData();
    formData.set("categoryId", status.category.id);
    formData.set("yearMonth", yearMonth);
    formData.set("amount", amount);

    startTransition(async () => {
      const result = await action(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Budget updated");
      }
    });
  }

  const planned = Money.reconstitute(status.plannedCents).format();
  const actual = Money.reconstitute(status.actualCents).format();
  const remaining = Money.reconstitute(status.remainingCents).format();
  const overspend = Money.reconstitute(status.overspendCents).format();

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl bg-card p-4 ring-1 ring-foreground/10"
    >
      <div className="mb-4 flex items-center gap-3">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: status.category.color }}
        >
          <CategoryIcon name={status.category.icon} className="h-5 w-5 text-white" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-medium">{status.category.name}</h3>
          <p className="text-xs text-muted-foreground">
            Planned: {planned}
          </p>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <Input
          type="number"
          step="0.01"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          className="max-w-[140px]"
        />
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Saving..." : "Set budget"}
        </Button>
      </div>

      <Progress value={status.percentUsed}>
        <ProgressLabel className="text-xs">Spent</ProgressLabel>
        <ProgressValue
          className={cn(
            "text-xs",
            status.isOverBudget && "text-destructive font-medium",
          )}
        >
          {() => `${status.percentUsed}%`}
        </ProgressValue>
        <ProgressTrack>
          <ProgressIndicator
            className={cn(status.isOverBudget && "bg-destructive")}
          />
        </ProgressTrack>
      </Progress>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>Actual: {actual}</span>
        {status.isOverBudget ? (
          <span className="text-destructive font-medium">
            Overspend: {overspend}
          </span>
        ) : (
          <span>Remaining: {remaining}</span>
        )}
      </div>
    </form>
  );
}
