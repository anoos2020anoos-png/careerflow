import type {
  Application,
  ApplicationStatus,
  CompanyDetails,
  CompanySector,
  EmploymentType,
  SalaryExpectation,
  WorkArrangement,
} from '@/types';
import { companyKey } from '@/lib/companies';
import { summarizeMatch } from '@/lib/match';
import { compareToExpectation, meetsExpectation, monthlyRankValue } from '@/lib/salary';

export const SORT_KEYS = ['appliedDate', 'company', 'updatedAt', 'salary'] as const;
export type SortKey = (typeof SORT_KEYS)[number];
export type SortDirection = 'asc' | 'desc';

export interface FilterState {
  search: string;
  statuses: ApplicationStatus[];
  arrangements: WorkArrangement[];
  employmentTypes: EmploymentType[];
  /** Company sectors, as saved on the Companies page. OR within, like the others. */
  sectors: CompanySector[];
  /**
   * One company, by `companyKey`, or `null` for all. Set from the Companies
   * page's "View applications" link.
   */
  company: string | null;
  /**
   * Narrows to applications where every requirement marked essential is ticked.
   *
   * Applications with no requirements written down are excluded rather than
   * included: "I meet everything this asks for" is a claim about a list, and an
   * empty list has not made that claim.
   */
  onlyMeetingEssentials: boolean;
  /**
   * Narrows to applications whose stated range reaches the applicant's expected
   * salary. Anything that cannot be compared — another currency, no salary, no
   * pay period — is excluded, for the same reason as above: not comparable is
   * not the same as meeting it.
   */
  onlyMeetingSalary: boolean;
  sortKey: SortKey;
  sortDirection: SortDirection;
}

export const DEFAULT_FILTERS: FilterState = {
  search: '',
  statuses: [],
  arrangements: [],
  employmentTypes: [],
  sectors: [],
  company: null,
  onlyMeetingEssentials: false,
  onlyMeetingSalary: false,
  sortKey: 'appliedDate',
  sortDirection: 'desc',
};

export function hasActiveFilters(state: FilterState): boolean {
  return (
    state.search.trim() !== '' ||
    state.statuses.length > 0 ||
    state.arrangements.length > 0 ||
    state.employmentTypes.length > 0 ||
    state.sectors.length > 0 ||
    state.company !== null ||
    state.onlyMeetingEssentials ||
    state.onlyMeetingSalary
  );
}

/** Case- and accent-insensitive contains, so "Cafe" matches "Café". */
function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

export function matchesSearch(application: Application, rawQuery: string): boolean {
  const query = normalize(rawQuery.trim());
  if (!query) return true;
  // Company and job title only — the fields the filter bar advertises.
  return (
    normalize(application.company).includes(query) ||
    normalize(application.jobTitle).includes(query)
  );
}

/** What the filters need to know beyond the records themselves. */
export interface FilterContext {
  salaryExpectation?: SalaryExpectation;
  /** Needed for the sector filter, since sectors live on company details. */
  companies?: CompanyDetails[];
}

/**
 * Salary ranking. Only applications with a monthly-comparable salary take part
 * (see `monthlyRankValue`); the rest are placed after them by
 * `sortApplications`. Currencies are grouped by code and never converted, so
 * SAR figures are ranked against SAR figures only.
 */
function compareSalary(a: Application, b: Application): number {
  const currencyA = (a.salaryCurrency ?? '').toUpperCase();
  const currencyB = (b.salaryCurrency ?? '').toUpperCase();
  if (currencyA !== currencyB) return currencyA.localeCompare(currencyB);
  const byValue = (monthlyRankValue(a) ?? 0) - (monthlyRankValue(b) ?? 0);
  return byValue !== 0 ? byValue : a.createdAt.localeCompare(b.createdAt);
}

function compare(a: Application, b: Application, key: SortKey): number {
  switch (key) {
    case 'salary':
      return compareSalary(a, b);
    case 'company': {
      const byCompany = a.company.localeCompare(b.company, undefined, { sensitivity: 'base' });
      return byCompany !== 0 ? byCompany : a.jobTitle.localeCompare(b.jobTitle);
    }
    case 'updatedAt':
      return a.updatedAt.localeCompare(b.updatedAt);
    case 'appliedDate':
    default: {
      const byDate = a.appliedDate.localeCompare(b.appliedDate);
      // Stable tie-break so the order never shuffles between renders.
      return byDate !== 0 ? byDate : a.createdAt.localeCompare(b.createdAt);
    }
  }
}

export function filterApplications(
  applications: Application[],
  state: FilterState,
  context: FilterContext = {},
): Application[] {
  const sectorByCompany = new Map(
    (context.companies ?? []).map((entry) => [entry.key, entry.sector] as const),
  );

  return applications.filter((application) => {
    const key = companyKey(application.company);
    if (state.company !== null && key !== state.company) return false;
    if (state.sectors.length > 0) {
      // A company with no sector saved matches no sector: unknown is not a pick.
      const sector = sectorByCompany.get(key);
      if (!sector || !state.sectors.includes(sector)) return false;
    }
    if (!matchesSearch(application, state.search)) return false;
    if (state.statuses.length > 0 && !state.statuses.includes(application.status)) return false;
    if (
      state.arrangements.length > 0 &&
      !state.arrangements.includes(application.workArrangement)
    ) {
      return false;
    }
    if (
      state.employmentTypes.length > 0 &&
      !state.employmentTypes.includes(application.employmentType)
    ) {
      return false;
    }
    if (state.onlyMeetingEssentials) {
      const match = summarizeMatch(application.requirements);
      if (!match.hasRequirements || !match.meetsEveryEssential) return false;
    }
    if (state.onlyMeetingSalary) {
      // With no expectation set there is nothing to meet, so nothing passes.
      const comparison = compareToExpectation(application, context.salaryExpectation);
      if (!meetsExpectation(comparison)) return false;
    }
    return true;
  });
}

export function sortApplications(
  applications: Application[],
  key: SortKey,
  direction: SortDirection,
): Application[] {
  if (key === 'salary') {
    // Records that cannot be ranked go last in either direction: flipping the
    // order should not float "no salary" to the top of "highest paid".
    const ranked = applications.filter((application) => monthlyRankValue(application) !== null);
    const unranked = applications.filter((application) => monthlyRankValue(application) === null);
    const sorted = ranked.sort((a, b) => compare(a, b, key));
    return [...(direction === 'desc' ? sorted.reverse() : sorted), ...unranked];
  }

  const sorted = [...applications].sort((a, b) => compare(a, b, key));
  return direction === 'desc' ? sorted.reverse() : sorted;
}

export function filterAndSortApplications(
  applications: Application[],
  state: FilterState,
  context: FilterContext = {},
): Application[] {
  return sortApplications(
    filterApplications(applications, state, context),
    state.sortKey,
    state.sortDirection,
  );
}

/** Toggles a value in a multi-select filter array. */
export function toggleValue<T>(values: T[], value: T): T[] {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}
