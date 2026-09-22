import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ListChecks, Plus, Trash2 } from 'lucide-react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';
import { EmptyState } from '@/components/ui/EmptyState';
import { taskFormSchema, type TaskFormValues } from '@/lib/schemas';
import { describeRelativeDay, formatDateOnly, todayDateOnly } from '@/lib/dates';
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
        title="Follow-up tasks"
        description={`${open.length} open, ${done.length} completed.`}
      />

      {ordered.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="No follow-ups"
          description="Add a reminder such as “email the recruiter” or “prepare system design notes”."
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
                      Due {formatDateOnly(task.dueDate)} · {describeRelativeDay(task.dueDate, today)}
                    </span>
                  ) : null}
                </label>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemove(task.id)}
                  aria-label={`Remove follow-up: ${task.title}`}
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
        <form noValidate onSubmit={handleSubmit(submit)} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Field label="New follow-up" error={errors.title?.message} className="flex-1">
            {(aria) => (
              <Input {...aria} {...register('title')} placeholder="Email the recruiter" />
            )}
          </Field>
          <Field label="Due date" error={errors.dueDate?.message} className="sm:w-44">
            {(aria) => <Input {...aria} {...register('dueDate')} type="date" />}
          </Field>
          <Button type="submit" variant="primary" className="sm:mb-0">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
