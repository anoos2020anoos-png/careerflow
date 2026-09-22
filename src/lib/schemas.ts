import { z } from 'zod';
import {
  ACTIVITY_KINDS,
  APPLICATION_STATUSES,
  EMPLOYMENT_TYPES,
  INTERVIEW_TYPES,
  WORK_ARRANGEMENTS,
} from '@/types';
import { isValidDateOnly, isValidTime } from '@/lib/dates';

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
 */

/* ================================================================== */
/* Form schemas                                                        */
/* ================================================================== */

const requiredText = (label: string, max: number) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .max(max, `${label} must be ${max} characters or fewer`);

const optionalText = (label: string, max: number) =>
  z.string().trim().max(max, `${label} must be ${max} characters or fewer`);

const requiredDate = z
  .string()
  .min(1, 'Date is required')
  .refine(isValidDateOnly, 'Enter a valid date');

const optionalDate = z
  .string()
  .refine((value) => value === '' || isValidDateOnly(value), 'Enter a valid date');

/** Digits, with spaces and commas allowed as thousands separators. */
const MONEY_PATTERN = /^\d{1,12}(\.\d{1,2})?$/;

const optionalMoney = z
  .string()
  .trim()
  .refine(
    (value) => value === '' || MONEY_PATTERN.test(value.replace(/[\s,]/g, '')),
    'Enter a number, for example 65000',
  )
  .refine(
    (value) => value === '' || Number(value.replace(/[\s,]/g, '')) <= 100_000_000,
    'That figure looks too large',
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
  .max(2048, 'Link is too long')
  .refine((value) => {
    if (value === '') return true;
    if (!/^https?:\/\//i.test(value)) return false;
    try {
      const url = new URL(value);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }, 'Enter a full link starting with http:// or https://');

export const applicationFormSchema = z
  .object({
    company: requiredText('Company', 120),
    jobTitle: requiredText('Job title', 120),
    jobUrl: optionalHttpUrl,
    location: optionalText('Location', 120),
    workArrangement: z.enum(WORK_ARRANGEMENTS),
    employmentType: z.enum(EMPLOYMENT_TYPES),
    salaryMin: optionalMoney,
    salaryMax: optionalMoney,
    salaryCurrency: z
      .string()
      .trim()
      .refine(
        (value) => value === '' || /^[A-Za-z]{3}$/.test(value),
        'Use a 3-letter currency code, for example USD',
      ),
    appliedDate: requiredDate,
    status: z.enum(APPLICATION_STATUSES),
    notes: optionalText('Notes', 5000),
    nextFollowUpDate: optionalDate,
  })
  .superRefine((values, ctx) => {
    const min = parseMoney(values.salaryMin);
    const max = parseMoney(values.salaryMax);

    if (min !== undefined && max !== undefined && max < min) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['salaryMax'],
        message: 'Maximum salary must be greater than or equal to the minimum',
      });
    }

    if ((min !== undefined || max !== undefined) && values.salaryCurrency.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['salaryCurrency'],
        message: 'Add a currency code for the salary range',
      });
    }
  });

/** Input and output are identical — see the note at the top of this file. */
export type ApplicationFormValues = z.infer<typeof applicationFormSchema>;

export const interviewFormSchema = z.object({
  date: requiredDate,
  time: z.string().min(1, 'Time is required').refine(isValidTime, 'Enter a time as HH:MM'),
  type: z.enum(INTERVIEW_TYPES),
  notes: optionalText('Notes', 2000),
});

export type InterviewFormValues = z.infer<typeof interviewFormSchema>;

export const taskFormSchema = z.object({
  title: requiredText('Follow-up', 160),
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
