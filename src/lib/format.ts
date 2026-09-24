import { getFormatLocale } from '@/lib/locale';

/** `Intl.NumberFormat#formatRange` is ES2023; this project's type library is ES2022. */
interface RangeCapableFormat {
  formatRange?: (start: number, end: number) => string;
}

function currencyFormatter(currency: string | undefined): Intl.NumberFormat | null {
  if (!currency) return null;
  try {
    return new Intl.NumberFormat(getFormatLocale(), {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    });
  } catch {
    // Not an ISO 4217 code this browser knows.
    return null;
  }
}

/**
 * Formats a compact salary range: "SAR 18,000–24,000", "‏18,000–24,000 ر.س.‏",
 * or a one-sided "From SAR 18,000".
 *
 * Uses the browser's own range formatting where it exists, so the currency is
 * written once and placed where the locale expects it. Equal ends are formatted
 * as a single figure on purpose: `formatRange` would print "~SAR 18,000", and the
 * "approximately" sign would misdescribe an exact number.
 */
export function formatSalaryRange(
  min: number | undefined,
  max: number | undefined,
  currency: string | undefined,
  /** Wording for the one-sided cases; defaults to English. */
  labels: { from: string; upTo: string } = { from: 'From {value}', upTo: 'Up to {value}' },
): string | null {
  if (min === undefined && max === undefined) return null;

  const formatter = currencyFormatter(currency);
  const plain = new Intl.NumberFormat(getFormatLocale());
  const format = (value: number) =>
    formatter
      ? formatter.format(value)
      : currency
        ? `${plain.format(value)} ${currency}`
        : plain.format(value);

  if (min !== undefined && max !== undefined) {
    if (min === max) return format(min);
    const ranged = (formatter as RangeCapableFormat | null)?.formatRange;
    if (formatter && typeof ranged === 'function') return ranged.call(formatter, min, max);
    return `${format(min)} – ${format(max)}`;
  }
  if (min !== undefined) return labels.from.replace('{value}', format(min));
  return labels.upTo.replace('{value}', format(max as number));
}

/** A single amount in a currency, e.g. an expectation: "SAR 20,000". */
export function formatMoney(amount: number, currency: string): string {
  const formatter = currencyFormatter(currency);
  return formatter
    ? formatter.format(amount)
    : `${new Intl.NumberFormat(getFormatLocale()).format(amount)} ${currency}`;
}
