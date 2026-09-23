import { useId, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarClock, Plus, Trash2 } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Field, Input, Select, Textarea } from '@/components/ui/Field';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { useT } from '@/i18n/i18n-context';
import { fieldError } from '@/i18n/fieldError';
import { interviewTypeLabel, relativeDay } from '@/i18n/labels';
import { interviewFormSchema, type InterviewFormValues } from '@/lib/schemas';
import { formatDateOnly, formatTime, localTimeZoneName, todayDateOnly } from '@/lib/dates';
import { INTERVIEW_TYPES, type Interview } from '@/types';

function InterviewDialog({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: InterviewFormValues) => void;
}) {
  const formId = useId();
  const t = useT();
  const timeZone = localTimeZoneName(t('date.localZone'));

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InterviewFormValues>({
    resolver: zodResolver(interviewFormSchema),
    defaultValues: {
      date: todayDateOnly(),
      time: '10:00',
      type: 'phone_screen',
      notes: '',
    },
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t('interviews.addTitle')}
      description={t('interviews.addDesc', { zone: timeZone })}
      closeOnBackdrop={false}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t('action.cancel')}
          </Button>
          <Button variant="primary" type="submit" form={formId}>
            {t('interviews.addTitle')}
          </Button>
        </>
      }
    >
      <form id={formId} noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('interviews.date')} required error={fieldError(t, errors.date?.message)}>
            {(aria) => <Input {...aria} {...register('date')} type="date" dir="ltr" />}
          </Field>
          <Field
            label={t('interviews.time')}
            required
            error={fieldError(t, errors.time?.message)}
            hint={t('interviews.timeHint', { zone: timeZone })}
          >
            {(aria) => <Input {...aria} {...register('time')} type="time" dir="ltr" />}
          </Field>
        </div>

        <Field label={t('interviews.type')} required error={fieldError(t, errors.type?.message)}>
          {(aria) => (
            <Select {...aria} {...register('type')}>
              {INTERVIEW_TYPES.map((type) => (
                <option key={type} value={type}>
                  {interviewTypeLabel(t, type)}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <Field
          label={t('form.notes')}
          error={fieldError(t, errors.notes?.message)}
          hint={t('interviews.notesHint')}
        >
          {(aria) => <Textarea {...aria} {...register('notes')} rows={3} />}
        </Field>
      </form>
    </Dialog>
  );
}

export function InterviewsPanel({
  interviews,
  onAdd,
  onRemove,
}: {
  interviews: Interview[];
  onAdd: (values: InterviewFormValues) => void;
  onRemove: (interviewId: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [pendingRemove, setPendingRemove] = useState<Interview | null>(null);
  const today = todayDateOnly();
  const t = useT();

  return (
    <Card>
      <CardHeader
        title={t('interviews.title')}
        description={t('interviews.description', {
          zone: localTimeZoneName(t('date.localZone')),
        })}
        action={
          <Button size="sm" onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t('action.add')}
          </Button>
        }
      />

      {interviews.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title={t('interviews.emptyTitle')}
          description={t('interviews.emptyDesc')}
        />
      ) : (
        <ul className="divide-y divide-line">
          {interviews.map((interview) => {
            const upcoming = interview.date >= today;
            return (
              <li key={interview.id} className="flex items-start gap-3 px-5 py-3.5">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-ink">
                      {t('interviews.at', {
                        date: formatDateOnly(interview.date),
                        time: formatTime(interview.time),
                      })}
                    </span>
                    <Badge tone={upcoming ? 'brand' : 'neutral'}>
                      {interviewTypeLabel(t, interview.type)}
                    </Badge>
                    <span className="text-xs text-ink-muted">
                      {relativeDay(t, interview.date, today)}
                    </span>
                  </div>
                  {interview.notes ? (
                    <p className="mt-1.5 whitespace-pre-wrap break-words text-sm text-ink-muted">
                      {interview.notes}
                    </p>
                  ) : null}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPendingRemove(interview)}
                  aria-label={t('interviews.removeAria', {
                    date: formatDateOnly(interview.date),
                    time: formatTime(interview.time),
                  })}
                  className="hover:text-danger"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      <InterviewDialog
        key={adding ? 'open' : 'closed'}
        open={adding}
        onClose={() => setAdding(false)}
        onSubmit={(values) => {
          onAdd(values);
          setAdding(false);
        }}
      />

      <ConfirmDialog
        open={pendingRemove !== null}
        title={t('interviews.removeTitle')}
        description={
          pendingRemove
            ? t('interviews.at', {
                date: formatDateOnly(pendingRemove.date),
                time: formatTime(pendingRemove.time),
              })
            : ''
        }
        confirmLabel={t('action.remove')}
        destructive
        onConfirm={() => {
          if (pendingRemove) onRemove(pendingRemove.id);
          setPendingRemove(null);
        }}
        onCancel={() => setPendingRemove(null)}
      />
    </Card>
  );
}
