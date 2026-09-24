import { describe, expect, it } from 'vitest';
import {
  DEFAULT_FILTERS,
  filterAndSortApplications,
  filterApplications,
  hasActiveFilters,
  matchesSearch,
  sortApplications,
  toggleValue,
} from '@/lib/filters';
import { makeApplication, makeRequirement } from '@/test/factories';
import { companyKey } from '@/lib/companies';
import type { CompanyDetails, SalaryExpectation } from '@/types';

const northwind = makeApplication({
  id: 'a',
  company: 'Northwind Analytics',
  jobTitle: 'Senior Frontend Engineer',
  status: 'interview',
  workArrangement: 'hybrid',
  employmentType: 'full_time',
  appliedDate: '2026-03-01',
  updatedAt: '2026-03-10T10:00:00.000Z',
});

const lumen = makeApplication({
  id: 'b',
  company: 'Lumen Health',
  jobTitle: 'Product Engineer',
  status: 'applied',
  workArrangement: 'remote',
  employmentType: 'contract',
  appliedDate: '2026-02-10',
  updatedAt: '2026-03-20T10:00:00.000Z',
});

const atlas = makeApplication({
  id: 'c',
  company: 'Atlas Freight',
  jobTitle: 'Full Stack Developer',
  status: 'rejected',
  workArrangement: 'onsite',
  employmentType: 'internship',
  appliedDate: '2026-01-05',
  updatedAt: '2026-01-30T10:00:00.000Z',
});

const all = [northwind, lumen, atlas];

describe('matchesSearch', () => {
  it('matches on company and on job title', () => {
    expect(matchesSearch(northwind, 'northwind')).toBe(true);
    expect(matchesSearch(northwind, 'frontend')).toBe(true);
  });

  it('ignores case, surrounding whitespace and accents', () => {
    expect(matchesSearch(northwind, '  NORTHWIND  ')).toBe(true);
    expect(matchesSearch(makeApplication({ company: 'Café Systems' }), 'cafe')).toBe(true);
  });

  it('treats an empty query as "everything matches"', () => {
    expect(matchesSearch(atlas, '')).toBe(true);
    expect(matchesSearch(atlas, '   ')).toBe(true);
  });

  it('does not match on fields the search bar does not advertise', () => {
    const withNotes = makeApplication({ company: 'Acme', notes: 'kubernetes heavy' });
    expect(matchesSearch(withNotes, 'kubernetes')).toBe(false);
  });
});

describe('filterApplications', () => {
  it('returns everything with the default filters', () => {
    expect(filterApplications(all, DEFAULT_FILTERS)).toHaveLength(3);
  });

  it('filters by status', () => {
    const result = filterApplications(all, { ...DEFAULT_FILTERS, statuses: ['applied'] });
    expect(result.map((item) => item.id)).toEqual(['b']);
  });

  it('treats several values in one filter as OR', () => {
    const result = filterApplications(all, {
      ...DEFAULT_FILTERS,
      statuses: ['applied', 'rejected'],
    });
    expect(result.map((item) => item.id)).toEqual(['b', 'c']);
  });

  it('treats different filters as AND', () => {
    const result = filterApplications(all, {
      ...DEFAULT_FILTERS,
      statuses: ['applied', 'interview'],
      arrangements: ['hybrid'],
    });
    expect(result.map((item) => item.id)).toEqual(['a']);
  });

  it('combines the search term with the filters', () => {
    const result = filterApplications(all, {
      ...DEFAULT_FILTERS,
      search: 'engineer',
      employmentTypes: ['contract'],
    });
    expect(result.map((item) => item.id)).toEqual(['b']);
  });

  it('returns an empty list when nothing matches', () => {
    expect(
      filterApplications(all, { ...DEFAULT_FILTERS, search: 'nothing matches this' }),
    ).toEqual([]);
  });
});

