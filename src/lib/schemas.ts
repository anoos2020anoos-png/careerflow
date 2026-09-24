import { z } from 'zod';
import {
  ACTIVITY_KINDS,
  APPLICATION_STATUSES,
  COMPANY_SECTORS,
  EMPLOYMENT_TYPES,
  INTERVIEW_TYPES,
  QUALIFICATION_KINDS,
  REQUIREMENT_IMPORTANCES,
  SALARY_PERIODS,
  WORK_ARRANGEMENTS,
} from '@/types';
import { isValidDateOnly, isValidTime } from '@/lib/dates';
import { issue } from '@/lib/validationKeys';

/**
 * Two families of schema live here.
 *
 * 1. **Form schemas** validate what the user types. Every optional field is a
 *    plain string (empty string = "not provided") and *no* Zod transform is
 *    used, so `z.input` and `z.output` are identical. That keeps React Hook
 *    Form's generics simple and means the values the submit handler receives
 *    are exactly the values the inputs hold. String-to-number conversion is
 *    done once, explicitly, in `src/lib/applications.ts`.
 *
 * 2. **Persistence schemas** validate data coming back out of `localStorage` or
 *    an imported file, where every field is already in its final type.
 *
 * Form-schema messages are translation *keys*, not finished sentences — these
 * schemas run outside React, where no translate function exists. `fieldError`
 * turns a key back into text when the message is rendered.
 */

/* ================================================================== */
/* Form schemas                                                        */
/* ================================================================== */

const requiredText = (max: number) =>
  z
    .string()
    .trim()
    .min(1, issue('validation.required'))
    .max(max, issue('validation.maxLength', max));

const optionalText = (max: number) =>
  z.string().trim().max(max, issue('validation.maxLength', max));

const requiredDate = z
  .string()
  .min(1, issue('validation.required'))
  .refine(isValidDateOnly, issue('validation.date'));

const optionalDate = z
  .string()
  .refine((value) => value === '' || isValidDateOnly(value), issue('validation.date'));

/** Digits, with spaces and commas allowed as thousands separators. */
const MONEY_PATTERN = /^\d{1,12}(\.\d{1,2})?$/;

const optionalMoney = z
  .string()
  .trim()
  .refine(
    (value) => value === '' || MONEY_PATTERN.test(value.replace(/[\s,]/g, '')),
    issue('validation.money'),
  )
  .refine(
    (value) => value === '' || Number(value.replace(/[\s,]/g, '')) <= 100_000_000,
    issue('validation.moneyTooLarge'),
  );

/** Reads a money field back out as a number, or `undefined` when blank. */
export function parseMoney(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const cleaned = value.replace(/[\s,]/g, '');
  if (cleaned === '') return undefined;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : undefined;
}

const currencyCode = z
  .string()
  .trim()
  .refine((value) => value === '' || /^[A-Za-z]{3}$/.test(value), issue('validation.currency'));

/** `''` is the form's "not specified", so an older record round-trips untouched. */
const optionalSalaryPeriod = z.union([z.enum(SALARY_PERIODS), z.literal('')]);

const optionalHttpUrl = z
  .string()
  .trim()
  .max(2048, issue('validation.urlTooLong'))
  .refine((value) => {
    if (value === '') return true;
    if (!/^https?:\/\//i.test(value)) return false;
    try {
      const url = new URL(value);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }, issue('validation.url'));

export const applicationFormSchema = z
  .object({
    company: requiredText(120),
    jobTitle: requiredText(120),
    jobUrl: optionalHttpUrl,
    location: optionalText(120),
    workArrangement: z.enum(WORK_ARRANGEMENTS),
    employmentType: z.enum(EMPLOYMENT_TYPES),
    salaryMin: optionalMoney,
    salaryMax: optionalMoney,
    salaryCurrency: currencyCode,
    salaryPeriod: optionalSalaryPeriod,
    appliedDate: requiredDate,
    status: z.enum(APPLICATION_STATUSES),
    notes: optionalText(5000),
    nextFollowUpDate: optionalDate,
  })
  .superRefine((values, ctx) => {
    const min = parseMoney(values.salaryMin);
    const max = parseMoney(values.salaryMax);

    if (min !== undefined && max !== undefined && max < min) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['salaryMax'],
        message: issue('validation.salaryOrder'),
      });
    }

    if ((min !== undefined || max !== undefined) && values.salaryCurrency.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['salaryCurrency'],
        message: issue('validation.currencyNeeded'),
      });
    }
  });

/** Input and output are identical — see the note at the top of this file. */
export type ApplicationFormValues = z.infer<typeof applicationFormSchema>;

export const interviewFormSchema = z.object({
  date: requiredDate,
  time: z.string().min(1, issue('validation.required')).refine(isValidTime, issue('validation.time')),
  type: z.enum(INTERVIEW_TYPES),
  notes: optionalText(2000),
});

export type InterviewFormValues = z.infer<typeof interviewFormSchema>;

