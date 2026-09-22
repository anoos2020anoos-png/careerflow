import { Card, CardHeader } from '@/components/ui/Card';
import { formatInstant } from '@/lib/dates';
import { STATUS_LABELS, type ActivityEntry } from '@/types';

function describe(entry: ActivityEntry): string {
  switch (entry.kind) {
    case 'created':
      return 'Application added';
    case 'status_changed':
      return `Status changed${entry.from ? ` from ${STATUS_LABELS[entry.from]}` : ''}${
        entry.to ? ` to ${STATUS_LABELS[entry.to]}` : ''
      }`;
    case 'updated':
      return entry.detail ?? 'Details updated';
    case 'interview_added':
      return `Interview scheduled${entry.detail ? ` for ${entry.detail}` : ''}`;
    case 'interview_removed':
      return `Interview removed${entry.detail ? ` (${entry.detail})` : ''}`;
    case 'task_added':
      return `Follow-up added${entry.detail ? `: ${entry.detail}` : ''}`;
    case 'task_completed':
      return `Follow-up completed${entry.detail ? `: ${entry.detail}` : ''}`;
    case 'task_reopened':
      return `Follow-up reopened${entry.detail ? `: ${entry.detail}` : ''}`;
    case 'task_removed':
      return `Follow-up removed${entry.detail ? `: ${entry.detail}` : ''}`;
    default:
      return 'Updated';
  }
}

export function TimelinePanel({ activity }: { activity: ActivityEntry[] }) {
  // Newest first, without mutating the stored order.
  const entries = [...activity].sort((a, b) => b.at.localeCompare(a.at));

  return (
    <Card>
      <CardHeader
        title="Activity"
        description="Everything CareerFlow has recorded for this application."
      />
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
              <p className="break-words text-sm text-ink">{describe(entry)}</p>
              <p className="text-xs text-ink-muted">{formatInstant(entry.at)}</p>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}