describe('sortApplications', () => {
  it('sorts by application date, newest first when descending', () => {
    const result = sortApplications(all, 'appliedDate', 'desc');
    expect(result.map((item) => item.id)).toEqual(['a', 'b', 'c']);
  });

  it('sorts by application date, oldest first when ascending', () => {
    const result = sortApplications(all, 'appliedDate', 'asc');
    expect(result.map((item) => item.id)).toEqual(['c', 'b', 'a']);
  });

  it('sorts by company name', () => {
    const result = sortApplications(all, 'company', 'asc');
    expect(result.map((item) => item.company)).toEqual([
      'Atlas Freight',
      'Lumen Health',
      'Northwind Analytics',
    ]);
  });

  it('sorts by last updated', () => {
    const result = sortApplications(all, 'updatedAt', 'desc');
    expect(result.map((item) => item.id)).toEqual(['b', 'a', 'c']);
  });

  it('does not mutate the input array', () => {
    const input = [...all];
    sortApplications(input, 'company', 'asc');
    expect(input.map((item) => item.id)).toEqual(['a', 'b', 'c']);
  });
});

describe('filterAndSortApplications', () => {
  it('filters first, then sorts what is left', () => {
    const result = filterAndSortApplications(all, {
      ...DEFAULT_FILTERS,
      statuses: ['applied', 'rejected'],
      sortKey: 'appliedDate',
      sortDirection: 'asc',
    });
    expect(result.map((item) => item.id)).toEqual(['c', 'b']);
  });
});

describe('toggleValue', () => {
  it('adds a missing value and removes a present one', () => {
    expect(toggleValue<string>([], 'a')).toEqual(['a']);
    expect(toggleValue(['a', 'b'], 'a')).toEqual(['b']);
  });
});

describe('the "only where I meet every essential" filter', () => {
  const ready = makeApplication({
    id: 'ready',
    requirements: [
      makeRequirement('React', 'essential', true),
      makeRequirement('Figma', 'preferred', false),
    ],
  });

  const shortOne = makeApplication({
    id: 'short',
    requirements: [
      makeRequirement('React', 'essential', true),
      makeRequirement('Kubernetes', 'essential', false),
    ],
  });

  const unlisted = makeApplication({ id: 'unlisted', requirements: [] });

  const onlyEssentials = { ...DEFAULT_FILTERS, onlyMeetingEssentials: true };

  it('keeps an application whose essential requirements are all ticked', () => {
    const kept = filterApplications([ready, shortOne], onlyEssentials);
    expect(kept.map((entry) => entry.id)).toEqual(['ready']);
  });

  it('ignores unticked preferred requirements', () => {
    expect(filterApplications([ready], onlyEssentials)).toHaveLength(1);
  });

  it('excludes an application with no requirements written down', () => {
    // An empty list has not claimed to be met; treating it as a pass would put
    // applications in front of the user that they never actually checked.
    expect(filterApplications([unlisted], onlyEssentials)).toHaveLength(0);
  });

  it('is off by default and counts as an active filter when on', () => {
    expect(DEFAULT_FILTERS.onlyMeetingEssentials).toBe(false);
    expect(hasActiveFilters(DEFAULT_FILTERS)).toBe(false);
    expect(hasActiveFilters(onlyEssentials)).toBe(true);
  });
});

