import { afterEach, describe, expect, it } from 'vitest';
import { formatMoney, formatSalaryRange } from '@/lib/format';
import { setFormatLocale } from '@/lib/locale';

afterEach(() => setFormatLocale('en'));

describe('formatSalaryRange', () => {
  it('writes the currency once for a range', () => {
    const text = formatSalaryRange(18000, 24000, 'SAR');
    expect(text).toMatch(/18,000/);
    expect(text).toMatch(/24,000/);
    expect(text?.match(/SAR/g)).toHaveLength(1);
  });

  it('prints equal ends as one exact figure, without an "approximately" sign', () => {
    const text = formatSalaryRange(18000, 18000, 'SAR');
    expect(text).not.toContain('~');
    expect(text).toMatch(/18,000/);
  });

  it('uses the one-sided wording it is given', () => {
    expect(formatSalaryRange(18000, undefined, 'SAR', { from: 'من {value}', upTo: 'حتى {value}' }))
      .toMatch(/^من /);
    expect(formatSalaryRange(undefined, 24000, 'SAR')).toMatch(/^Up to /);
  });

  it('formats Arabic with Western digits and the Arabic riyal sign', () => {
    setFormatLocale('ar');
    const text = formatSalaryRange(18000, 24000, 'SAR') ?? '';
    expect(text).toMatch(/18,000/);
    expect(text).toContain('ر.س');
  });

  it('falls back to "amount CODE" for a code the browser does not know', () => {
    expect(formatMoney(5000, 'ZZZ')).toMatch(/5,000/);
  });

  it('returns null when there is no amount at all', () => {
    expect(formatSalaryRange(undefined, undefined, 'SAR')).toBeNull();
  });
});
