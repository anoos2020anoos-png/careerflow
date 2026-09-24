/**
 * Domain model for CareerFlow.
 *
 * Date conventions
 * ----------------
 * - `appliedDate`, `nextFollowUpDate`, `Interview.date` and `FollowUpTask.dueDate`
 *   are *calendar dates* stored as `YYYY-MM-DD`. They are never converted to a
 *   `Date` through `new Date(string)` (which would parse them as UTC and shift
 *   the day for users west of Greenwich). See `src/lib/dates.ts`.
 * - `Interview.time` is a local wall-clock time stored as `HH:mm`.
 * - `createdAt` / `updatedAt` / `ActivityEntry.at` are true instants stored as
 *   ISO-8601 strings in UTC.
 */

export const APPLICATION_STATUSES = [
  'saved',
  'applied',
  'screening',
  'interview',
  'offer',
  'rejected',
  'withdrawn',
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const WORK_ARRANGEMENTS = ['remote', 'hybrid', 'onsite'] as const;
export type WorkArrangement = (typeof WORK_ARRANGEMENTS)[number];

export const EMPLOYMENT_TYPES = ['full_time', 'part_time', 'internship', 'contract'] as const;
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

export const INTERVIEW_TYPES = [
  'phone_screen',
  'technical',
  'behavioral',
  'system_design',
  'onsite',
  'final',
  'other',
] as const;
export type InterviewType = (typeof INTERVIEW_TYPES)[number];

/**
 * How often a salary figure is paid. Stored because a number without it is
 * ambiguous: in Saudi Arabia offers are normally quoted monthly, elsewhere
 * often annually, and a contract may be a day rate. Optional on a record,
 * because applications saved before this field existed never said.
 */
export const SALARY_PERIODS = ['monthly', 'annual', 'daily', 'hourly'] as const;
export type SalaryPeriod = (typeof SALARY_PERIODS)[number];

/**
 * Currencies offered first in the form, Gulf first. Any other ISO 4217 code is
 * still accepted from an import and kept as-is.
 */
export const COMMON_CURRENCIES = [
  'SAR',
  'AED',
  'KWD',
  'QAR',
  'BHD',
  'OMR',
  'EGP',
  'JOD',
  'USD',
  'EUR',
  'GBP',
  'INR',
  'PKR',
  'PHP',
  'TRY',
  'CAD',
  'AUD',
] as const;

/** Used when the applicant has not set an expectation to take it from. */
export const DEFAULT_CURRENCY = 'SAR';

/**
 * Which part of the economy an employer sits in. In Saudi Arabia this shapes
 * hiring timelines, benefits and job security enough that people sort by it.
 */
export const COMPANY_SECTORS = ['government', 'semi_government', 'private', 'non_profit'] as const;
export type CompanySector = (typeof COMPANY_SECTORS)[number];

export const REQUIREMENT_IMPORTANCES = ['essential', 'preferred'] as const;
export type RequirementImportance = (typeof REQUIREMENT_IMPORTANCES)[number];

export const QUALIFICATION_KINDS = [
  'education',
  'skill',
  'language',
  'certification',
  'experience',
] as const;
export type QualificationKind = (typeof QUALIFICATION_KINDS)[number];

export const ACTIVITY_KINDS = [
  'created',
  'updated',
  'status_changed',
  'interview_added',
  'interview_removed',
  'task_added',
  'task_completed',
  'task_reopened',
  'task_removed',
  'requirement_added',
  'requirement_removed',
  'requirement_met',
  'requirement_unmet',
  'company_renamed',
] as const;
export type ActivityKind = (typeof ACTIVITY_KINDS)[number];

export interface Interview {
  id: string;
  /** Calendar date, `YYYY-MM-DD`. */
  date: string;
  /** Local wall-clock time, `HH:mm` (24-hour). */
  time: string;
  type: InterviewType;
  notes?: string;
  createdAt: string;
}

export interface FollowUpTask {
  id: string;
  title: string;
  /** Calendar date, `YYYY-MM-DD`. */
  dueDate?: string;
  completed: boolean;
  completedAt?: string;
  createdAt: string;
}

/**
 * One line lifted from a job posting, and whether the applicant has it.
 *
 * `met` is the applicant's own answer, never a guess the app commits to. When a
 * requirement is added it is pre-ticked if the wording matches something in the
 * profile, but that is a starting point the user is free to correct — which is
 * why it is stored as a plain boolean rather than a link to a qualification.
 */
export interface Requirement {
  id: string;
  /** The requirement in the posting's own words. */
  label: string;
  /** Whether the posting calls it essential or merely preferred. */
  importance: RequirementImportance;
  met: boolean;
  createdAt: string;
}

/** Something the applicant has: a degree, a skill, a language, a certificate. */
export interface Qualification {
  id: string;
  label: string;
  kind: QualificationKind;
  createdAt: string;
}

/**
 * The applicant's own background, kept once rather than per application.
 *
 * It exists to answer one question honestly — "which of the things this posting
 * asks for do I actually have?" — and never to score the person.
 */
/** What the applicant is looking to be paid, in their own currency and terms. */
export interface SalaryExpectation {
  amount: number;
  currency: string;
  period: SalaryPeriod;
}

export interface Profile {
  /** A one-line summary in the applicant's own words. Optional. */
  headline?: string;
  qualifications: Qualification[];
  /**
   * Compared against each application's stated range. Also supplies the
   * default currency and period when a new application is added.
   */
  salaryExpectation?: SalaryExpectation;
  updatedAt: string;
}

export function emptyProfile(at: string): Profile {
  return { qualifications: [], updatedAt: at };
}

export interface ActivityEntry {
  id: string;
  kind: ActivityKind;
  /** ISO-8601 instant. */
  at: string;
  from?: ApplicationStatus;
  to?: ApplicationStatus;
  detail?: string;
}

export interface Application {
  id: string;
  company: string;
  jobTitle: string;
  jobUrl?: string;
  location?: string;
  workArrangement: WorkArrangement;
  employmentType: EmploymentType;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  /** Absent on records saved before periods existed; never guessed. */
  salaryPeriod?: SalaryPeriod;
  /** Calendar date the application was submitted or saved, `YYYY-MM-DD`. */
  appliedDate: string;
  status: ApplicationStatus;
  notes?: string;
  /** Calendar date, `YYYY-MM-DD`. */
  nextFollowUpDate?: string;
  createdAt: string;
  updatedAt: string;
  interviews: Interview[];
  tasks: FollowUpTask[];
  /** What the posting asks for. Empty until the applicant fills it in. */
  requirements: Requirement[];
  activity: ActivityEntry[];
}

/**
 * What the applicant has noted about an employer.
 *
 * Linked to applications by `key` — the normalised company name — rather than
 * by an id on each application, so typing a company name is still all it takes
 * to file an application under it, and details can exist before or after any
 * particular application.
 */
export interface CompanyDetails {
  /** `companyKey(name)`; see `src/lib/companies.ts`. */
  key: string;
  /** The spelling shown when no application carries this company any more. */
  name: string;
  sector?: CompanySector;
  /** Free text, in the applicant's own words: "Fintech", "طاقة". */
  industry?: string;
  website?: string;
  notes?: string;
  updatedAt: string;
}

/** The shape written to `localStorage`. `version` allows future migrations. */
export interface PersistedData {
  version: number;
  applications: Application[];
  profile: Profile;
  companies: CompanyDetails[];
}

/**
 * Statuses that represent a live opportunity. Used by the "Active" metric and
 * documented in the dashboard so the number is never ambiguous.
 */
export const ACTIVE_STATUSES: readonly ApplicationStatus[] = [
  'applied',
  'screening',
  'interview',
  'offer',
];

/** Statuses that have reached an end state. */
export const CLOSED_STATUSES: readonly ApplicationStatus[] = ['rejected', 'withdrawn'];
