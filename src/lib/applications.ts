import type {
  ActivityEntry,
  ActivityKind,
  Application,
  ApplicationStatus,
  FollowUpTask,
  Interview,
  Profile,
  Qualification,
  Requirement,
  SalaryExpectation,
  SalaryPeriod,
} from '@/types';
import { DEFAULT_CURRENCY } from '@/types';
import type {
  ApplicationFormValues,
  InterviewFormValues,
  QualificationFormValues,
  RequirementFormValues,
  TaskFormValues,
} from '@/lib/schemas';
import { parseMoney } from '@/lib/schemas';
import { createId } from '@/lib/ids';
import { suggestQualification } from '@/lib/match';

/**
 * Pure transformations over a single application.
 *
 * Keeping these free of React means the provider is a thin mapping layer, and
 * the rules below — what counts as an edit, when an activity entry is written,
 * how blank form fields clear stored values — are unit-testable on their own.
 */

/** Drops keys whose value is `undefined` so the stored JSON stays tidy. */
function compact<T extends Record<string, unknown>>(value: T): T {
  const out: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (entry !== undefined && entry !== '') out[key] = entry;
  }
  return out as T;
}

function nowIso(): string {
  return new Date().toISOString();
}

function activity(kind: ActivityKind, extra: Partial<ActivityEntry> = {}): ActivityEntry {
  const entry: ActivityEntry = { id: createId(), kind, at: nowIso() };
  if (extra.from) entry.from = extra.from;
  if (extra.to) entry.to = extra.to;
  if (extra.detail) entry.detail = extra.detail;
  return entry;
}

/**
 * Tokens, not sentences: an activity entry is persisted, so the wording has to
 * be chosen when the timeline is *rendered* rather than when the edit happens —
 * otherwise a record created in English would stay English after the visitor
 * switches to Arabic. `TimelinePanel` maps these to messages and falls back to
 * showing an unrecognised detail verbatim, which is what records written by
 * earlier versions carry.
 */
export const EDIT_DETAILS = 'details';
export const EDIT_NOTES = 'notes';

/**
 * Maps validated form strings onto the stored shape: trims text, converts money
 * fields to numbers and drops anything the user left blank.
 */
function fieldsFromForm(values: ApplicationFormValues) {
  const salaryMin = parseMoney(values.salaryMin);
  const salaryMax = parseMoney(values.salaryMax);
  // Currency and period describe an amount. With no amount they describe
  // nothing, so they are not stored — otherwise every application would carry
  // the form's default "SAR, monthly" whether or not a salary was ever given.
  const hasSalary = salaryMin !== undefined || salaryMax !== undefined;

  return compact({
    company: values.company.trim(),
    jobTitle: values.jobTitle.trim(),
    jobUrl: values.jobUrl.trim(),
    location: values.location.trim(),
    workArrangement: values.workArrangement,
    employmentType: values.employmentType,
    salaryMin,
    salaryMax,
    salaryCurrency: hasSalary ? values.salaryCurrency.trim().toUpperCase() : undefined,
    salaryPeriod: hasSalary && values.salaryPeriod !== '' ? values.salaryPeriod : undefined,
    appliedDate: values.appliedDate,
    status: values.status,
    notes: values.notes.trim(),
    nextFollowUpDate: values.nextFollowUpDate,
  }) as Pick<
    Application,
    | 'company'
    | 'jobTitle'
    | 'jobUrl'
    | 'location'
    | 'workArrangement'
    | 'employmentType'
    | 'salaryMin'
    | 'salaryMax'
    | 'salaryCurrency'
    | 'salaryPeriod'
    | 'appliedDate'
    | 'status'
    | 'notes'
    | 'nextFollowUpDate'
  >;
}

export function createApplication(values: ApplicationFormValues): Application {
  const timestamp = nowIso();
  const entries: ActivityEntry[] = [activity('created')];
  if (values.status !== 'saved') {
    entries.push(activity('status_changed', { from: 'saved', to: values.status }));
  }

  return {
    id: createId(),
    ...fieldsFromForm(values),
    createdAt: timestamp,
    updatedAt: timestamp,
    interviews: [],
    tasks: [],
    requirements: [],
    activity: entries,
  };
}

export function applyFormValues(
  application: Application,
  values: ApplicationFormValues,
): Application {
  const fields = fieldsFromForm(values);
  const statusChanged = fields.status !== application.status;

  const entries = [...application.activity];
  entries.push(
    statusChanged
      ? activity('status_changed', { from: application.status, to: fields.status })
      : activity('updated', { detail: EDIT_DETAILS }),
  );

  // Rebuilt from `fields` rather than spread over the previous record, so
  // clearing an optional input actually removes the stored value.
  return {
    id: application.id,
    ...fields,
    createdAt: application.createdAt,
    updatedAt: nowIso(),
    interviews: application.interviews,
    tasks: application.tasks,
    requirements: application.requirements,
    activity: entries,
  };
}

