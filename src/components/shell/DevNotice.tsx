/** Plain text with a blinking red dot. No box. */
export function DevNotice({ className = "" }: { className?: string }) {
  return (
    <p className={`items-center gap-2 text-xs text-white/70 ${className}`}>
      <span className="relative flex h-1.5 w-1.5 shrink-0" aria-hidden="true">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan opacity-70" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cyan" />
      </span>
      This project is under development
    </p>
  );
}
