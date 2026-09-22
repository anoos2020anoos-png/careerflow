import { describe, expect, it } from 'vitest';
import {
  DEFAULT_FILTERS,
  filterAndSortApplications,
  filterApplications,
  matchesSearch,
  sortApplications,
  toggleValue,
} from '@/lib/filters';
import { makeApplication } from '@/test/factories';

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