describe('sorting by salary', () => {
  const monthly = (id: string, max: number, currency = 'SAR') =>
    makeApplication({ id, salaryMin: max - 3000, salaryMax: max, salaryCurrency: currency, salaryPeriod: 'monthly' });

  const high = monthly('high', 30000);
  const low = monthly('low', 15000);
  const annual = makeApplication({
    id: 'annual',
    salaryMin: 216000,
    salaryMax: 264000, // 22,000 a month
    salaryCurrency: 'SAR',
    salaryPeriod: 'annual',
  });
  const dayRate = makeApplication({ id: 'day', salaryMin: 1500, salaryCurrency: 'SAR', salaryPeriod: 'daily' });
  const none = makeApplication({ id: 'none' });

  it('ranks by the monthly top of each range, converting annual figures', () => {
    const order = sortApplications([low, annual, high], 'salary', 'desc').map((entry) => entry.id);
    expect(order).toEqual(['high', 'annual', 'low']);
  });

  it('puts what cannot be ranked last, in either direction', () => {
    const all = [none, low, dayRate, high];
    expect(sortApplications(all, 'salary', 'desc').map((entry) => entry.id).slice(2)).toEqual(['none', 'day']);
    expect(sortApplications(all, 'salary', 'asc').map((entry) => entry.id).slice(2)).toEqual(['none', 'day']);
  });

  it('groups currencies rather than converting between them', () => {
    const aed = monthly('aed', 99000, 'AED');
    const order = sortApplications([high, aed, low], 'salary', 'asc').map((entry) => entry.id);
    // AED sorts before SAR by code; it is not treated as bigger or smaller.
    expect(order).toEqual(['aed', 'low', 'high']);
  });
});

describe('the salary-expectation filter', () => {
  const expectation: SalaryExpectation = { amount: 20000, currency: 'SAR', period: 'monthly' };
  const meets = makeApplication({ id: 'meets', salaryMin: 18000, salaryMax: 24000, salaryCurrency: 'SAR', salaryPeriod: 'monthly' });
  const short = makeApplication({ id: 'short', salaryMin: 12000, salaryMax: 15000, salaryCurrency: 'SAR', salaryPeriod: 'monthly' });
  const otherCurrency = makeApplication({ id: 'aed', salaryMin: 30000, salaryMax: 40000, salaryCurrency: 'AED', salaryPeriod: 'monthly' });
  const unknown = makeApplication({ id: 'unknown' });
  const on = { ...DEFAULT_FILTERS, onlyMeetingSalary: true };

  it('keeps only ranges that reach the expectation', () => {
    const kept = filterApplications([meets, short, otherCurrency, unknown], on, { salaryExpectation: expectation });
    expect(kept.map((entry) => entry.id)).toEqual(['meets']);
  });

  it('keeps nothing when no expectation is set', () => {
    expect(filterApplications([meets], on, {})).toHaveLength(0);
  });

  it('counts as an active filter', () => {
    expect(hasActiveFilters(on)).toBe(true);
  });
});

describe('the company and sector filters', () => {
  const sahaab = makeApplication({ id: 's', company: 'Sahaab Cloud' });
  const sahaabLower = makeApplication({ id: 's2', company: 'sahaab cloud' });
  const barq = makeApplication({ id: 'b', company: 'Barq Delivery' });
  const turath = makeApplication({ id: 't', company: 'Turath Systems' });
  const companies: CompanyDetails[] = [
    { key: companyKey('Sahaab Cloud'), name: 'Sahaab Cloud', sector: 'private', updatedAt: '2026-01-01T00:00:00.000Z' },
    { key: companyKey('Turath Systems'), name: 'Turath Systems', sector: 'government', updatedAt: '2026-01-01T00:00:00.000Z' },
  ];

  it('narrows to one company, whatever the spelling', () => {
    const kept = filterApplications([sahaab, sahaabLower, barq], { ...DEFAULT_FILTERS, company: companyKey('Sahaab Cloud') });
    expect(kept.map((entry) => entry.id)).toEqual(['s', 's2']);
  });

  it('narrows by the sector saved on each company', () => {
    const kept = filterApplications(
      [sahaab, barq, turath],
      { ...DEFAULT_FILTERS, sectors: ['government'] },
      { companies },
    );
    expect(kept.map((entry) => entry.id)).toEqual(['t']);
  });

  it('does not match a company with no sector saved', () => {
    // Barq has no details at all; "not set" is not an answer to "private?".
    const kept = filterApplications([barq], { ...DEFAULT_FILTERS, sectors: ['private'] }, { companies });
    expect(kept).toHaveLength(0);
  });
});
