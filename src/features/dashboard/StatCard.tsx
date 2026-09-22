import { useId } from 'react';
import type { LucideIcon } from 'lucide-react';

export function StatCard({
  label,
  value,
  definition,
  icon: Icon,
}: {
  label: string;
  value: number;
  /** Plain-language definition, so no number on this page is ambiguous. */
  definition: string;
  icon: LucideIcon;
}) {
  const labelId = useId();

  return (
    <figure className="cf-card m-0 p-4" aria-labelledby={labelId}>
      <div className="flex items-start justify-between gap-3">
        <figcaption id={labelId} className="text-sm font-medium text-ink-muted">
          {label}
        </figcaption>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums text-ink">{value}</p>
      <p className="mt-1 text-xs leading-relaxed text-ink-muted">{definition}</p>
    </figure>
  );
}
