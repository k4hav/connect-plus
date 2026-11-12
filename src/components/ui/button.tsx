import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-medium transition-[transform,background-color,filter,box-shadow] duration-200 active:scale-[0.97] hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/60 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-cyan text-white hover:bg-bright hover:shadow-[0_10px_26px_-10px_rgba(255,59,71,0.7)]",
        secondary: "glass text-white hover:bg-white/10",
        ghost: "text-white/70 hover:bg-white/5 hover:text-white",
        amber: "bg-amber text-[#1b1203] hover:brightness-110",
        danger: "bg-danger/90 text-white hover:bg-danger",
      },
      size: {
        sm: "h-9 px-3",
        md: "h-11 px-5",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  ),
);
Button.displayName = "Button";
