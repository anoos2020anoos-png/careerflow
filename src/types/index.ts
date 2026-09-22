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
  activity: ActivityEntry[];
}

/** The shape written to `localStorage`. `version` allows future migrations. */
export interface PersistedData {
  version: number;
  applications: Application[];
}

/* ------------------------------------------------------------------ */
/* Display labels                                                      */
/* ------------------------------------------------------------------ */

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  saved: 'Saved',
  applied: 'Applied',
  screening: 'Screening',
  interview: 'Interview',
  offer: 'Offer',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
};

export const WORK_ARRANGEMENT_LABELS: Record<WorkArrangement, string> = {
  remote: 'Remote',
  hybrid: 'Hybrid',
  onsite: 'On-site',
};

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  internship: 'Internship',
  contract: 'Contract',
};

export const INTERVIEW_TYPE_LABELS: Record<InterviewType, string> = {
  phone_screen: 'Phone screen',
  technical: 'Technical',
  behavioral: 'Behavioral',
  system_design: 'System design',
  onsite: 'On-site',
  final: 'Final round',
  other: 'Other',
};

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
