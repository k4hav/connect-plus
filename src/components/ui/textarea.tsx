"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useFieldError } from "@/components/ui/form-errors";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error: errorProp, hint, id, rows = 4, ...props }, ref) => {
    const error = useFieldError(props.name, errorProp);
    const autoId = React.useId();
    const fieldId = id ?? autoId;
    const descId = `${fieldId}-desc`;
    return (
      <div className="space-y-1.5">
        <label htmlFor={fieldId} className="label">
          {label}
        </label>
        <textarea
          ref={ref}
          id={fieldId}
          rows={rows}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? descId : undefined}
          className={cn(
            "w-full resize-y rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-ink placeholder:text-white/30 transition-colors focus:border-cyan/60 focus:outline-none focus:ring-2 focus:ring-cyan/20",
            error && "border-danger/60 focus:border-danger/60 focus:ring-danger/20",
            className,
          )}
          {...props}
        />
        {(error || hint) && (
          <p id={descId} className={cn("text-xs", error ? "text-danger" : "text-white/40")}>
            {error ?? hint}
          </p>
        )}
      </div>
    );
  },
);
Textarea.displayName = "Textarea";