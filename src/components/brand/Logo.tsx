import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  /** Show only the mark (C⁺) for tight spaces such as a collapsed sidebar. */
  markOnly?: boolean;
};

const sizes = {
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-4xl",
  xl: "text-5xl",
};

/**
 * Connect⁺ wordmark. The plus is always rendered smaller and raised,
 * like a superscript. Never render the brand as plain "Connect+".
 */
export function Logo({ className, size = "md", markOnly = false }: LogoProps) {
  return (
    <span
      aria-label="Connect plus"
      className={cn(
        "inline-flex items-start font-semibold leading-none tracking-tight text-white select-none",
        sizes[size],
        className,
      )}
    >
      <span aria-hidden="true">{markOnly ? "C" : "Connect"}</span>
      <span
        aria-hidden="true"
        className="ml-[0.06em] -translate-y-[0.12em] text-[0.55em] font-bold leading-none text-cyan"
      >
        +
      </span>
    </span>
  );
}
