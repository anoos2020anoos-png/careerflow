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
export interface Profile {
  /** A one-line summary in the applicant's own words. Optional. */
  headline?: string;
  qualifications: Qualification[];
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

/** The shape written to `localStorage`. `version` allows future migrations. */
export interface PersistedData {
  version: number;
  applications: Application[];
  profile: Profile;
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
