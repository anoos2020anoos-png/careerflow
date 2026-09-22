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
import { interviewFormSchema, type InterviewFormValues } from '@/lib/schemas';
import {
  describeRelativeDay,
  formatDateOnly,
  formatTime,
  localTimeZoneName,
  todayDateOnly,
} from '@/lib/dates';
import { INTERVIEW_TYPES, INTERVIEW_TYPE_LABELS, type Interview } from '@/types';

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
  const timeZone = localTimeZoneName();

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
      title="Add interview"
      description={`Times are stored and shown in this browser's timezone (${timeZone}).`}
      closeOnBackdrop={false}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form={formId}>
            Add interview
          </Button>
        </>
      }
    >
      <form id={formId} noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Date" required error={errors.date?.message}>
            {(aria) => <Input {...aria} {...register('date')} type="date" />}
          </Field>
          <Field label="Time" required error={errors.time?.message} hint={`Local time (${timeZone})`}>
            {(aria) => <Input {...aria} {...register('time')} type="time" />}
          </Field>
        </div>

        <Field label="Interview type" required error={errors.type?.message}>
          {(aria) => (
            <Select {...aria} {...register('type')}>
              {INTERVIEW_TYPES.map((type) => (
                <option key={type} value={type}>
                  {INTERVIEW_TYPE_LABELS[type]}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <Field label="Notes" error={errors.notes?.message} hint="Optional. Interviewers, format, topics to revise.">
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

  return (
    <Card>
      <CardHeader
        title="Interviews"
        description={`Scheduled in this browser's timezone (${localTimeZoneName()}).`}
        action={
          <Button size="sm" onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add
          </Button>
        }
      />

      {interviews.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="No interviews yet"
          description="Add a date and time once something is scheduled, and it will appear on the dashboard."
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
                      {formatDateOnly(interview.date)} at {formatTime(interview.time)}
                    </span>
                    <Badge tone={upcoming ? 'brand' : 'neutral'}>
                      {INTERVIEW_TYPE_LABELS[interview.type]}
                    </Badge>
                    <span className="text-xs text-ink-muted">
                      {describeRelativeDay(interview.date, today)}
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
                  aria-label={`Remove interview on ${interview.date} at ${interview.time}`}
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
        title="Remove this interview?"
        description={
          pendingRemove
            ? `${formatDateOnly(pendingRemove.date)} at ${formatTime(pendingRemove.time)}`
            : ''
        }
        confirmLabel="Remove"
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
