import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ListChecks, Plus, Trash2 } from 'lucide-react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';
import { EmptyState } from '@/components/ui/EmptyState';
import { useT } from '@/i18n/i18n-context';
import { fieldError } from '@/i18n/fieldError';
import { relativeDay } from '@/i18n/labels';
import { taskFormSchema, type TaskFormValues } from '@/lib/schemas';
import { formatDateOnly, todayDateOnly } from '@/lib/dates';
import { isTaskDue } from '@/lib/metrics';
import type { FollowUpTask } from '@/types';
import { cn } from '@/lib/cn';

export function TasksPanel({
  tasks,
  onAdd,
  onToggle,
  onRemove,
}: {
  tasks: FollowUpTask[];
  onAdd: (values: TaskFormValues) => void;
  onToggle: (taskId: string) => void;
  onRemove: (taskId: string) => void;
}) {
  const today = todayDateOnly();
  const t = useT();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: { title: '', dueDate: '' },
  });

  const submit = (values: TaskFormValues) => {
    onAdd(values);
    reset({ title: '', dueDate: '' });
  };

  const open = tasks.filter((task) => !task.completed);
  const done = tasks.filter((task) => task.completed);
  const ordered = [...open, ...done];

  return (
    <Card>
      <CardHeader
        title={t('tasks.title')}
        description={t('tasks.summary', { open: open.length, done: done.length })}
      />

      {ordered.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title={t('tasks.emptyTitle')}
          description={t('tasks.emptyDesc')}
        />
      ) : (
        <ul className="divide-y divide-line">
          {ordered.map((task) => {
            const due = isTaskDue(task, today);
            return (
              <li key={task.id} className="flex items-start gap-3 px-5 py-3">
                <input
                  type="checkbox"
                  id={`task-${task.id}`}
                  checked={task.completed}
                  onChange={() => onToggle(task.id)}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-line accent-brand"
                />
                <label htmlFor={`task-${task.id}`} className="min-w-0 flex-1 cursor-pointer">
                  <span
                    className={cn(
                      'block break-words text-sm',
                      task.completed ? 'text-ink-muted line-through' : 'text-ink',
                    )}
                  >
                    {task.title}
                  </span>
                  {task.dueDate ? (
                    <span
                      className={cn(
                        'mt-0.5 block text-xs',
                        due ? 'font-medium text-warning' : 'text-ink-muted',
                      )}
                    >
                      {t('tasks.due', {
                        date: formatDateOnly(task.dueDate),
                        relative: relativeDay(t, task.dueDate, today),
                      })}
                    </span>
                  ) : null}
                </label>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemove(task.id)}
                  aria-label={t('tasks.removeAria', { title: task.title })}
                  className="hover:text-danger"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      <CardBody className="border-t border-line">
        <form
          noValidate
          onSubmit={handleSubmit(submit)}
          className="flex flex-col gap-3"
        >
          {/*
            The text gets its own full-width line at every size. A viewport
            breakpoint cannot tell how wide this card is — on the detail page it
            sits in a narrow column — and a single row once squeezed this input
            down to 36px at a 1024px window. The date and the button share the
            next line, and wrap onto two when the column is too narrow for both.
          */}
          <Field label={t('tasks.newLabel')} error={fieldError(t, errors.title?.message)}>
            {(aria) => (
              <Input {...aria} {...register('title')} placeholder={t('tasks.newPlaceholder')} />
            )}
          </Field>
          <div className="flex flex-wrap items-end gap-3">
            <Field
              label={t('tasks.dueDate')}
              error={fieldError(t, errors.dueDate?.message)}
              className="min-w-[9rem] flex-1"
            >
              {(aria) => <Input {...aria} {...register('dueDate')} type="date" dir="ltr" />}
            </Field>
            <Button type="submit" variant="primary" className="shrink-0">
              <Plus className="h-4 w-4" aria-hidden="true" />
              {t('action.add')}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
