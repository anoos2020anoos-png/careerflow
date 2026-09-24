import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { GraduationCap, Info, Plus, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Field, Input, Select, Textarea } from '@/components/ui/Field';
import { useAppData } from '@/state/app-data-context';
import { SalaryExpectationCard } from '@/features/profile/SalaryExpectationCard';
import { useT } from '@/i18n/i18n-context';
import { fieldError } from '@/i18n/fieldError';
import { plural, qualificationKindLabel } from '@/i18n/labels';
import { qualificationFormSchema, type QualificationFormValues } from '@/lib/schemas';
import { QUALIFICATION_KINDS } from '@/types';

/**
 * The applicant's own background.
 *
 * It does one job: when a requirement is added to an application and its wording
 * plainly matches something here, the box starts ticked. Nothing on this page is
 * scored or ranked, and it goes nowhere except, when the user has signed in, to
 * their own account.
 */
export function ProfilePage() {
  const {
    profile,
    setHeadline,
    addQualification,
    removeQualification,
    setSalaryExpectation,
    account,
  } = useAppData();
  const t = useT();

  const [headlineDraft, setHeadlineDraft] = useState(profile.headline ?? '');

  // Keep the draft in step when the profile changes underneath (an import).
  useEffect(() => {
    setHeadlineDraft(profile.headline ?? '');
  }, [profile.headline]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<QualificationFormValues>({
    resolver: zodResolver(qualificationFormSchema),
    defaultValues: { label: '', kind: 'skill' },
  });

  const submit = (values: QualificationFormValues) => {
    addQualification(values);
    reset({ label: '', kind: 'skill' });
  };

  const headlineDirty = headlineDraft.trim() !== (profile.headline ?? '').trim();

  return (
    <>
      <PageHeader title={t('profile.title')} description={t('profile.description')} />

      <div className="flex max-w-3xl flex-col gap-5">
        <SalaryExpectationCard
          expectation={profile.salaryExpectation}
          onSave={setSalaryExpectation}
        />

        <Card>
          <CardHeader title={t('profile.headline')} description={t('profile.headlineHint')} />
          <CardBody className="flex flex-col gap-3">
            <label htmlFor="profile-headline" className="sr-only">
              {t('profile.headline')}
            </label>
            <Textarea
              id="profile-headline"
              rows={2}
              maxLength={300}
              value={headlineDraft}
              onChange={(event) => setHeadlineDraft(event.target.value)}
              placeholder={t('profile.headlinePlaceholder')}
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                disabled={!headlineDirty}
                onClick={() => setHeadlineDraft(profile.headline ?? '')}
              >
                {t('action.discard')}
              </Button>
              <Button
                variant="primary"
                disabled={!headlineDirty}
                onClick={() => setHeadline(headlineDraft)}
              >
                {t('action.saveChanges')}
              </Button>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title={t('profile.qualifications')}
            description={t('profile.qualificationsDesc')}
            action={
              <span className="text-xs text-ink-muted">
                {plural(t, profile.qualifications.length, 'profile.oneEntry', 'profile.count')}
              </span>
            }
          />

          {profile.qualifications.length === 0 ? (
            <EmptyState
              icon={GraduationCap}
              title={t('profile.emptyTitle')}
              description={t('profile.emptyDesc')}
            />
          ) : (
            <ul className="divide-y divide-line">
              {profile.qualifications.map((qualification) => (
                <li
                  key={qualification.id}
                  className="flex items-start justify-between gap-3 px-5 py-3"
                >
                  <div className="min-w-0">
                    <p className="break-words text-sm text-ink">{qualification.label}</p>
                    <span className="mt-1 inline-flex">
                      <Badge>{qualificationKindLabel(t, qualification.kind)}</Badge>
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeQualification(qualification.id)}
                    aria-label={t('profile.removeAria', { label: qualification.label })}
                    className="hover:text-danger"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </li>
              ))}
            </ul>
          )}

          <CardBody className="border-t border-line">
            <form
              noValidate
              onSubmit={handleSubmit(submit)}
              className="flex flex-col gap-3 sm:flex-row sm:items-end"
            >
              <Field
                label={t('profile.newLabel')}
                error={fieldError(t, errors.label?.message)}
                className="flex-1"
              >
                {(aria) => (
                  <Input
                    {...aria}
                    {...register('label')}
                    placeholder={t('profile.newPlaceholder')}
                  />
                )}
              </Field>
              <Field
                label={t('profile.kind')}
                error={fieldError(t, errors.kind?.message)}
                className="sm:w-44"
              >
                {(aria) => (
                  <Select {...aria} {...register('kind')}>
                    {QUALIFICATION_KINDS.map((value) => (
                      <option key={value} value={value}>
                        {qualificationKindLabel(t, value)}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
              <Button type="submit" variant="primary">
                <Plus className="h-4 w-4" aria-hidden="true" />
                {t('action.add')}
              </Button>
            </form>

            <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-ink-muted">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>
                {t(account.signedIn ? 'profile.privacyAccount' : 'profile.privacy')}
              </span>
            </p>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
