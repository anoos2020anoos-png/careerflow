import { describe, expect, it } from 'vitest';
import {
  companyKey,
  companyNames,
  summarizeCompanies,
  withCompanyDetails,
  withoutCompanyDetails,
} from '@/lib/companies';
import { makeApplication } from '@/test/factories';
import type { CompanyDetails } from '@/types';

const NOW = '2026-09-24T10:00:00.000Z';

function details(name: string, extra: Partial<CompanyDetails> = {}): CompanyDetails {
  return { key: companyKey(name), name, updatedAt: '2026-09-01T00:00:00.000Z', ...extra };
}

describe('companyKey', () => {
  it('ignores case, accents and spacing', () => {
    expect(companyKey('  Sahaab   Cloud ')).toBe(companyKey('sahaab cloud'));
    expect(companyKey('Café Réseau')).toBe(companyKey('cafe reseau'));
  });

  it('ignores Arabic diacritics and tatweel', () => {
    expect(companyKey('شركة سَحاب')).toBe(companyKey('شركة سحـاب'));
  });

  it('does not merge names that differ by a word', () => {
    // Anything looser would file applications under an employer the user never
    // said was the same one.
    expect(companyKey('Sahaab')).not.toBe(companyKey('Sahaab Cloud'));
  });
});

describe('companyNames', () => {
  it('lists each company once, in the spelling most recently used', () => {
    const names = companyNames([
      makeApplication({ company: 'sahaab cloud', updatedAt: '2026-01-01T00:00:00.000Z' }),
      makeApplication({ company: 'Sahaab Cloud', updatedAt: '2026-05-01T00:00:00.000Z' }),
      makeApplication({ company: 'Barq Delivery' }),
    ]);
    expect(names).toEqual(['Barq Delivery', 'Sahaab Cloud']);
  });
});

describe('summarizeCompanies', () => {
  const applications = [
    makeApplication({ company: 'Sahaab Cloud', status: 'interview', appliedDate: '2026-08-01' }),
    makeApplication({ company: 'sahaab cloud', status: 'rejected', appliedDate: '2026-06-01' }),
    makeApplication({ company: 'Barq Delivery', status: 'applied', appliedDate: '2026-09-01' }),
  ];

  it('groups applications by company and counts their statuses', () => {
    const summaries = summarizeCompanies(applications, []);
    const sahaab = summaries.find((entry) => entry.key === companyKey('Sahaab Cloud'));

    expect(summaries).toHaveLength(2);
    expect(sahaab?.applications).toHaveLength(2);
    expect(sahaab?.statusCounts).toEqual({ interview: 1, rejected: 1 });
    expect(sahaab?.activeCount).toBe(1);
    expect(sahaab?.lastAppliedDate).toBe('2026-08-01');
  });

  it('puts the most recently applied-to company first', () => {
    expect(summarizeCompanies(applications, []).map((entry) => entry.name)).toEqual([
      'Barq Delivery',
      'Sahaab Cloud',
    ]);
  });

  it('keeps a company with saved details and no applications, at the end', () => {
    // Otherwise deleting an application would silently hide notes the user wrote.
    const summaries = summarizeCompanies(applications, [details('Old Employer', { notes: 'x' })]);
    const last = summaries[summaries.length - 1];
    expect(last?.name).toBe('Old Employer');
    expect(last?.applications).toHaveLength(0);
  });

  it('attaches saved details to the matching company', () => {
    const summaries = summarizeCompanies(applications, [details('SAHAAB CLOUD', { sector: 'private' })]);
    expect(summaries.find((entry) => entry.key === companyKey('Sahaab Cloud'))?.details?.sector)
      .toBe('private');
  });
});

describe('withCompanyDetails', () => {
  it('saves details without touching applications when the name is unchanged', () => {
    const applications = [makeApplication({ company: 'Sahaab Cloud' })];
    const result = withCompanyDetails(applications, [], companyKey('Sahaab Cloud'), {
      name: 'Sahaab Cloud',
      sector: 'private',
      industry: 'Cloud',
    }, NOW);

    expect(result.applications[0]).toBe(applications[0]);
    expect(result.details).toEqual([
      { key: companyKey('Sahaab Cloud'), name: 'Sahaab Cloud', sector: 'private', industry: 'Cloud', updatedAt: NOW },
    ]);
  });

  it('renames every application under the company, and records it', () => {
    const applications = [
      makeApplication({ id: 'a', company: 'Sahab Cloud' }),
      makeApplication({ id: 'b', company: 'sahab cloud' }),
      makeApplication({ id: 'c', company: 'Barq Delivery' }),
    ];
    const result = withCompanyDetails(applications, [], companyKey('Sahab Cloud'), {
      name: 'Sahaab Cloud',
    }, NOW);

    expect(result.applications.map((entry) => entry.company)).toEqual([
      'Sahaab Cloud',
      'Sahaab Cloud',
      'Barq Delivery',
    ]);
    const renamed = result.applications[0]!;
    expect(renamed.updatedAt).toBe(NOW);
    expect(renamed.activity[renamed.activity.length - 1]).toMatchObject({
      kind: 'company_renamed',
      detail: 'Sahab Cloud',
    });
    expect(result.applications[2]).toBe(applications[2]);
  });

  it('merges into an existing company, keeping what either side had', () => {
    const applications = [
      makeApplication({ company: 'Sahab Cloud' }),
      makeApplication({ company: 'Sahaab Cloud' }),
    ];
    const saved = [
      details('Sahab Cloud', { notes: 'Met them at a career fair' }),
      details('Sahaab Cloud', { sector: 'private', website: 'https://example.com' }),
    ];

    // The edit form for "Sahab Cloud" held its notes; the user renamed it.
    const result = withCompanyDetails(applications, saved, companyKey('Sahab Cloud'), {
      name: 'Sahaab Cloud',
      notes: 'Met them at a career fair',
    }, NOW);

    expect(new Set(result.applications.map((entry) => entry.company))).toEqual(new Set(['Sahaab Cloud']));
    expect(result.details).toHaveLength(1);
    expect(result.details[0]).toMatchObject({
      key: companyKey('Sahaab Cloud'),
      sector: 'private',
      website: 'https://example.com',
      notes: 'Met them at a career fair',
    });
  });

  it('removes the details record when every field is cleared', () => {
    const result = withCompanyDetails(
      [makeApplication({ company: 'Barq Delivery' })],
      [details('Barq Delivery', { industry: 'Logistics' })],
      companyKey('Barq Delivery'),
      { name: 'Barq Delivery' },
      NOW,
    );
    expect(result.details).toEqual([]);
  });

  it('ignores a blank name rather than filing applications under nothing', () => {
    const applications = [makeApplication({ company: 'Barq Delivery' })];
    const result = withCompanyDetails(applications, [], companyKey('Barq Delivery'), { name: '   ' }, NOW);
    expect(result.applications).toBe(applications);
  });
});

describe('withoutCompanyDetails', () => {
  it('removes only the named company', () => {
    const saved = [details('A', { notes: 'a' }), details('B', { notes: 'b' })];
    expect(withoutCompanyDetails(saved, companyKey('A')).map((entry) => entry.name)).toEqual(['B']);
  });
});
