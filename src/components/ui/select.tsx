"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useFieldError } from "@/components/ui/form-errors";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error: errorProp, hint, id, options, placeholder, ...props }, ref) => {
    const error = useFieldError(props.name, errorProp);
    const autoId = React.useId();
    const fieldId = id ?? autoId;
    const descId = `${fieldId}-desc`;
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={fieldId} className="label">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={fieldId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? descId : undefined}
          className={cn(
            "h-11 w-full appearance-none rounded-xl border border-white/10 bg-[#0f1826] px-3.5 text-sm text-ink transition-colors focus:border-cyan/60 focus:outline-none focus:ring-2 focus:ring-cyan/20",
            error && "border-danger/60",
            className,
          )}
          {...props}
        >
          {placeholder !== undefined && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {(error || hint) && (
          <p id={descId} className={cn("text-xs", error ? "text-danger" : "text-white/40")}>
            {error ?? hint}
          </p>
        )}
      </div>
    );
  },
);
Select.displayName = "Select";