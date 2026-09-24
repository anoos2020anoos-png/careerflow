import type { Application, SalaryExpectation, SalaryPeriod } from '@/types';

/**
 * Salary arithmetic, kept to what can be done exactly.
 *
 * The one conversion made anywhere in the app is annual <-> monthly, because a
 * year is twelve months by definition. Everything else is refused rather than
 * approximated:
 *
 * - Daily or hourly to monthly would need a number of working days or hours,
 *   and any figure chosen (21.7? 22? 26?) would quietly become part of the
 *   answer. So a day rate is only ever compared with another day rate.
 * - One currency to another would need an exchange rate, and CareerFlow has no
 *   server to fetch one from and no business shipping a stale table. So SAR is
 *   compared with SAR and never with AED.
 *
 * A comparison that cannot be made is reported as such, with the reason, instead
 * of being dressed up as a result.
 */

export interface SalaryRange {
  min?: number;
  max?: number;
  currency: string;
  period?: SalaryPeriod;
}

/** The stated range on an application, or `null` when there is nothing to show. */
export function salaryOf(application: Application): SalaryRange | null {
  const { salaryMin: min, salaryMax: max, salaryCurrency: currency } = application;
  if ((min === undefined && max === undefined) || !currency) return null;
  const range: SalaryRange = { currency };
  if (min !== undefined) range.min = min;
  if (max !== undefined) range.max = max;
  if (application.salaryPeriod) range.period = application.salaryPeriod;
  return range;
}

/**
 * Re-expresses an amount in another period, or returns `null` when that cannot
 * be done without an assumption. Same period in and out always succeeds.
 */
export function convertPeriod(
  amount: number,
  from: SalaryPeriod,
  to: SalaryPeriod,
): number | null {
  if (from === to) return amount;
  if (from === 'annual' && to === 'monthly') return amount / 12;
  if (from === 'monthly' && to === 'annual') return amount * 12;
  return null;
}

export type ExpectationComparison =
  /** The application has no salary written down. */
  | { kind: 'no-salary' }
  /** The applicant has not set an expectation. */
  | { kind: 'no-expectation' }
  /** Stated in a different currency; not converted. */
  | { kind: 'different-currency'; currency: string }
  /** The range has no period, so it cannot be lined up with the expectation. */
  | { kind: 'no-period' }
  /** e.g. a day rate against a monthly expectation; not converted. */
  | { kind: 'incompatible-period'; period: SalaryPeriod }
  /** The whole stated range is at or above the expectation. */
  | { kind: 'above' }
  /** The expectation falls inside the stated range. */
  | { kind: 'within' }
  /** Even the top of the stated range is below the expectation. */
  | { kind: 'below' }
  /** Only a minimum is stated and it is below the expectation; no ceiling given. */
  | { kind: 'open-ended' };

/**
 * Where an application's stated range sits against the applicant's expectation,
 * with both expressed in the expectation's period.
 */
export function compareToExpectation(
  application: Application,
  expectation: SalaryExpectation | undefined,
): ExpectationComparison {
  const range = salaryOf(application);
  if (!range) return { kind: 'no-salary' };
  if (!expectation) return { kind: 'no-expectation' };

  if (range.currency.toUpperCase() !== expectation.currency.toUpperCase()) {
    return { kind: 'different-currency', currency: range.currency };
  }
  const period = range.period;
  if (!period) return { kind: 'no-period' };

  const toExpectationPeriod = (amount: number | undefined) =>
    amount === undefined ? undefined : convertPeriod(amount, period, expectation.period);

  const min = toExpectationPeriod(range.min);
  const max = toExpectationPeriod(range.max);
  if (min === null || max === null) {
    return { kind: 'incompatible-period', period };
  }

  const target = expectation.amount;

  if (min !== undefined && min >= target) return { kind: 'above' };
  if (max !== undefined) return max >= target ? { kind: 'within' } : { kind: 'below' };
  // Only a minimum, and it is below the target: the ceiling is unknown.
  return { kind: 'open-ended' };
}

/** Whether a comparison says the stated range reaches the expectation. */
export function meetsExpectation(comparison: ExpectationComparison): boolean {
  return comparison.kind === 'above' || comparison.kind === 'within';
}

/**
 * The value an application is ranked by when sorting by salary: the top of its
 * range (or its only figure) as a monthly amount. `null` when it cannot be
 * ranked without an assumption — no salary, no period, or a day or hour rate.
 */
export function monthlyRankValue(application: Application): number | null {
  const range = salaryOf(application);
  if (!range || !range.period) return null;
  const top = range.max ?? range.min;
  if (top === undefined) return null;
  return convertPeriod(top, range.period, 'monthly');
}