export function withStatus(application: Application, status: ApplicationStatus): Application {
  if (application.status === status) return application;
  return {
    ...application,
    status,
    updatedAt: nowIso(),
    activity: [
      ...application.activity,
      activity('status_changed', { from: application.status, to: status }),
    ],
  };
}

export function withNotes(application: Application, notes: string): Application {
  const trimmed = notes.trim();
  if ((application.notes ?? '') === trimmed) return application;

  const next: Application = {
    ...application,
    updatedAt: nowIso(),
    activity: [...application.activity, activity('updated', { detail: EDIT_NOTES })],
  };
  if (trimmed) next.notes = trimmed;
  else delete next.notes;
  return next;
}

export function withInterview(
  application: Application,
  values: InterviewFormValues,
): Application {
  const interview: Interview = {
    id: createId(),
    date: values.date,
    time: values.time,
    type: values.type,
    createdAt: nowIso(),
  };
  const notes = values.notes.trim();
  if (notes) interview.notes = notes;

  return {
    ...application,
    updatedAt: nowIso(),
    interviews: [...application.interviews, interview].sort((a, b) =>
      `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`),
    ),
    activity: [
      ...application.activity,
      activity('interview_added', { detail: `${values.date} ${values.time}` }),
    ],
  };
}

export function withoutInterview(application: Application, interviewId: string): Application {
  const target = application.interviews.find((entry) => entry.id === interviewId);
  if (!target) return application;

  return {
    ...application,
    updatedAt: nowIso(),
    interviews: application.interviews.filter((entry) => entry.id !== interviewId),
    activity: [
      ...application.activity,
      activity('interview_removed', { detail: `${target.date} ${target.time}` }),
    ],
  };
}

export function withTask(application: Application, values: TaskFormValues): Application {
  const task: FollowUpTask = {
    id: createId(),
    title: values.title.trim(),
    completed: false,
    createdAt: nowIso(),
  };
  if (values.dueDate) task.dueDate = values.dueDate;

  return {
    ...application,
    updatedAt: nowIso(),
    tasks: [...application.tasks, task],
    activity: [...application.activity, activity('task_added', { detail: task.title })],
  };
}

export function withTaskToggled(application: Application, taskId: string): Application {
  const target = application.tasks.find((entry) => entry.id === taskId);
  if (!target) return application;

  const completed = !target.completed;
  const updated: FollowUpTask = { ...target, completed };
  if (completed) updated.completedAt = nowIso();
  else delete updated.completedAt;

  return {
    ...application,
    updatedAt: nowIso(),
    tasks: application.tasks.map((entry) => (entry.id === taskId ? updated : entry)),
    activity: [
      ...application.activity,
      activity(completed ? 'task_completed' : 'task_reopened', { detail: target.title }),
    ],
  };
}

export function withoutTask(application: Application, taskId: string): Application {
  const target = application.tasks.find((entry) => entry.id === taskId);
  if (!target) return application;

  return {
    ...application,
    updatedAt: nowIso(),
    tasks: application.tasks.filter((entry) => entry.id !== taskId),
    activity: [...application.activity, activity('task_removed', { detail: target.title })],
  };
}

/* ================================================================== */
/* Requirements                                                        */
/* ================================================================== */

/**
 * Adds a requirement taken from the posting.
 *
 * If the profile already lists something that plainly answers it, the box is
 * ticked to save the user a click — but only on the conservative match in
 * `lib/match.ts`, because a wrongly pre-ticked box puts a claim in the user's
 * mouth that they never made. They can untick it, and nothing re-ticks it.
 */
export function withRequirement(
  application: Application,
  values: RequirementFormValues,
  profile?: Profile,
): Application {
  const label = values.label.trim();
  const requirement: Requirement = {
    id: createId(),
    label,
    importance: values.importance,
    met: profile ? suggestQualification(profile, label) !== undefined : false,
    createdAt: nowIso(),
  };

  return {
    ...application,
    updatedAt: nowIso(),
    requirements: [...application.requirements, requirement],
    activity: [...application.activity, activity('requirement_added', { detail: label })],
  };
}

