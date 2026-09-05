"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { MoreHorizontal } from "lucide-react";
import {
  deleteTransactionAction,
  updateTransactionAction,
} from "@/app/actions/transactions.actions";
import { Money } from "@/shared/kernel/money";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { CategoryDto } from "@/modules/categories/application/category.dto";
import type { TransactionListItemDto } from "@/modules/ledger/application/transaction.dto";
import { TransactionForm } from "./transaction-form";

export function TransactionActions({
  transaction,
  categories,
}: {
  transaction: TransactionListItemDto;
  categories: CategoryDto[];
}) {
  const [isPending, startTransition] = useTransition();
  const [editOpen, setEditOpen] = useState(false);

  function handleDelete() {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("transactionId", transaction.id);
      const result = await deleteTransactionAction(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Transaction deleted");
      }
    });
  }

  return (
    <Dialog open={editOpen} onOpenChange={setEditOpen}>
      <DropdownMenu>
          <DropdownMenuTrigger
            render={(
              <Button variant="ghost" size="sm" className="px-2 sm:px-3">
                <MoreHorizontal className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Actions</span>
              </Button>
            )}
          />
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setEditOpen(true)}>
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={handleDelete}
            disabled={isPending}
            variant="destructive"
          >
            {isPending ? "Deleting..." : "Delete"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit transaction</DialogTitle>
        </DialogHeader>
        <TransactionForm
          action={updateTransactionAction}
          categories={categories}
          defaultValues={{
            transactionId: transaction.id,
            type: transaction.type,
            amount: Money.reconstitute(transaction.amountCents).toEuros().toFixed(2),
            date: transaction.date,
            categoryId: transaction.categoryId ?? undefined,
            note: transaction.note,
          }}
          submitLabel="Save changes"
          onSuccess={() => setEditOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
