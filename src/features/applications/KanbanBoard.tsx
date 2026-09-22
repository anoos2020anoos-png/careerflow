import { Link } from 'react-router-dom';
import { Briefcase } from 'lucide-react';
import type { Application, ApplicationStatus } from '@/types';
import { APPLICATION_STATUSES, STATUS_LABELS, WORK_ARRANGEMENT_LABELS } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusSelect } from '@/features/applications/StatusSelect';
import { STATUS_TONES } from '@/lib/statusStyles';
import { formatDateOnly } from '@/lib/dates';
import { pluralize } from '@/lib/format';

/**
 * Applications grouped by status.
 *
 * Moving a card between columns uses the same `<select>` as the table. There is
 * deliberately no drag and drop: it would need a keyboard-accessible
 * alternative anyway, and the select already is one.
 */
export function KanbanBoard({
  applications,
  onStatusChange,
}: {
  applications: Application[];
  onStatusChange: (id: string, status: ApplicationStatus) => void;
}) {
  if (applications.length === 0) {
    return (
      <div className="cf-card">
        <EmptyState
          icon={Briefcase}
          title="Nothing to show on the board"
          description="No applications match the current search and filters."
        />
      </div>
    );
  }

  const columns = APPLICATION_STATUSES.map((status) => ({
    status,
    items: applications.filter((application) => application.status === status),
  }));

  return (
    <div className="cf-scroll -mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
      <div className="flex min-w-max gap-4">
        {columns.map((column) => (
          <section
            key={column.status}
            aria-labelledby={`kanban-${column.status}`}
            className="flex w-64 shrink-0 flex-col rounded-xl border border-line bg-surface-muted/50"
          >
            <header className="flex items-center justify-between gap-2 border-b border-line px-3 py-2.5">
              <h3
                id={`kanban-${column.status}`}
                className="flex items-center gap-2 text-sm font-semibold text-ink"
              >
                <Badge tone={STATUS_TONES[column.status]}>{STATUS_LABELS[column.status]}</Badge>
              </h3>
              <span className="text-xs text-ink-muted">
                {column.items.length} {pluralize(column.items.length, 'card')}
              </span>
            </header>

            <ul className="flex flex-1 flex-col gap-2 p-2">
              {column.items.length === 0 ? (
                <li className="rounded-lg border border-dashed border-line px-3 py-6 text-center text-xs text-ink-muted">
                  Empty
                </li>
              ) : (
                column.items.map((application) => (
                  <li key={application.id} className="rounded-lg border border-line bg-surface p-3">
                    <Link
                      to={`/applications/${application.id}`}
                      className="text-sm font-medium text-ink underline-offset-4 hover:text-brand hover:underline"
                    >
                      {application.jobTitle}
                    </Link>
                    <p className="text-xs text-ink-muted">{application.company}</p>

                    <p className="mt-2 flex flex-wrap gap-1">
                      <Badge>{WORK_ARRANGEMENT_LABELS[application.workArrangement]}</Badge>
                    </p>

                    <p className="mt-2 text-xs text-ink-muted">
                      Applied {formatDateOnly(application.appliedDate)}
                    </p>

                    <div className="mt-2.5 border-t border-line pt-2.5">
                      <StatusSelect
                        value={application.status}
                        onChange={(status) => onStatusChange(application.id, status)}
                        label={`Move ${application.jobTitle} at ${application.company} to another status`}
                        size="sm"
                        className="w-full"
                      />
                    </div>
                  </li>
                ))
              )}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
