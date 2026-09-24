import { describe, expect, it } from 'vitest';
import {
  compareToExpectation,
  convertPeriod,
  meetsExpectation,
  monthlyRankValue,
  salaryOf,
} from '@/lib/salary';
import { makeApplication } from '@/test/factories';
import type { SalaryExpectation } from '@/types';

const expectsSar20kMonthly: SalaryExpectation = { amount: 20000, currency: 'SAR', period: 'monthly' };

function offer(min: number | undefined, max: number | undefined, extra = {}) {
  return makeApplication({
    salaryMin: min,
    salaryMax: max,
    salaryCurrency: 'SAR',
    salaryPeriod: 'monthly',
    ...extra,
  });
}

describe('convertPeriod', () => {
  it('converts between annual and monthly exactly', () => {
    expect(convertPeriod(240000, 'annual', 'monthly')).toBe(20000);
    expect(convertPeriod(20000, 'monthly', 'annual')).toBe(240000);
  });

  it('refuses conversions that would need an assumption', () => {
    // How many working days in a month? Any answer would be invented.
    expect(convertPeriod(1500, 'daily', 'monthly')).toBeNull();
    expect(convertPeriod(20000, 'monthly', 'hourly')).toBeNull();
    expect(convertPeriod(1500, 'daily', 'annual')).toBeNull();
  });

  it('passes a figure through unchanged when the periods match', () => {
    expect(convertPeriod(1500, 'daily', 'daily')).toBe(1500);
  });
});

describe('compareToExpectation', () => {
  it('reports "above" when the whole range is at or above the expectation', () => {
    expect(compareToExpectation(offer(20000, 25000), expectsSar20kMonthly).kind).toBe('above');
  });

  it('reports "within" when the expectation falls inside the range', () => {
    expect(compareToExpectation(offer(18000, 24000), expectsSar20kMonthly).kind).toBe('within');
  });

  it('reports "below" when even the top of the range is short', () => {
    expect(compareToExpectation(offer(14000, 17000), expectsSar20kMonthly).kind).toBe('below');
  });

  it('reports "open-ended" for a minimum below the expectation with no maximum', () => {
    // "From 15,000" might reach 20,000 or might not. Saying it meets the
    // expectation would be a guess, so it is not treated as a pass.
    const comparison = compareToExpectation(offer(15000, undefined), expectsSar20kMonthly);
    expect(comparison.kind).toBe('open-ended');
    expect(meetsExpectation(comparison)).toBe(false);
  });

  it('judges a maximum-only range by its maximum', () => {
    expect(compareToExpectation(offer(undefined, 22000), expectsSar20kMonthly).kind).toBe('within');
    expect(compareToExpectation(offer(undefined, 19000), expectsSar20kMonthly).kind).toBe('below');
  });

  it('compares an annual range against a monthly expectation via ÷ 12', () => {
    const annual = offer(216000, 264000, { salaryPeriod: 'annual' }); // 18,000–22,000 a month
    expect(compareToExpectation(annual, expectsSar20kMonthly).kind).toBe('within');
  });

  it('does not compare across currencies', () => {
    const aed = offer(30000, 35000, { salaryCurrency: 'AED' });
    expect(compareToExpectation(aed, expectsSar20kMonthly)).toEqual({
      kind: 'different-currency',
      currency: 'AED',
    });
  });

  it('treats currency codes case-insensitively', () => {
    expect(
      compareToExpectation(offer(20000, 25000, { salaryCurrency: 'sar' }), expectsSar20kMonthly)
        .kind,
    ).toBe('above');
  });

  it('does not compare a day rate with a monthly expectation', () => {
    const dayRate = offer(1400, 1700, { salaryPeriod: 'daily' });
    expect(compareToExpectation(dayRate, expectsSar20kMonthly)).toEqual({
      kind: 'incompatible-period',
      period: 'daily',
    });
  });

  it('does not guess a period for a salary saved without one', () => {
    const legacy = offer(20000, 25000, { salaryPeriod: undefined });
    expect(compareToExpectation(legacy, expectsSar20kMonthly).kind).toBe('no-period');
  });

  it('distinguishes "no salary" from "no expectation"', () => {
    expect(compareToExpectation(makeApplication(), expectsSar20kMonthly).kind).toBe('no-salary');
    expect(compareToExpectation(offer(20000, 25000), undefined).kind).toBe('no-expectation');
  });

  it('counts only above and within as meeting the expectation', () => {
    expect(meetsExpectation({ kind: 'above' })).toBe(true);
    expect(meetsExpectation({ kind: 'within' })).toBe(true);
    for (const kind of ['below', 'open-ended', 'no-salary', 'no-period'] as const) {
      expect(meetsExpectation({ kind })).toBe(false);
    }
  });
});

describe('salaryOf', () => {
  it('needs an amount and a currency', () => {
    expect(salaryOf(makeApplication({ salaryCurrency: 'SAR' }))).toBeNull();
    expect(salaryOf(makeApplication({ salaryMin: 5000 }))).toBeNull();
  });
});

describe('monthlyRankValue', () => {
  it('ranks by the top of the range, as a monthly figure', () => {
    expect(monthlyRankValue(offer(18000, 24000))).toBe(24000);
    expect(monthlyRankValue(offer(216000, 264000, { salaryPeriod: 'annual' }))).toBe(22000);
    expect(monthlyRankValue(offer(15000, undefined))).toBe(15000);
  });

  it('cannot rank a day rate, a missing period, or a missing salary', () => {
    expect(monthlyRankValue(offer(1400, 1700, { salaryPeriod: 'daily' }))).toBeNull();
    expect(monthlyRankValue(offer(18000, 24000, { salaryPeriod: undefined }))).toBeNull();
    expect(monthlyRankValue(makeApplication())).toBeNull();
  });
});
