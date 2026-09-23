import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Field, Input, Select, Textarea } from '@/components/ui/Field';
import { applicationFormSchema, type ApplicationFormValues } from '@/lib/schemas';
import { useT } from '@/i18n/i18n-context';
import { fieldError } from '@/i18n/fieldError';
import { arrangementLabel, employmentLabel, statusLabel } from '@/i18n/labels';
import {
  APPLICATION_STATUSES,
  EMPLOYMENT_TYPES,
  WORK_ARRANGEMENTS,
} from '@/types';

export interface ApplicationFormProps {
  formId: string;
  defaultValues: ApplicationFormValues;
  onSubmit: (values: ApplicationFormValues) => void;
}

/**
 * The single source of truth for creating and editing an application.
 * Validation lives in `applicationFormSchema`; this component only renders it.
 */
export function ApplicationForm({ formId, defaultValues, onSubmit }: ApplicationFormProps) {
  const t = useT();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationFormSchema),
    defaultValues,
    mode: 'onBlur',
  });

  const error = (message: string | undefined) => fieldError(t, message);

  return (
    <form id={formId} noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('form.company')} required error={error(errors.company?.message)}>
          {(aria) => (
            <Input
              {...aria}
              {...register('company')}
              autoComplete="organization"
              placeholder="Sahaab Cloud"
            />
          )}
        </Field>

        <Field label={t('form.jobTitle')} required error={error(errors.jobTitle?.message)}>
          {(aria) => (
            <Input
              {...aria}
              {...register('jobTitle')}
              autoComplete="organization-title"
              placeholder="Senior Frontend Engineer"
            />
          )}
        </Field>
      </div>

      <Field
        label={t('form.jobUrl')}
        error={error(errors.jobUrl?.message)}
        hint={t('form.jobUrlHint')}
      >
        {(aria) => (
          <Input
            {...aria}
            {...register('jobUrl')}
            type="url"
            inputMode="url"
            dir="ltr"
            placeholder="https://example.com/jobs/123"
          />
        )}
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label={t('form.location')} error={error(errors.location?.message)}>
          {(aria) => <Input {...aria} {...register('location')} placeholder="Riyadh" />}
        </Field>

        <Field
          label={t('form.arrangement')}
          required
          error={error(errors.workArrangement?.message)}
        >
          {(aria) => (
            <Select {...aria} {...register('workArrangement')}>
              {WORK_ARRANGEMENTS.map((value) => (
                <option key={value} value={value}>
                  {arrangementLabel(t, value)}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <Field
          label={t('form.employment')}
          required
          error={error(errors.employmentType?.message)}
        >
          {(aria) => (
            <Select {...aria} {...register('employmentType')}>
              {EMPLOYMENT_TYPES.map((value) => (
                <option key={value} value={value}>
                  {employmentLabel(t, value)}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </div>

      <fieldset className="grid gap-4 sm:grid-cols-3">
        <legend className="mb-2 text-sm font-medium text-ink">{t('form.salaryLegend')}</legend>

        <Field label={t('form.salaryMin')} error={error(errors.salaryMin?.message)}>
          {(aria) => (
            <Input
              {...aria}
              {...register('salaryMin')}
              inputMode="decimal"
              dir="ltr"
              placeholder="18000"
            />
          )}
        </Field>

        <Field label={t('form.salaryMax')} error={error(errors.salaryMax?.message)}>
          {(aria) => (
            <Input
              {...aria}
              {...register('salaryMax')}
              inputMode="decimal"
              dir="ltr"
              placeholder="24000"
            />
          )}
        </Field>

        <Field
          label={t('form.currency')}
          error={error(errors.salaryCurrency?.message)}
          hint={t('form.currencyHint')}
        >
          {(aria) => (
            <Input
              {...aria}
              {...register('salaryCurrency')}
              maxLength={3}
              dir="ltr"
              placeholder="SAR"
              className="uppercase"
            />
          )}
        </Field>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label={t('form.appliedDate')} required error={error(errors.appliedDate?.message)}>
          {(aria) => <Input {...aria} {...register('appliedDate')} type="date" dir="ltr" />}
        </Field>

        <Field label={t('form.status')} required error={error(errors.status?.message)}>
          {(aria) => (
            <Select {...aria} {...register('status')}>
              {APPLICATION_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {statusLabel(t, value)}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <Field
          label={t('form.followUp')}
          error={error(errors.nextFollowUpDate?.message)}
          hint={t('form.followUpHint')}
        >
          {(aria) => <Input {...aria} {...register('nextFollowUpDate')} type="date" dir="ltr" />}
        </Field>
      </div>

      <Field label={t('form.notes')} error={error(errors.notes?.message)} hint={t('form.notesHint')}>
        {(aria) => (
          <Textarea
            {...aria}
            {...register('notes')}
            rows={4}
            placeholder={t('form.notesPlaceholder')}
          />
        )}
      </Field>

      {/* Allows Enter-to-submit from any text input without a visible button. */}
      <button type="submit" className="sr-only" disabled={isSubmitting}>
        {t('form.submitSr')}
      </button>
    </form>
  );
}
