import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Field, Input, Select, Textarea } from '@/components/ui/Field';
import { applicationFormSchema, type ApplicationFormValues } from '@/lib/schemas';
import {
  APPLICATION_STATUSES,
  EMPLOYMENT_TYPES,
  EMPLOYMENT_TYPE_LABELS,
  STATUS_LABELS,
  WORK_ARRANGEMENTS,
  WORK_ARRANGEMENT_LABELS,
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
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationFormSchema),
    defaultValues,
    mode: 'onBlur',
  });

  return (
    <form id={formId} noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Company" required error={errors.company?.message}>
          {(aria) => (
            <Input
              {...aria}
              {...register('company')}
              autoComplete="organization"
              placeholder="Northwind Analytics"
            />
          )}
        </Field>

        <Field label="Job title" required error={errors.jobTitle?.message}>
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
        label="Job posting link"
        error={errors.jobUrl?.message}
        hint="Optional. Must start with http:// or https://."
      >
        {(aria) => (
          <Input
            {...aria}
            {...register('jobUrl')}
            type="url"
            inputMode="url"
            placeholder="https://example.com/jobs/123"
          />
        )}
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Location" error={errors.location?.message}>
          {(aria) => <Input {...aria} {...register('location')} placeholder="Berlin, Germany" />}
        </Field>

        <Field label="Work arrangement" required error={errors.workArrangement?.message}>
          {(aria) => (
            <Select {...aria} {...register('workArrangement')}>
              {WORK_ARRANGEMENTS.map((value) => (
                <option key={value} value={value}>
                  {WORK_ARRANGEMENT_LABELS[value]}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <Field label="Employment type" required error={errors.employmentType?.message}>
          {(aria) => (
            <Select {...aria} {...register('employmentType')}>
              {EMPLOYMENT_TYPES.map((value) => (
                <option key={value} value={value}>
                  {EMPLOYMENT_TYPE_LABELS[value]}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </div>

      <fieldset className="grid gap-4 sm:grid-cols-3">
        <legend className="mb-2 text-sm font-medium text-ink">Salary range (optional)</legend>

        <Field label="Minimum" error={errors.salaryMin?.message}>
          {(aria) => (
            <Input {...aria} {...register('salaryMin')} inputMode="decimal" placeholder="65000" />
          )}
        </Field>

        <Field label="Maximum" error={errors.salaryMax?.message}>
          {(aria) => (
            <Input {...aria} {...register('salaryMax')} inputMode="decimal" placeholder="80000" />
          )}
        </Field>

        <Field label="Currency" error={errors.salaryCurrency?.message} hint="3-letter code">
          {(aria) => (
            <Input
              {...aria}
              {...register('salaryCurrency')}
              maxLength={3}
              placeholder="EUR"
              className="uppercase"
            />
          )}
        </Field>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Application date" required error={errors.appliedDate?.message}>
          {(aria) => <Input {...aria} {...register('appliedDate')} type="date" />}
        </Field>

        <Field label="Status" required error={errors.status?.message}>
          {(aria) => (
            <Select {...aria} {...register('status')}>
              {APPLICATION_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {STATUS_LABELS[value]}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <Field
          label="Next follow-up"
          error={errors.nextFollowUpDate?.message}
          hint="Optional reminder date"
        >
          {(aria) => <Input {...aria} {...register('nextFollowUpDate')} type="date" />}
        </Field>
      </div>

      <Field
        label="Notes"
        error={errors.notes?.message}
        hint="Plain text. Contacts, salary expectations, anything worth remembering."
      >
        {(aria) => (
          <Textarea
            {...aria}
            {...register('notes')}
            rows={4}
            placeholder="Recruiter mentioned a two-stage process…"
          />
        )}
      </Field>

      {/* Allows Enter-to-submit from any text input without a visible button. */}
      <button type="submit" className="sr-only" disabled={isSubmitting}>
        Save application
      </button>
    </form>
  );
}
