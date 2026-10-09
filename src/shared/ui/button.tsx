import type { ButtonHTMLAttributes } from "react";

import { cx } from "./cx";

type Variant = "primary" | "secondary" | "danger" | "ghost";

const variants: Record<Variant, string> = {
  primary:
    "bg-indigo-600 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-indigo-600",
  secondary:
    "border border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-100 focus-visible:outline-zinc-400",
  danger:
    "bg-red-600 text-white hover:bg-red-500 focus-visible:outline-red-600",
  ghost: "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
};

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={cx(
        "inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
