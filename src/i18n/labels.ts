import type { Translate } from '@/i18n/i18n-context';
import type { Locale, MessageKey } from '@/i18n/messages';
import type {
  Application,
  ApplicationStatus,
  CompanySector,
  EmploymentType,
  InterviewType,
  QualificationKind,
  RequirementImportance,
  SalaryExpectation,
  SalaryPeriod,
  WorkArrangement,
} from '@/types';
import { formatMoney, formatSalaryRange } from '@/lib/format';
import { convertPeriod, salaryOf, type ExpectationComparison } from '@/lib/salary';
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

const IMPORTANCE_KEYS: Record<RequirementImportance, MessageKey> = {
  essential: 'requirement.essential',
  preferred: 'requirement.preferred',
};

const QUALIFICATION_KIND_KEYS: Record<QualificationKind, MessageKey> = {
  education: 'qualification.education',
  skill: 'qualification.skill',
  language: 'qualification.language',
  certification: 'qualification.certification',
  experience: 'qualification.experience',
};

const SORT_KEYS: Record<SortKey, MessageKey> = {
  appliedDate: 'filters.sortAppliedDate',
  company: 'filters.sortCompany',
  updatedAt: 'filters.sortUpdatedAt',
  salary: 'filters.sortSalary',
};

const SECTOR_KEYS: Record<CompanySector, MessageKey> = {
  government: 'sector.government',
  semi_government: 'sector.semi_government',
  private: 'sector.private',
  non_profit: 'sector.non_profit',
};

const PERIOD_KEYS: Record<SalaryPeriod, MessageKey> = {
  monthly: 'period.monthly',
  annual: 'period.annual',
  daily: 'period.daily',
  hourly: 'period.hourly',
};

/** The adjective used inside a sentence ("this rate is daily"). */
const PERIOD_WORD_KEYS: Record<SalaryPeriod, MessageKey> = {
  monthly: 'periodWord.monthly',
  annual: 'periodWord.annual',
  daily: 'periodWord.daily',
  hourly: 'periodWord.hourly',
};

const PER_PERIOD_KEYS: Record<SalaryPeriod, MessageKey> = {
  monthly: 'salary.per.monthly',
  annual: 'salary.per.annual',
  daily: 'salary.per.daily',
  hourly: 'salary.per.hourly',
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

export function importanceLabel(t: Translate, value: RequirementImportance): string {
  return t(IMPORTANCE_KEYS[value]);
}

export function qualificationKindLabel(t: Translate, value: QualificationKind): string {
  return t(QUALIFICATION_KIND_KEYS[value]);
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

export function periodLabel(t: Translate, period: SalaryPeriod): string {
  return t(PERIOD_KEYS[period]);
}

/**
 * A currency's name in the interface language, from the browser's own data —
 * "Saudi Riyal", "ريال سعودي" — so nothing has to be kept in step by hand.
 * Falls back to the bare code where `Intl.DisplayNames` is missing or does not
 * know the code.
 */
export function currencyName(locale: Locale, code: string): string {
  try {
    return new Intl.DisplayNames([locale], { type: 'currency' }).of(code) ?? code;
  } catch {
    return code;
  }
}

/** "SAR — Saudi Riyal", for a currency picker. */
export function currencyOptionLabel(locale: Locale, code: string): string {
  const name = currencyName(locale, code);
  return name === code ? code : `${code} — ${name}`;
}

/** An amount with its period: "SAR 20,000 per month". */
export function moneyPerPeriod(t: Translate, amount: string, period: SalaryPeriod): string {
  return t(PER_PERIOD_KEYS[period], { amount });
}

/**
 * The salary line for an application: "SAR 18,000–24,000 per month". Without a
 * recorded period the range is shown bare rather than with a guessed one.
 */
export function salaryText(t: Translate, application: Application): string | null {
  const range = salaryOf(application);
  if (!range) return null;
  const amount = formatSalaryRange(range.min, range.max, range.currency, salaryLabels(t));
  if (!amount) return null;
  return range.period ? moneyPerPeriod(t, amount, range.period) : amount;
}

export function expectationText(t: Translate, expectation: SalaryExpectation): string {
  return moneyPerPeriod(t, formatMoney(expectation.amount, expectation.currency), expectation.period);
}

/**
 * Explains a comparison in a sentence, or `null` when there is nothing to say
 * (no salary on the application). "Not compared" outcomes always carry their
 * reason, so they are never mistaken for "does not meet".
 */
export function comparisonText(
  t: Translate,
  comparison: ExpectationComparison,
  expectation: SalaryExpectation | undefined,
): string | null {
  switch (comparison.kind) {
    case 'no-salary':
      return null;
    case 'no-expectation':
      return t('salaryCheck.noExpectation');
    case 'no-period':
      return t('salaryCheck.noPeriod');
    default:
      break;
  }
  if (!expectation) return null;
  const expected = expectationText(t, expectation);

  switch (comparison.kind) {
    case 'different-currency':
      return t('salaryCheck.differentCurrency', {
        currency: comparison.currency,
        expectedCurrency: expectation.currency,
      });
    case 'incompatible-period':
      return t('salaryCheck.incompatiblePeriod', {
        period: t(PERIOD_WORD_KEYS[comparison.period]),
        expectedPeriod: t(PERIOD_WORD_KEYS[expectation.period]),
      });
    case 'above':
      return t('salaryCheck.above', { expected });
    case 'within':
      return t('salaryCheck.within', { expected });
    case 'below':
      return t('salaryCheck.below', { expected });
    case 'open-ended':
      return t('salaryCheck.openEnded', { expected });
    default:
      return null;
  }
}

/**
 * When the application's period differs from the expectation's (annual against
 * monthly), the converted figure the comparison actually used — so the ÷ 12 is
 * visible rather than implied. `null` when no conversion happened.
 */
export function convertedRangeText(
  t: Translate,
  application: Application,
  expectation: SalaryExpectation | undefined,
): string | null {
  const range = salaryOf(application);
  const period = range?.period;
  if (!range || !period || !expectation || period === expectation.period) return null;
  if (range.currency.toUpperCase() !== expectation.currency.toUpperCase()) return null;

  const convert = (value: number | undefined) =>
    value === undefined ? undefined : convertPeriod(value, period, expectation.period);
  const min = convert(range.min);
  const max = convert(range.max);
  if (min === null || max === null) return null;

  const amount = formatSalaryRange(
    min === undefined ? undefined : Math.round(min),
    max === undefined ? undefined : Math.round(max),
    range.currency,
    salaryLabels(t),
  );
  if (!amount) return null;
  return t('salaryCheck.converted', { amount, period: t(PERIOD_WORD_KEYS[expectation.period]) });
}

export function sectorLabel(t: Translate, sector: CompanySector): string {
  return t(SECTOR_KEYS[sector]);
}
