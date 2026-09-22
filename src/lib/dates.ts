/**
 * Calendar-date helpers.
 *
 * The whole app stores calendar dates as `YYYY-MM-DD` strings and *never*
 * round-trips them through `new Date('2026-03-12')`, because that is parsed as
 * UTC midnight and renders as the previous day for any user in a negative UTC
 * offset. Everything here builds local-midnight `Date` objects explicitly.
 */

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export function isValidDateOnly(value: unknown): value is string {
  if (typeof value !== 'string' || !DATE_ONLY_PATTERN.test(value)) return false;
  const parts = value.split('-');
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const probe = new Date(year, month - 1, day);
  // Rejects impossible dates such as 2026-02-31, which JS would roll over.
  return (
    probe.getFullYear() === year && probe.getMonth() === month - 1 && probe.getDate() === day
  );
}

export function isValidTime(value: unknown): value is string {
  return typeof value === 'string' && TIME_PATTERN.test(value);
}

/** Converts `YYYY-MM-DD` to a `Date` at **local** midnight. */
export function parseDateOnly(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1);
}

/** Converts a `Date` to `YYYY-MM-DD` using its **local** calendar fields. */
export function toDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function todayDateOnly(): string {
  return toDateOnly(new Date());
}

export function addDays(value: string, days: number): string {
  const date = parseDateOnly(value);
  date.setDate(date.getDate() + days);
  return toDateOnly(date);
}

/** Whole calendar days from `from` to `to`; negative when `to` is earlier. */
export function differenceInDays(from: string, to: string): number {
  const a = parseDateOnly(from).getTime();
  const b = parseDateOnly(to).getTime();
  return Math.round((b - a) / 86_400_000);
}

export function formatDateOnly(value: string | undefined): string {
  if (!value || !isValidDateOnly(value)) return '—';
  return parseDateOnly(value).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateOnlyShort(value: string): string {
  return parseDateOnly(value).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
  });
}

/** Formats a stored instant (ISO string) in the browser's local timezone. */
export function formatInstant(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Formats `HH:mm` (24-hour) using the visitor's locale conventions. */
export function formatTime(time: string): string {
  if (!isValidTime(time)) return '—';
  const [hours, minutes] = time.split(':').map(Number);
  const probe = new Date(2000, 0, 1, hours ?? 0, minutes ?? 0);
  return probe.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

/** "Today", "Tomorrow", "in 4 days", "3 days ago" — relative to local today. */
export function describeRelativeDay(value: string, today = todayDateOnly()): string {
  const delta = differenceInDays(today, value);
  if (delta === 0) return 'Today';
  if (delta === 1) return 'Tomorrow';
  if (delta === -1) return 'Yesterday';
  if (delta > 1) return `In ${delta} days`;
  return `${Math.abs(delta)} days ago`;
}

/** The IANA timezone the browser is using, shown wherever times are entered. */
export function localTimeZoneName(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'your local time';
  } catch {
    return 'your local time';
  }
}
