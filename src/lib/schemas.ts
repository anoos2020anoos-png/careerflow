import { z } from 'zod';
import {
  ACTIVITY_KINDS,
  APPLICATION_STATUSES,
  EMPLOYMENT_TYPES,
  INTERVIEW_TYPES,
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
    salaryCurrency: z
      .string()
      .trim()
      .refine(
        (value) => value === '' || /^[A-Za-z]{3}$/.test(value),
        issue('validation.currency'),
      ),
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
  appliedDate: dateOnly,
  status: z.enum(APPLICATION_STATUSES),
  notes: z.string().max(20000).optional(),
  nextFollowUpDate: dateOnly.optional(),
  createdAt: isoInstant,
  updatedAt: isoInstant,
  interviews: z.array(interviewSchema),
  tasks: z.array(taskSchema),
  activity: z.array(activitySchema),
});

/** Current on-disk format version. Bump when the persisted shape changes. */
export const DATA_VERSION = 1;

export const persistedDataSchema = z.object({
  version: z.number().int().positive(),
  applications: z.array(applicationSchema),
});
