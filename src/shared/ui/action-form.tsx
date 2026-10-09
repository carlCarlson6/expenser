"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";

import type { ActionResult } from "@/shared/result";

import { validationKey } from "./validation-key";

export type FormState = {
  pending: boolean;
  /** First validation message key for a field, if any. */
  fieldError: (field: string) => string | undefined;
  /** Translated first validation message for a field. */
  fieldMessage: (field: string) => string | undefined;
  /** Translated top-level error, if the action failed. */
  errorMessage: string | undefined;
};

/**
 * Binds a Server Action to a form: tracks pending state, exposes translated
 * field errors, and calls `onSuccess` when the action returns ok.
 */
export function ActionForm({
  action,
  onSuccess,
  className,
  children,
}: {
  action: (
    prev: ActionResult | null,
    formData: FormData,
  ) => Promise<ActionResult>;
  onSuccess?: () => void;
  className?: string;
  children: (state: FormState) => React.ReactNode;
}) {
  const t = useTranslations("validation");
  const [state, formAction, pending] = useActionState(
    async (prev: ActionResult | null, formData: FormData) => {
      const result = await action(prev, formData);
      if (result.ok) onSuccess?.();
      return result;
    },
    null,
  );

  const fieldError = (field: string) =>
    state && !state.ok ? state.fieldErrors?.[field]?.[0] : undefined;
  const fieldMessage = (field: string) => {
    const key = fieldError(field);
    return key ? t(validationKey(key)) : undefined;
  };
  const errorMessage =
    state && !state.ok && !state.fieldErrors
      ? t(validationKey(state.error))
      : undefined;

  return (
    <form action={formAction} className={className}>
      {children({ pending, fieldError, fieldMessage, errorMessage })}
    </form>
  );
}