export function withRequirementToggled(
  application: Application,
  requirementId: string,
): Application {
  const target = application.requirements.find((entry) => entry.id === requirementId);
  if (!target) return application;

  const met = !target.met;
  return {
    ...application,
    updatedAt: nowIso(),
    requirements: application.requirements.map((entry) =>
      entry.id === requirementId ? { ...entry, met } : entry,
    ),
    activity: [
      ...application.activity,
      activity(met ? 'requirement_met' : 'requirement_unmet', { detail: target.label }),
    ],
  };
}

export function withoutRequirement(
  application: Application,
  requirementId: string,
): Application {
  const target = application.requirements.find((entry) => entry.id === requirementId);
  if (!target) return application;

  return {
    ...application,
    updatedAt: nowIso(),
    requirements: application.requirements.filter((entry) => entry.id !== requirementId),
    activity: [
      ...application.activity,
      activity('requirement_removed', { detail: target.label }),
    ],
  };
}

/* ================================================================== */
/* Profile                                                             */
/* ================================================================== */

export function withQualification(
  profile: Profile,
  values: QualificationFormValues,
): Profile {
  const qualification: Qualification = {
    id: createId(),
    label: values.label.trim(),
    kind: values.kind,
    createdAt: nowIso(),
  };
  return {
    ...profile,
    qualifications: [...profile.qualifications, qualification],
    updatedAt: nowIso(),
  };
}

export function withoutQualification(profile: Profile, qualificationId: string): Profile {
  if (!profile.qualifications.some((entry) => entry.id === qualificationId)) return profile;
  return {
    ...profile,
    qualifications: profile.qualifications.filter((entry) => entry.id !== qualificationId),
    updatedAt: nowIso(),
  };
}

/** Sets or clears (`undefined`) the applicant's expected salary. */
export function withSalaryExpectation(
  profile: Profile,
  expectation: SalaryExpectation | undefined,
): Profile {
  const next: Profile = { ...profile, updatedAt: nowIso() };
  if (expectation) next.salaryExpectation = expectation;
  else delete next.salaryExpectation;
  return next;
}

/** The defaults a new application form should start from, given the profile. */
export function salaryDefaultsFor(profile: Profile): SalaryDefaults {
  return profile.salaryExpectation
    ? { currency: profile.salaryExpectation.currency, period: profile.salaryExpectation.period }
    : { currency: DEFAULT_CURRENCY, period: 'monthly' };
}

export function withHeadline(profile: Profile, headline: string): Profile {
  const trimmed = headline.trim();
  if ((profile.headline ?? '') === trimmed) return profile;

  const next: Profile = { ...profile, updatedAt: nowIso() };
  if (trimmed) next.headline = trimmed;
  else delete next.headline;
  return next;
}

/* ================================================================== */
/* Form helpers                                                        */
/* ================================================================== */

/** Where a new application's currency and period come from, if anywhere. */
export interface SalaryDefaults {
  currency: string;
  period: SalaryPeriod;
}

/**
 * Blank form, used by "Add application".
 *
 * The currency and period are prefilled — from the applicant's own salary
 * expectation when there is one, otherwise SAR per month, which is how Saudi
 * offers are normally quoted. They are only stored if an amount is entered.
 */
export function emptyFormValues(
  appliedDate: string,
  defaults: SalaryDefaults = { currency: DEFAULT_CURRENCY, period: 'monthly' },
): ApplicationFormValues {
  return {
    company: '',
    jobTitle: '',
    jobUrl: '',
    location: '',
    workArrangement: 'remote',
    employmentType: 'full_time',
    salaryMin: '',
    salaryMax: '',
    salaryCurrency: defaults.currency,
    salaryPeriod: defaults.period,
    appliedDate,
    status: 'applied',
    notes: '',
    nextFollowUpDate: '',
  };
}

/** Form defaults for an existing record. */
export function toFormValues(application: Application): ApplicationFormValues {
  return {
    company: application.company,
    jobTitle: application.jobTitle,
    jobUrl: application.jobUrl ?? '',
    location: application.location ?? '',
    workArrangement: application.workArrangement,
    employmentType: application.employmentType,
    salaryMin: application.salaryMin === undefined ? '' : String(application.salaryMin),
    salaryMax: application.salaryMax === undefined ? '' : String(application.salaryMax),
    salaryCurrency: application.salaryCurrency ?? '',
    // Left blank rather than defaulted: saving an old record unchanged must
    // not stamp a period on it that nobody chose.
    salaryPeriod: application.salaryPeriod ?? '',
    appliedDate: application.appliedDate,
    status: application.status,
    notes: application.notes ?? '',
    nextFollowUpDate: application.nextFollowUpDate ?? '',
  };
}
