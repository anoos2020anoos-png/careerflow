import type { Translate } from '@/i18n/i18n-context';
import type { MessageKey } from '@/i18n/messages';
import type {
  ApplicationStatus,
  EmploymentType,
  InterviewType,
  WorkArrangement,
} from '@/types';
import type { SortKey } from '@/lib/filters';
import { differenceInDays, todayDateOnly } from '@/lib/dates';

/**
 * Typed bridges from a domain value to its message key.
 *
 * Written as explicit maps rather than a template literal so TypeScript checks
 * that every enum member has a translation, instead of trusting a cast.
 */

const STATUS_KEYS: Record<ApplicationStatus, MessageKey> = {
  saved: 'status.saved',
  applied: 'status.applied',
  screening: 'status.screening',
  interview: 'status.interview',
  offer: 'status.offer',
  rejected: 'status.rejected',
  withdrawn: 'status.withdrawn',
};

const ARRANGEMENT_KEYS: Record<WorkArrangement, MessageKey> = {
  remote: 'arrangement.remote',
  hybrid: 'arrangement.hybrid',
  onsite: 'arrangement.onsite',
};

const EMPLOYMENT_KEYS: Record<EmploymentType, MessageKey> = {
  full_time: 'employment.full_time',
  part_time: 'employment.part_time',
  internship: 'employment.internship',
  contract: 'employment.contract',
};

const INTERVIEW_TYPE_KEYS: Record<InterviewType, MessageKey> = {
  phone_screen: 'interviewType.phone_screen',
  technical: 'interviewType.technical',
  behavioral: 'interviewType.behavioral',
  system_design: 'interviewType.system_design',
  onsite: 'interviewType.onsite',
  final: 'interviewType.final',
  other: 'interviewType.other',
};

const SORT_KEYS: Record<SortKey, MessageKey> = {
  appliedDate: 'filters.sortAppliedDate',
  company: 'filters.sortCompany',
  updatedAt: 'filters.sortUpdatedAt',
};

export function statusLabel(t: Translate, status: ApplicationStatus): string {
  return t(STATUS_KEYS[status]);
}

export function arrangementLabel(t: Translate, value: WorkArrangement): string {
  return t(ARRANGEMENT_KEYS[value]);
}

export function employmentLabel(t: Translate, value: EmploymentType): string {
  return t(EMPLOYMENT_KEYS[value]);
}

export function interviewTypeLabel(t: Translate, value: InterviewType): string {
  return t(INTERVIEW_TYPE_KEYS[value]);
}

export function sortLabel(t: Translate, value: SortKey): string {
  return t(SORT_KEYS[value]);
}

/** Locale-aware "Today" / "In 3 days" / "5 days ago". */
export function relativeDay(t: Translate, value: string, today = todayDateOnly()): string {
  const delta = differenceInDays(today, value);
  if (delta === 0) return t('date.today');
  if (delta === 1) return t('date.tomorrow');
  if (delta === -1) return t('date.yesterday');
  if (delta > 1) return t('date.in', { count: delta });
  return t('date.ago', { count: Math.abs(delta) });
}

/** Picks the singular or plural message for a count. */
export function plural(
  t: Translate,
  count: number,
  one: MessageKey,
  many: MessageKey,
): string {
  return count === 1 ? t(one) : t(many, { count });
}

/** Wording passed to `formatSalaryRange` for its one-sided cases. */
export function salaryLabels(t: Translate): { from: string; upTo: string } {
  return { from: t('common.salaryFrom'), upTo: t('common.salaryUpTo') };
}
