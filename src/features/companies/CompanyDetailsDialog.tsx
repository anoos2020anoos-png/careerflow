import { useId } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle } from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select, Textarea } from '@/components/ui/Field';
import { useT } from '@/i18n/i18n-context';
import { fieldError } from '@/i18n/fieldError';
import { plural, sectorLabel } from '@/i18n/labels';
import { companyDetailsFormSchema, type CompanyDetailsFormValues } from '@/lib/schemas';
import { companyKey, type CompanyDetailsInput, type CompanySummary } from '@/lib/companies';
import { COMPANY_SECTORS } from '@/types';

function toFormValues(summary: CompanySummary): CompanyDetailsFormValues {
  return {
    name: summary.name,
    sector: summary.details?.sector ?? '',
    industry: summary.details?.industry ?? '',
    website: summary.details?.website ?? '',
    notes: summary.details?.notes ?? '',
  };
}

function CompanyForm({
  formId,
  summary,
  allCompanies,
  onSubmit,
}: {
  formId: string;
  summary: CompanySummary;
  allCompanies: CompanySummary[];
  onSubmit: (input: CompanyDetailsInput) => void;
}) {
  const t = useT();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CompanyDetailsFormValues>({
    resolver: zodResolver(companyDetailsFormSchema),
    defaultValues: toFormValues(summary),
  });

  // Shown while typing, before saving: what a rename will actually do.
  const typedName = useWatch({ control, name: 'name' }) ?? '';
  const typedKey = companyKey(typedName);
  const mergeTarget =
    typedKey && typedKey !== summary.key
      ? allCompanies.find((entry) => entry.key === typedKey)
      : undefined;
  const renameCount = typedName.trim()
    ? summary.applications.filter((application) => application.company !== typedName.trim())
        .length
    : 0;

  const submit = (values: CompanyDetailsFormValues) => {
    const input: CompanyDetailsInput = { name: values.name };
    if (values.sector !== '') input.sector = values.sector;
    if (values.industry.trim()) input.industry = values.industry;
    if (values.website.trim()) input.website = values.website;
    if (values.notes.trim()) input.notes = values.notes;
    onSubmit(input);
  };

  return (
    <form id={formId} noValidate onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
      <Field label={t('companies.name')} required error={fieldError(t, errors.name?.message)}>
        {(aria) => <Input {...aria} {...register('name')} autoComplete="organization" />}
      </Field>

      {mergeTarget ? (
        <p
          role="status"
          className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning-soft px-3 py-2 text-sm text-ink"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
          <span>{t('companies.mergeWarning', { name: mergeTarget.name })}</span>
        </p>
      ) : renameCount > 0 ? (
        <p role="status" className="text-xs text-ink-muted">
          {plural(t, renameCount, 'companies.renameNoteOne', 'companies.renameNote')}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('companies.sector')} error={fieldError(t, errors.sector?.message)}>
          {(aria) => (
            <Select {...aria} {...register('sector')}>
              <option value="">{t('sector.unset')}</option>
              {COMPANY_SECTORS.map((sector) => (
                <option key={sector} value={sector}>
                  {sectorLabel(t, sector)}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label={t('companies.industry')} error={fieldError(t, errors.industry?.message)}>
          {(aria) => (
            <Input
              {...aria}
              {...register('industry')}
              placeholder={t('companies.industryPlaceholder')}
            />
          )}
        </Field>
      </div>

      <Field
        label={t('companies.website')}
        error={fieldError(t, errors.website?.message)}
        hint={t('form.jobUrlHint')}
      >
        {(aria) => (
          <Input
            {...aria}
            {...register('website')}
            type="url"
            inputMode="url"
            dir="ltr"
            placeholder="https://example.com"
          />
        )}
      </Field>

      <Field label={t('companies.notes')} error={fieldError(t, errors.notes?.message)}>
        {(aria) => (
          <Textarea
            {...aria}
            {...register('notes')}
            rows={4}
            placeholder={t('companies.notesPlaceholder')}
          />
        )}
      </Field>
    </form>
  );
}

export function CompanyDetailsDialog({
  summary,
  allCompanies,
  onSave,
  onClose,
}: {
  /** The company being edited, or `null` when the dialog is closed. */
  summary: CompanySummary | null;
  allCompanies: CompanySummary[];
  onSave: (previousKey: string, input: CompanyDetailsInput) => void;
  onClose: () => void;
}) {
  const t = useT();
  const formId = useId();

  return (
    <Dialog
      open={summary !== null}
      onClose={onClose}
      closeOnBackdrop={false}
      title={t('companies.editTitle')}
      description={t('companies.editDesc')}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t('action.cancel')}
          </Button>
          <Button variant="primary" type="submit" form={formId}>
            {t('action.saveChanges')}
          </Button>
        </>
      }
    >
      {summary ? (
        <CompanyForm
          key={summary.key}
          formId={formId}
          summary={summary}
          allCompanies={allCompanies}
          onSubmit={(input) => {
            onSave(summary.key, input);
            onClose();
          }}
        />
      ) : null}
    </Dialog>
  );
}
