import { Link } from 'react-router-dom';
import { CalendarClock, ListChecks } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import type { OpenTask, UpcomingInterview } from '@/lib/metrics';
import { isTaskDue } from '@/lib/metrics';
import { useT } from '@/i18n/i18n-context';
import { interviewTypeLabel, relativeDay } from '@/i18n/labels';
import { formatDateOnly, formatTime, todayDateOnly } from '@/lib/dates';

export function UpcomingInterviewsCard({ items }: { items: UpcomingInterview[] }) {
  const today = todayDateOnly();
  const t = useT();

  return (
    <Card>
      <CardHeader
        title={t('panel.interviews')}
        description={t('panel.interviewsDesc')}
      />
      {items.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title={t('panel.interviewsEmpty')}
          description={t('panel.interviewsEmptyDesc')}
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
                  {t('interviews.at', {
                    date: formatDateOnly(interview.date),
                    time: formatTime(interview.time),
                  })}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <Badge tone="brand">{interviewTypeLabel(t, interview.type)}</Badge>
                <span className="text-xs text-ink-muted">
                  {relativeDay(t, interview.date, today)}
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
  const t = useT();

  return (
    <Card>
      <CardHeader
        title={t('panel.followUps')}
        description={t('panel.followUpsDesc')}
      />
      {items.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title={t('panel.followUpsEmpty')}
          description={t('panel.followUpsEmptyDesc')}
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
                    {relativeDay(t, task.dueDate, today)}
                  </span>
                ) : (
                  <span className="shrink-0 text-xs text-ink-muted">{t('panel.noDate')}</span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
