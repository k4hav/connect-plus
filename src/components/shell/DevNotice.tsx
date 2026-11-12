/** Small notice at the very top: the project is still being built. */
export function DevNotice() {
  return (
    <p className="mb-3 flex items-center justify-center gap-2 rounded-full border border-cyan/25 bg-cyan/[0.08] px-4 py-1.5 text-center text-xs text-white/80">
      <span className="relative flex h-1.5 w-1.5 shrink-0" aria-hidden="true">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan opacity-70" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cyan" />
      </span>
      <span>This project is under development</span>
    </p>
  );
}