export const taskFormSchema = z.object({
  title: requiredText(160),
  dueDate: optionalDate,
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;

export const requirementFormSchema = z.object({
  label: requiredText(200),
  importance: z.enum(REQUIREMENT_IMPORTANCES),
});

export type RequirementFormValues = z.infer<typeof requirementFormSchema>;

export const qualificationFormSchema = z.object({
  label: requiredText(200),
  kind: z.enum(QUALIFICATION_KINDS),
});

export type QualificationFormValues = z.infer<typeof qualificationFormSchema>;

export const profileFormSchema = z.object({
  headline: optionalText(300),
});

/**
 * The expected-salary form. All three blank means "no expectation"; an amount
 * needs a currency, and a period is always chosen from a list.
 */
export const salaryExpectationFormSchema = z
  .object({
    amount: optionalMoney,
    currency: currencyCode,
    period: z.enum(SALARY_PERIODS),
  })
  .superRefine((values, ctx) => {
    if (parseMoney(values.amount) !== undefined && values.currency.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['currency'],
        message: issue('validation.currencyNeeded'),
      });
    }
  });

export type SalaryExpectationFormValues = z.infer<typeof salaryExpectationFormSchema>;

export const companyDetailsFormSchema = z.object({
  name: requiredText(120),
  /** `''` means "not set". */
  sector: z.union([z.enum(COMPANY_SECTORS), z.literal('')]),
  industry: optionalText(120),
  website: optionalHttpUrl,
  notes: optionalText(5000),
});

export type CompanyDetailsFormValues = z.infer<typeof companyDetailsFormSchema>;

export type ProfileFormValues = z.infer<typeof profileFormSchema>;

/* ================================================================== */
/* Persistence schemas                                                 */
/* ================================================================== */

const dateOnly = z.string().refine(isValidDateOnly, 'Expected a YYYY-MM-DD date');

const isoInstant = z
  .string()
  .refine((value) => !Number.isNaN(new Date(value).getTime()), 'Expected an ISO-8601 timestamp');

export const interviewSchema = z.object({
  id: z.string().min(1),
  date: dateOnly,
  time: z.string().refine(isValidTime, 'Expected a HH:MM time'),
  type: z.enum(INTERVIEW_TYPES),
  notes: z.string().max(5000).optional(),
  createdAt: isoInstant,
});

export const taskSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(500),
  dueDate: dateOnly.optional(),
  completed: z.boolean(),
  completedAt: isoInstant.optional(),
  createdAt: isoInstant,
});

export const activitySchema = z.object({
  id: z.string().min(1),
  kind: z.enum(ACTIVITY_KINDS),
  at: isoInstant,
  from: z.enum(APPLICATION_STATUSES).optional(),
  to: z.enum(APPLICATION_STATUSES).optional(),
  detail: z.string().max(500).optional(),
});

export const requirementSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1).max(500),
  importance: z.enum(REQUIREMENT_IMPORTANCES),
  met: z.boolean(),
  createdAt: isoInstant,
});

export const qualificationSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1).max(500),
  kind: z.enum(QUALIFICATION_KINDS),
  createdAt: isoInstant,
});

export const salaryExpectationSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().regex(/^[A-Z]{3}$/),
  period: z.enum(SALARY_PERIODS),
});

export const companyDetailsSchema = z.object({
  key: z.string().min(1).max(200),
  name: z.string().min(1).max(200),
  sector: z.enum(COMPANY_SECTORS).optional(),
  industry: z.string().max(200).optional(),
  // Checked again when rendered: `ExternalLink` only ever links http(s).
  website: z.string().max(2048).optional(),
  notes: z.string().max(20000).optional(),
  updatedAt: isoInstant,
});

export const profileSchema = z.object({
  headline: z.string().max(1000).optional(),
  qualifications: z.array(qualificationSchema),
  salaryExpectation: salaryExpectationSchema.optional(),
  updatedAt: isoInstant,
});

export const applicationSchema = z.object({
  id: z.string().min(1),
  company: z.string().min(1).max(200),
  jobTitle: z.string().min(1).max(200),
  jobUrl: z.string().max(2048).optional(),
  location: z.string().max(200).optional(),
  workArrangement: z.enum(WORK_ARRANGEMENTS),
  employmentType: z.enum(EMPLOYMENT_TYPES),
  salaryMin: z.number().nonnegative().optional(),
  salaryMax: z.number().nonnegative().optional(),
  salaryCurrency: z.string().max(8).optional(),
  salaryPeriod: z.enum(SALARY_PERIODS).optional(),
  appliedDate: dateOnly,
  status: z.enum(APPLICATION_STATUSES),
  notes: z.string().max(20000).optional(),
  nextFollowUpDate: dateOnly.optional(),
  createdAt: isoInstant,
  updatedAt: isoInstant,
  interviews: z.array(interviewSchema),
  tasks: z.array(taskSchema),
  // Optional on the way in so a version 1 payload still parses; `migrate()`
  // fills it with an empty array before the record reaches the app.
  requirements: z.array(requirementSchema).optional(),
  activity: z.array(activitySchema),
});

/**
 * Current on-disk format version.
 *
 * 1 — applications only.
 * 2 — adds `Application.requirements` and a top-level `profile`. Both are
 *     optional in the schema and filled in by `migrate()`, so a version 1
 *     payload loads without the user losing anything.
 * 3 — adds `Application.salaryPeriod`, `Profile.salaryExpectation` and the
 *     top-level `companies`. All optional, and deliberately left empty on
 *     older records: a missing period is not assumed to be monthly.
 *
 * The number still goes up for purely additive changes. An older build reading
 * newer data would silently drop fields it does not know, so the version check
 * in `loadData()` has to be able to refuse it.
 */
export const DATA_VERSION = 3;

export const persistedDataSchema = z.object({
  version: z.number().int().positive(),
  applications: z.array(applicationSchema),
  profile: profileSchema.optional(),
  companies: z.array(companyDetailsSchema).optional(),
});
