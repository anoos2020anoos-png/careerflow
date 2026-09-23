import type {
  Application,
  ApplicationStatus,
  EmploymentType,
  WorkArrangement,
} from '@/types';
import { summarizeMatch } from '@/lib/match';

export const SORT_KEYS = ['appliedDate', 'company', 'updatedAt'] as const;
export type SortKey = (typeof SORT_KEYS)[number];
export type SortDirection = 'asc' | 'desc';

export interface FilterState {
  search: string;
  statuses: ApplicationStatus[];
  arrangements: WorkArrangement[];
  employmentTypes: EmploymentType[];
  /**
   * Narrows to applications where every requirement marked essential is ticked.
   *
   * Applications with no requirements written down are excluded rather than
   * included: "I meet everything this asks for" is a claim about a list, and an
   * empty list has not made that claim.
   */
  onlyMeetingEssentials: boolean;
  sortKey: SortKey;
  sortDirection: SortDirection;
}

export const DEFAULT_FILTERS: FilterState = {
  search: '',
  statuses: [],
  arrangements: [],
  employmentTypes: [],
  onlyMeetingEssentials: false,
  sortKey: 'appliedDate',
  sortDirection: 'desc',
};

export function hasActiveFilters(state: FilterState): boolean {
  return (
    state.search.trim() !== '' ||
    state.statuses.length > 0 ||
    state.arrangements.length > 0 ||
    state.employmentTypes.length > 0 ||
    state.onlyMeetingEssentials
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

function compare(a: Application, b: Application, key: SortKey): number {
  switch (key) {
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
): Application[] {
  return applications.filter((application) => {
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
    return true;
  });
}

export function sortApplications(
  applications: Application[],
  key: SortKey,
  direction: SortDirection,
): Application[] {
  const sorted = [...applications].sort((a, b) => compare(a, b, key));
  return direction === 'desc' ? sorted.reverse() : sorted;
}

export function filterAndSortApplications(
  applications: Application[],
  state: FilterState,
): Application[] {
  return sortApplications(
    filterApplications(applications, state),
    state.sortKey,
    state.sortDirection,
  );
}

/** Toggles a value in a multi-select filter array. */
export function toggleValue<T>(values: T[], value: T): T[] {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}
