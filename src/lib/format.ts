import { getFormatLocale } from '@/lib/locale';

/** Formats a compact salary range such as "€70,000 – €88,000" or "from $420". */
export function formatSalaryRange(
  min: number | undefined,
  max: number | undefined,
  currency: string | undefined,
  /** Wording for the one-sided cases; defaults to English. */
  labels: { from: string; upTo: string } = { from: 'From {value}', upTo: 'Up to {value}' },
): string | null {
  if (min === undefined && max === undefined) return null;

  const format = (value: number) => {
    if (currency) {
      try {
        return new Intl.NumberFormat(getFormatLocale(), {
          style: 'currency',
          currency,
          maximumFractionDigits: 0,
        }).format(value);
      } catch {
        // Unknown currency code — fall through to a plain number plus the code.
        return `${new Intl.NumberFormat(getFormatLocale()).format(value)} ${currency}`;
      }
    }
    return new Intl.NumberFormat(getFormatLocale()).format(value);
  };

  if (min !== undefined && max !== undefined) {
    return min === max ? format(min) : `${format(min)} – ${format(max)}`;
  }
  if (min !== undefined) return labels.from.replace('{value}', format(min));
  return labels.upTo.replace('{value}', format(max as number));
}
