import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ClipboardList, Info, Plus, Trash2 } from 'lucide-react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Field, Input, Select } from '@/components/ui/Field';
import { EmptyState } from '@/components/ui/EmptyState';
import { useT } from '@/i18n/i18n-context';
import { fieldError } from '@/i18n/fieldError';
import { importanceLabel } from '@/i18n/labels';
import { requirementFormSchema, type RequirementFormValues } from '@/lib/schemas';
import { summarizeMatch } from '@/lib/match';
import { REQUIREMENT_IMPORTANCES, type Requirement } from '@/types';
import { cn } from '@/lib/cn';

/**
 * What the posting asks for, and which of it the applicant has.
 *
 * The counts are deliberately kept as "met of stated" rather than collapsed into
 * a single score. A percentage on its own invites being read as a chance of
 * getting the job, which this cannot know and does not claim — see the note at
 * the top of `src/lib/match.ts`.
 */
export function RequirementsPanel({
  requirements,
  onAdd,
  onToggle,
  onRemove,
}: {
  requirements: Requirement[];
  onAdd: (values: RequirementFormValues) => void;
  onToggle: (requirementId: string) => void;
  onRemove: (requirementId: string) => void;
}) {
  const t = useT();
  const summary = summarizeMatch(requirements);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RequirementFormValues>({
    resolver: zodResolver(requirementFormSchema),
    defaultValues: { label: '', importance: 'essential' },
  });

  const submit = (values: RequirementFormValues) => {
    onAdd(values);
    reset({ label: '', importance: 'essential' });
  };

  // Essential first, so the ones that actually gate an application lead.
  const ordered = [
    ...requirements.filter((entry) => entry.importance === 'essential'),
    ...requirements.filter((entry) => entry.importance === 'preferred'),
  ];

  const missingEssential = summary.essentialTotal - summary.essentialMet;

  return (
    <Card>
      <CardHeader title={t('match.title')} description={t('match.description')} />

      {summary.hasRequirements ? (
        <CardBody className="flex flex-col gap-3 border-b border-line">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            <span className="text-ink">
              <strong className="font-semibold tabular-nums">
                {summary.essentialTotal === 0
                  ? t('match.noEssential')
                  : t('match.essentialCount', {
                      met: summary.essentialMet,
                      total: summary.essentialTotal,
                    })}
              </strong>
            </span>
            {summary.preferredTotal > 0 ? (
              <span className="text-ink-muted tabular-nums">
                {t('match.preferredCount', {
                  met: summary.preferredMet,
                  total: summary.preferredTotal,
                })}
              </span>
            ) : null}
          </div>

          {summary.essentialTotal > 0 ? (
            <p
              className={cn(
                'text-sm',
                missingEssential === 0 ? 'text-success' : 'text-ink-muted',
              )}
            >
              {missingEssential === 0
                ? t('match.allEssential')
                : missingEssential === 1
                  ? t('match.oneMissingEssential')
                  : t('match.someEssential', { missing: missingEssential })}
            </p>
          ) : null}
        </CardBody>
      ) : null}

      {ordered.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={t('match.emptyTitle')}
          description={t('match.emptyDesc')}
        />
      ) : (
        <ul className="divide-y divide-line">
          {ordered.map((requirement) => (
            <li key={requirement.id} className="flex items-start gap-3 px-5 py-3">
              <input
                type="checkbox"
                id={`req-${requirement.id}`}
                checked={requirement.met}
                onChange={() => onToggle(requirement.id)}
                aria-label={t('match.metAria', { label: requirement.label })}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-line accent-brand"
              />
              <label htmlFor={`req-${requirement.id}`} className="min-w-0 flex-1 cursor-pointer">
                <span
                  className={cn(
                    'block break-words text-sm',
                    requirement.met ? 'text-ink' : 'text-ink-muted',
                  )}
                >
                  {requirement.label}
                </span>
                <span className="mt-1 inline-flex">
                  <Badge tone={requirement.importance === 'essential' ? 'brand' : 'neutral'}>
                    {importanceLabel(t, requirement.importance)}
                  </Badge>
                </span>
              </label>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemove(requirement.id)}
                aria-label={t('match.removeAria', { label: requirement.label })}
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
          className="flex flex-col gap-3"
        >
          {/* Same layout as the follow-up form, for the same reason: see TasksPanel. */}
          <Field label={t('match.newLabel')} error={fieldError(t, errors.label?.message)}>
            {(aria) => (
              <Input {...aria} {...register('label')} placeholder={t('match.newPlaceholder')} />
            )}
          </Field>
          <div className="flex flex-wrap items-end gap-3">
            <Field
              label={t('match.importance')}
              error={fieldError(t, errors.importance?.message)}
              className="min-w-[9rem] flex-1 sm:max-w-xs"
            >
              {(aria) => (
                <Select {...aria} {...register('importance')}>
                  {REQUIREMENT_IMPORTANCES.map((value) => (
                    <option key={value} value={value}>
                      {importanceLabel(t, value)}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Button type="submit" variant="primary" className="shrink-0">
              <Plus className="h-4 w-4" aria-hidden="true" />
              {t('action.add')}
            </Button>
          </div>
        </form>

        <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-ink-muted">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{t('match.notAScore')}</span>
        </p>
      </CardBody>
    </Card>
  );
}
