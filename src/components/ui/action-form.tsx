"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import type { ActionState } from "@/lib/action-state";
import { FormErrorsContext } from "@/components/ui/form-errors";

export function SubmitButton({ children, ...props }: Omit<ButtonProps, "type" | "loading">) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending} {...props}>
      {children}
    </Button>
  );
}

type Props = {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  children: React.ReactNode | ((errors: Record<string, string>) => React.ReactNode);
  submitLabel?: string;
  submitVariant?: ButtonProps["variant"];
  className?: string;
  resetOnSuccess?: boolean;
  /** Hide the built-in submit button when children render their own. */
  hideSubmit?: boolean;
  submitClassName?: string;
};

/** Wraps a server action: pending state, inline field errors and a success/error banner. */
export function ActionForm({
  action,
  children,
  submitLabel = "Save",
  submitVariant,
  className,
  resetOnSuccess = true,
  hideSubmit,
  submitClassName,
}: Props) {
  const [state, formAction] = useActionState<ActionState, FormData>(action, {});
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok && resetOnSuccess) ref.current?.reset();
  }, [state, resetOnSuccess]);

  const errors = state.errors ?? {};
  return (
    <form ref={ref} action={formAction} className={className ?? "space-y-4"}>
      {state.message && <Alert kind={state.ok ? "success" : "error"}>{state.message}</Alert>}
      <FormErrorsContext.Provider value={errors}>{typeof children === "function" ? children(errors) : children}</FormErrorsContext.Provider>
      {!hideSubmit && (
        <SubmitButton variant={submitVariant} className={submitClassName}>
          {submitLabel}
        </SubmitButton>
      )}
    </form>
  );
}