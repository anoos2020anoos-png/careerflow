/** Formats a compact salary range such as "€70,000 – €88,000" or "from $420". */
export function formatSalaryRange(
  min: number | undefined,
  max: number | undefined,
  currency: string | undefined,
): string | null {
  if (min === undefined && max === undefined) return null;

  const format = (value: number) => {
    if (currency) {
      try {
        return new Intl.NumberFormat(undefined, {
          style: 'currency',
          currency,
          maximumFractionDigits: 0,
        }).format(value);
      } catch {
        // Unknown currency code — fall through to a plain number plus the code.
        return `${new Intl.NumberFormat().format(value)} ${currency}`;
      }
    }
    return new Intl.NumberFormat().format(value);
  };

  if (min !== undefined && max !== undefined) {
    return min === max ? format(min) : `${format(min)} – ${format(max)}`;
  }
  if (min !== undefined) return `From ${format(min)}`;
  return `Up to ${format(max as number)}`;
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return count === 1 ? singular : plural;
}
