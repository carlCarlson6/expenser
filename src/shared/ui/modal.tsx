"use client";

import { useEffect } from "react";

import { cx } from "./cx";

export function Modal({
  open,
  onClose,
  title,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 cursor-default bg-zinc-950/40"
        onClick={onClose}
      />
      <div
        className={cx(
          "relative w-full rounded-xl bg-white p-6 shadow-xl",
          wide ? "max-w-lg" : "max-w-md",
        )}
      >
        <h2 className="mb-4 text-lg font-semibold text-zinc-900">{title}</h2>
        {children}
      </div>
    </div>
  );
}
