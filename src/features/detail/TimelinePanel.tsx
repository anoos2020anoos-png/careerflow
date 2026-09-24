import { Card, CardHeader } from '@/components/ui/Card';
import { useT } from '@/i18n/i18n-context';
import { statusLabel } from '@/i18n/labels';
import type { Translate } from '@/i18n/i18n-context';
import { EDIT_DETAILS, EDIT_NOTES } from '@/lib/applications';
import { formatInstant } from '@/lib/dates';
import type { ActivityEntry } from '@/types';

function describe(t: Translate, entry: ActivityEntry): string {
  const detail = entry.detail;

  switch (entry.kind) {
    case 'created':
      return t('timeline.created');
    case 'status_changed':
      if (entry.from && entry.to) {
        return t('timeline.statusFromTo', {
          from: statusLabel(t, entry.from),
          to: statusLabel(t, entry.to),
        });
      }
      return entry.to ? t('timeline.statusTo', { to: statusLabel(t, entry.to) }) : t('timeline.updated');
    case 'updated':
      if (detail === EDIT_DETAILS) return t('timeline.detailsEdited');
      if (detail === EDIT_NOTES) return t('timeline.notesEdited');
      // Written by an earlier version, which stored finished English text.
      return detail ?? t('timeline.updated');
    case 'interview_added':
      return detail ? t('timeline.interviewAdded', { detail }) : t('timeline.updated');
    case 'interview_removed':
      return detail ? t('timeline.interviewRemoved', { detail }) : t('timeline.updated');
    case 'task_added':
      return detail ? t('timeline.taskAdded', { detail }) : t('timeline.updated');
    case 'task_completed':
      return detail ? t('timeline.taskCompleted', { detail }) : t('timeline.updated');
    case 'task_reopened':
      return detail ? t('timeline.taskReopened', { detail }) : t('timeline.updated');
    case 'task_removed':
      return detail ? t('timeline.taskRemoved', { detail }) : t('timeline.updated');
    case 'requirement_added':
      return detail ? t('timeline.requirementAdded', { detail }) : t('timeline.updated');
    case 'requirement_removed':
      return detail ? t('timeline.requirementRemoved', { detail }) : t('timeline.updated');
    case 'requirement_met':
      return detail ? t('timeline.requirementMet', { detail }) : t('timeline.updated');
    case 'requirement_unmet':
      return detail ? t('timeline.requirementUnmet', { detail }) : t('timeline.updated');
    case 'company_renamed':
      return detail ? t('timeline.companyRenamed', { detail }) : t('timeline.updated');
    default:
      return t('timeline.updated');
  }
}

export function TimelinePanel({ activity }: { activity: ActivityEntry[] }) {
  const t = useT();
  // Newest first, without mutating the stored order.
  const entries = [...activity].sort((a, b) => b.at.localeCompare(a.at));

  return (
    <Card>
      <CardHeader title={t('timeline.title')} description={t('timeline.description')} />
      <ol className="flex flex-col gap-0 px-5 py-4">
        {entries.map((entry, index) => (
          <li key={entry.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                aria-hidden="true"
                className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand ring-4 ring-brand/10"
              />
              {index < entries.length - 1 ? (
                <span aria-hidden="true" className="w-px flex-1 bg-line" />
              ) : null}
            </div>
            <div className="min-w-0 flex-1 pb-4 last:pb-0">
              <p className="break-words text-sm text-ink">{describe(t, entry)}</p>
              <p className="text-xs text-ink-muted">{formatInstant(entry.at)}</p>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}
