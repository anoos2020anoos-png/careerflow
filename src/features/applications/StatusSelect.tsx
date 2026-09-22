import { useId } from 'react';
import { APPLICATION_STATUSES, STATUS_LABELS, type ApplicationStatus } from '@/types';
import { cn } from '@/lib/cn';

/**
 * Status changes use a native `<select>` on purpose: it is reachable by
 * keyboard and screen reader everywhere, works on touch, and means drag and
 * drop never becomes the only way to move a card between columns.
 */
export function StatusSelect({
  value,
  onChange,
  label,
  className,
  size = 'md',
}: {
  value: ApplicationStatus;
  onChange: (status: ApplicationStatus) => void;
  /** Visually hidden label, e.g. "Status for Northwind Analytics". */
  label: string;
  className?: string;
  size?: 'sm' | 'md';
}) {
  const id = useId();

  return (
    <>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value as ApplicationStatus)}
        className={cn(
          'rounded-lg border border-line bg-surface text-ink transition-colors hover:bg-surface-muted',
          size === 'sm' ? 'h-8 px-2 text-xs' : 'h-9 px-2.5 text-sm',
          className,
        )}
      >
        {APPLICATION_STATUSES.map((status) => (
          <option key={status} value={status}>
            {STATUS_LABELS[status]}
          </option>
        ))}
      </select>
    </>
  );
}
