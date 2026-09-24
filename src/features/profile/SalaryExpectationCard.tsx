import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, Info } from 'lucide-react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select } from '@/components/ui/Field';
import { useI18n } from '@/i18n/i18n-context';
import { fieldError } from '@/i18n/fieldError';
import { currencyOptionLabel, expectationText, periodLabel } from '@/i18n/labels';
import {
  parseMoney,
  salaryExpectationFormSchema,
  type SalaryExpectationFormValues,
} from '@/lib/schemas';
import {
  COMMON_CURRENCIES,
  DEFAULT_CURRENCY,
  SALARY_PERIODS,
  type SalaryExpectation,
} from '@/types';

function toFormValues(expectation: SalaryExpectation | undefined): SalaryExpectationFormValues {
  return expectation
    ? {
        amount: String(expectation.amount),
        currency: expectation.currency,
        period: expectation.period,
      }
    : { amount: '', currency: DEFAULT_CURRENCY, period: 'monthly' };
}

function ExpectationForm({
  expectation,
  onSave,
  justSaved,
}: {
  expectation: SalaryExpectation | undefined;
  onSave: (next: SalaryExpectation | undefined) => void;
  /** Held by the card, because saving remounts this form. */
  justSaved: boolean;
}) {
  const { t, locale } = useI18n();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<SalaryExpectationFormValues>({
    resolver: zodResolver(salaryExpectationFormSchema),
    defaultValues: toFormValues(expectation),
  });

  const currencies: string[] = [...COMMON_CURRENCIES];
  if (expectation && !currencies.includes(expectation.currency)) {
    currencies.unshift(expectation.currency);
  }

  const submit = (values: SalaryExpectationFormValues) => {
    const amount = parseMoney(values.amount);
    // A blank amount clears the expectation rather than storing zero, which
    // every salary would "meet".
    onSave(
      amount === undefined || amount <= 0
        ? undefined
        : { amount, currency: values.currency.trim().toUpperCase(), period: values.period },
    );
  };

  return (
    <form noValidate onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label={t('expectation.amount')} error={fieldError(t, errors.amount?.message)}>
          {(aria) => (
            <Input
              {...aria}
              {...register('amount')}
              inputMode="decimal"
              dir="ltr"
              placeholder="20000"
            />
          )}
        </Field>
        <Field label={t('expectation.currency')} error={fieldError(t, errors.currency?.message)}>
          {(aria) => (
            <Select {...aria} {...register('currency')}>
              {currencies.map((code) => (
                <option key={code} value={code}>
                  {currencyOptionLabel(locale, code)}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label={t('expectation.period')} error={fieldError(t, errors.period?.message)}>
          {(aria) => (
            <Select {...aria} {...register('period')}>
              {SALARY_PERIODS.map((period) => (
                <option key={period} value={period}>
                  {periodLabel(t, period)}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-muted" aria-live="polite">
          {justSaved && !isDirty ? (
            <span className="inline-flex items-center gap-1.5 text-success">
              <Check className="h-4 w-4" aria-hidden="true" />
              {expectation
                ? t('expectation.current', { value: expectationText(t, expectation) })
                : t('expectation.none')}
            </span>
          ) : expectation ? (
            t('expectation.current', { value: expectationText(t, expectation) })
          ) : (
            t('expectation.none')
          )}
        </p>
        <div className="flex gap-2">
          {expectation ? (
            <Button
              variant="secondary"
              onClick={() => onSave(undefined)}
            >
              {t('expectation.clear')}
            </Button>
          ) : null}
          <Button type="submit" variant="primary">
            {t('action.saveChanges')}
          </Button>
        </div>
      </div>
    </form>
  );
}

/**
 * The applicant's expected salary. Applications with a salary in the same
 * currency are compared against it; see `src/lib/salary.ts` for what is, and
 * is deliberately not, converted.
 */
export function SalaryExpectationCard({
  expectation,
  onSave,
}: {
  expectation: SalaryExpectation | undefined;
  onSave: (next: SalaryExpectation | undefined) => void;
}) {
  const { t } = useI18n();
  const [justSaved, setJustSaved] = useState(false);

  const save = (next: SalaryExpectation | undefined) => {
    onSave(next);
    setJustSaved(true);
  };

  return (
    <Card>
      <CardHeader title={t('expectation.title')} description={t('expectation.description')} />
      <CardBody className="flex flex-col gap-3">
        {/* Remounts when the stored value changes underneath (an import, a
            clear), so the inputs never show a stale figure. */}
        <ExpectationForm
          key={expectation ? `${expectation.amount}-${expectation.currency}-${expectation.period}` : 'none'}
          expectation={expectation}
          onSave={save}
          justSaved={justSaved}
        />
        <p className="flex items-start gap-2 text-xs leading-relaxed text-ink-muted">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{t('expectation.defaultsNote')}</span>
        </p>
      </CardBody>
    </Card>
  );
}
