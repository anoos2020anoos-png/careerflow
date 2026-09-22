export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <span
        aria-hidden="true"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand text-white dark:text-slate-950"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <path d="M4 18v-7a1.5 1.5 0 0 1 1.5-1.5h13A1.5 1.5 0 0 1 20 11v7" />
          <path d="M9 9.5V8a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 8v1.5" />
          <path d="M4 14h16" opacity="0.55" />
        </svg>
      </span>
      {compact ? null : (
        <span className="text-[15px] font-semibold tracking-tight text-ink">CareerFlow</span>
      )}
    </span>
  );
}
