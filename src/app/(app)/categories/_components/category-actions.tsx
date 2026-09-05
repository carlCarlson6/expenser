"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  deleteCategoryAction,
  updateCategoryAction,
} from "@/app/actions/categories.actions";
import { CategoryIcon } from "@/components/category-icon";
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
import { CategoryForm } from "./category-form";

export function CategoryActions({ category }: { category: CategoryDto }) {
  const [isPending, startTransition] = useTransition();
  const [editOpen, setEditOpen] = useState(false);

  function handleDelete() {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("categoryId", category.id);
      const result = await deleteCategoryAction(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Category deleted");
      }
    });
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <CategoryIcon name={category.icon} className="h-5 w-5" />
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="sm">Actions</Button>} />
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
            <DialogTitle>Edit category</DialogTitle>
          </DialogHeader>
          <CategoryForm
            action={updateCategoryAction}
            defaultValues={category}
            submitLabel="Save changes"
            onSuccess={() => setEditOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
