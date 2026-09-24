import type {
  Application,
  ApplicationStatus,
  CompanyDetails,
  CompanySector,
} from '@/types';
import { ACTIVE_STATUSES } from '@/types';
import { createId } from '@/lib/ids';

/**
 * Grouping applications by employer.
 *
 * A company is not a record of its own in the application model — it is the
 * name typed into the form. That keeps adding an application to a one-field
 * job, and it means the grouping has to decide when two names are the same
 * company. The rule is deliberately narrow: case, accents, Arabic diacritics,
 * tatweel and spacing are ignored, and nothing else. "Sahaab Cloud" and
 * "sahaab  cloud" are one company; "Sahaab" and "Sahaab Cloud" are two. Anything
 * looser would merge employers the user never said were the same, and two
 * genuinely different spellings are fixed by renaming one to the other, which
 * the Companies page offers.
 */
export function companyKey(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[ؐ-ًؚ-ٰٟـ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Every company in the tracker, one spelling each, for the form's suggestions.
 * Where the same company has been typed several ways, the most recently updated
 * application's spelling wins, since it is the one the user last chose.
 */
export function companyNames(applications: Application[]): string[] {
  const latest = new Map<string, { name: string; updatedAt: string }>();
  for (const application of applications) {
    const key = companyKey(application.company);
    if (!key) continue;
    const seen = latest.get(key);
    if (!seen || application.updatedAt > seen.updatedAt) {
      latest.set(key, { name: application.company.trim(), updatedAt: application.updatedAt });
    }
  }
  return [...latest.values()]
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
}

export interface CompanySummary {
  key: string;
  name: string;
  details?: CompanyDetails;
  /** Newest application first. */
  applications: Application[];
  statusCounts: Partial<Record<ApplicationStatus, number>>;
  /** Applications still in play: Applied, Screening, Interview or Offer. */
  activeCount: number;
  /** The most recent application date, `YYYY-MM-DD`. */
  lastAppliedDate?: string;
}

/**
 * One entry per company: every company that has an application, plus any with
 * details saved but no application any more (after a delete or a rename), so
 * notes the user wrote are never silently hidden.
 */
export function summarizeCompanies(
  applications: Application[],
  details: CompanyDetails[],
): CompanySummary[] {
  const groups = new Map<string, Application[]>();
  for (const application of applications) {
    const key = companyKey(application.company);
    if (!key) continue;
    const group = groups.get(key);
    if (group) group.push(application);
    else groups.set(key, [application]);
  }

  const detailsByKey = new Map(details.map((entry) => [entry.key, entry]));
  const keys = new Set([...groups.keys(), ...detailsByKey.keys()]);

  const summaries: CompanySummary[] = [];
  for (const key of keys) {
    const group = [...(groups.get(key) ?? [])].sort(
      (a, b) => b.appliedDate.localeCompare(a.appliedDate) || b.updatedAt.localeCompare(a.updatedAt),
    );
    const companyDetails = detailsByKey.get(key);
    const newestEdit = [...group].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];

    const statusCounts: Partial<Record<ApplicationStatus, number>> = {};
    for (const application of group) {
      statusCounts[application.status] = (statusCounts[application.status] ?? 0) + 1;
    }

    const summary: CompanySummary = {
      key,
      name: newestEdit?.company.trim() ?? companyDetails?.name ?? key,
      applications: group,
      statusCounts,
      activeCount: group.filter((application) => ACTIVE_STATUSES.includes(application.status))
        .length,
    };
    if (companyDetails) summary.details = companyDetails;
    if (group[0]) summary.lastAppliedDate = group[0].appliedDate;
    summaries.push(summary);
  }

  // Most recently applied to first; companies with no applications at the end.
  return summaries.sort((a, b) => {
    if (a.lastAppliedDate && b.lastAppliedDate) {
      return b.lastAppliedDate.localeCompare(a.lastAppliedDate) || a.name.localeCompare(b.name);
    }
    if (a.lastAppliedDate) return -1;
    if (b.lastAppliedDate) return 1;
    return a.name.localeCompare(b.name);
  });
}

export function detailsFor(
  details: CompanyDetails[],
  companyName: string,
): CompanyDetails | undefined {
  const key = companyKey(companyName);
  return details.find((entry) => entry.key === key);
}

export interface CompanyDetailsInput {
  name: string;
  sector?: CompanySector;
  industry?: string;
  website?: string;
  notes?: string;
}

/**
 * Saves what the user entered for a company, and applies its name to every
 * application filed under it.
 *
 * The rules, in the order they apply:
 *
 * 1. The fields are taken as entered. The edit form starts from the saved
 *    values, so a blank field means the user cleared it.
 * 2. If the name changed, every application under the old name gets the new
 *    one, with a "company renamed" entry in its timeline. Spelling variants
 *    of the same company ("sahaab cloud") are brought into line too.
 * 3. If the new name belongs to a company that already has saved details, the
 *    two are merged: the entered fields win, and any left blank are filled from
 *    the company being merged into. Nothing either side held is thrown away.
 * 4. A company with nothing saved about it keeps no details record; it still
 *    appears, from its applications.
 */
export function withCompanyDetails(
  applications: Application[],
  details: CompanyDetails[],
  previousKey: string,
  input: CompanyDetailsInput,
  now: string,
): { applications: Application[]; details: CompanyDetails[] } {
  const name = input.name.trim();
  const nextKey = companyKey(name);
  if (!nextKey) return { applications, details };

  const nextApplications = applications.map((application) => {
    if (companyKey(application.company) !== previousKey || application.company === name) {
      return application;
    }
    return {
      ...application,
      company: name,
      updatedAt: now,
      activity: [
        ...application.activity,
        { id: createId(), kind: 'company_renamed' as const, at: now, detail: application.company },
      ],
    };
  });

  const mergingInto =
    nextKey !== previousKey ? details.find((entry) => entry.key === nextKey) : undefined;
  const field = (value: string | undefined) => (value && value.trim() ? value.trim() : undefined);

  const saved: CompanyDetails = { key: nextKey, name, updatedAt: now };
  const sector = input.sector ?? mergingInto?.sector;
  const industry = field(input.industry) ?? mergingInto?.industry;
  const website = field(input.website) ?? mergingInto?.website;
  const notes = field(input.notes) ?? mergingInto?.notes;
  if (sector) saved.sector = sector;
  if (industry) saved.industry = industry;
  if (website) saved.website = website;
  if (notes) saved.notes = notes;

  const hasContent = Boolean(saved.sector || saved.industry || saved.website || saved.notes);
  const others = details.filter((entry) => entry.key !== previousKey && entry.key !== nextKey);

  return {
    applications: nextApplications,
    details: hasContent ? [...others, saved] : others,
  };
}

export function withoutCompanyDetails(details: CompanyDetails[], key: string): CompanyDetails[] {
  return details.filter((entry) => entry.key !== key);
}
