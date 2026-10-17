import { useId } from 'react';
import type { LucideIcon } from 'lucide-react';

/**
 * One headline number. Kept deliberately compact: icon, number, label. The
 * plain-language definition stays available to screen readers and as a hover
 * hint, so the number is never ambiguous without crowding the card.
 */
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
    <figure
      className="cf-card m-0 flex items-center gap-4 p-4"
      aria-labelledby={labelId}
      title={definition}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-2xl font-semibold leading-none tracking-tight tabular-nums text-ink">
          {value}
        </p>
        <figcaption id={labelId} className="mt-1.5 truncate text-sm text-ink-muted">
          {label}
        </figcaption>
        <p className="sr-only">{definition}</p>
      </div>
    </figure>
  );
}
