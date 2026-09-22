import { Link } from 'react-router-dom';
import { CalendarClock, ListChecks } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import type { OpenTask, UpcomingInterview } from '@/lib/metrics';
import { isTaskDue } from '@/lib/metrics';
import { describeRelativeDay, formatDateOnly, formatTime, todayDateOnly } from '@/lib/dates';
import { INTERVIEW_TYPE_LABELS } from '@/types';

export function UpcomingInterviewsCard({ items }: { items: UpcomingInterview[] }) {
  const today = todayDateOnly();

  return (
    <Card>
      <CardHeader
        title="Upcoming interviews"
        description="Scheduled today or later, on applications that are still open."
      />
      {items.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="Nothing scheduled"
          description="Add an interview from an application's detail page and it will show up here."
        />
      ) : (
        <ul className="divide-y divide-line">
          {items.map(({ applicationId, company, jobTitle, interview }) => (
            <li key={interview.id} className="flex items-start justify-between gap-3 px-5 py-3">
              <div className="min-w-0">
                <Link
                  to={`/applications/${applicationId}`}
                  className="text-sm font-medium text-ink underline-offset-4 hover:text-brand hover:underline"
                >
                  {jobTitle}
                </Link>
                <p className="truncate text-xs text-ink-muted">{company}</p>
                <p className="mt-1 text-xs text-ink-muted">
                  {formatDateOnly(interview.date)} at {formatTime(interview.time)}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <Badge tone="brand">{INTERVIEW_TYPE_LABELS[interview.type]}</Badge>
                <span className="text-xs text-ink-muted">
                  {describeRelativeDay(interview.date, today)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export function OpenTasksCard({ items }: { items: OpenTask[] }) {
  const today = todayDateOnly();

  return (
    <Card>
      <CardHeader
        title="Follow-ups"
        description="Open tasks across every application that is still open, soonest first."
      />
      {items.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="Nothing outstanding"
          description="Follow-up tasks you add to an application appear here until you tick them off."
        />
      ) : (
        <ul className="divide-y divide-line">
          {items.map(({ applicationId, company, task }) => {
            const due = isTaskDue(task, today);
            return (
              <li key={task.id} className="flex items-start justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <Link
                    to={`/applications/${applicationId}`}
                    className="text-sm text-ink underline-offset-4 hover:text-brand hover:underline"
                  >
                    {task.title}
                  </Link>
                  <p className="truncate text-xs text-ink-muted">{company}</p>
                </div>
                {task.dueDate ? (
                  <span
                    className={`shrink-0 text-xs ${due ? 'font-medium text-warning' : 'text-ink-muted'}`}
                  >
                    {describeRelativeDay(task.dueDate, today)}
                  </span>
                ) : (
                  <span className="shrink-0 text-xs text-ink-muted">No date</span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
