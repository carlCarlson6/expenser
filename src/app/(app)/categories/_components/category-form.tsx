"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CategoryIcon, ICON_NAMES } from "@/components/category-icon";

export interface CategoryFormData {
  name: string;
  color: string;
  icon: string;
}

export function CategoryForm({
  action,
  defaultValues,
  submitLabel,
  onSuccess,
}: {
  action: (formData: FormData) => Promise<{ error?: string; success?: boolean }>;
  defaultValues?: Partial<CategoryFormData> & { categoryId?: string };
  submitLabel: string;
  onSuccess?: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(defaultValues?.name ?? "");
  const [color, setColor] = useState(defaultValues?.color ?? "#22c55e");
  const [icon, setIcon] = useState(defaultValues?.icon ?? ICON_NAMES[0]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const formData = new FormData();
    if (defaultValues?.categoryId) {
      formData.set("categoryId", defaultValues.categoryId);
    }
    formData.set("name", name.trim());
    formData.set("color", color);
    formData.set("icon", icon);

    startTransition(async () => {
      const result = await action(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(
          defaultValues?.categoryId
            ? "Category updated"
            : "Category created",
        );
        onSuccess?.();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Coffee"
          required
          maxLength={60}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="color">Color</Label>
        <div className="flex items-center gap-3">
          <Input
            id="color"
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-10 w-14 p-1"
          />
          <span className="text-sm text-muted-foreground font-mono">
            {color}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="icon">Icon</Label>
        <select
          id="icon"
          value={icon}
          onChange={(e) => setIcon(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {ICON_NAMES.map((iconName) => (
            <option key={iconName} value={iconName}>
              {iconName}
            </option>
          ))}
        </select>
        <div className="pt-1">
          <CategoryIcon name={icon} className="h-5 w-5" />
        </div>
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}
