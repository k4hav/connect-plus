"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useFieldError } from "@/components/ui/form-errors";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error: errorProp, hint, id, ...props }, ref) => {
    const error = useFieldError(props.name, errorProp);
    const autoId = React.useId();
    const inputId = id ?? autoId;
    const descId = `${inputId}-desc`;
    return (
      <div className="space-y-1.5">
        <label htmlFor={inputId} className="text-xs font-medium text-white/60">
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? descId : undefined}
          className={cn(
            "h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 text-sm text-white placeholder:text-white/30 transition-colors focus:border-cyan/60 focus:outline-none focus:ring-2 focus:ring-cyan/20",
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
Input.displayName = "Input";