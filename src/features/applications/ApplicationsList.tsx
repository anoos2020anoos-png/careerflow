import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, MapPin, Pencil, Trash2 } from 'lucide-react';
import type { Application, ApplicationStatus } from '@/types';
import { EMPLOYMENT_TYPE_LABELS, WORK_ARRANGEMENT_LABELS } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusSelect } from '@/features/applications/StatusSelect';
import { formatDateOnly, formatInstant } from '@/lib/dates';
import { formatSalaryRange } from '@/lib/format';

export interface ApplicationsListProps {
  applications: Application[];
  onStatusChange: (id: string, status: ApplicationStatus) => void;
  onEdit: (application: Application) => void;
  onDelete: (application: Application) => void;
  emptyAction?: ReactNode;
  emptyTitle: string;
  emptyDescription: string;
}

export function ApplicationsList({
  applications,
  onStatusChange,
  onEdit,
  onDelete,
  emptyAction,
  emptyTitle,
  emptyDescription,
}: ApplicationsListProps) {
  if (applications.length === 0) {
    return (
      <div className="cf-card">
        <EmptyState
          icon={Briefcase}
          title={emptyTitle}
          description={emptyDescription}
          action={emptyAction}
        />
      </div>
    );
  }

  return (
    <>
      {/* Table for wide screens */}
      <div className="cf-card hidden overflow-hidden md:block">
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">
            Job applications, with status, dates and actions for each row
          </caption>
          <thead>
            <tr className="border-b border-line bg-surface-muted/60 text-left">
              <th scope="col" className="px-4 py-3 font-medium text-ink-muted">
                Role
              </th>
              <th scope="col" className="px-4 py-3 font-medium text-ink-muted">
                Location
              </th>
              <th scope="col" className="px-4 py-3 font-medium text-ink-muted">
                Applied
              </th>
              <th scope="col" className="px-4 py-3 font-medium text-ink-muted">
                Status
              </th>
              <th scope="col" className="px-4 py-3 font-medium text-ink-muted">
                Updated
              </th>
              <th scope="col" className="px-4 py-3 text-right font-medium text-ink-muted">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {applications.map((application) => {
              const salary = formatSalaryRange(
                application.salaryMin,
                application.salaryMax,
                application.salaryCurrency,
              );
              return (
                <tr
                  key={application.id}
                  className="border-b border-line last:border-b-0 hover:bg-surface-muted/40"
                >
                  <td className="px-4 py-3 align-top">
                    <Link
                      to={`/applications/${application.id}`}
                      className="font-medium text-ink underline-offset-4 hover:text-brand hover:underline"
                    >
                      {application.jobTitle}
                    </Link>
                    <p className="text-ink-muted">{application.company}</p>
                    {salary ? <p className="mt-0.5 text-xs text-ink-muted">{salary}</p> : null}
                  </td>
                  <td className="px-4 py-3 align-top text-ink-muted">
                    <p>{application.location || '—'}</p>
                    <p className="mt-1 flex flex-wrap gap-1">
                      <Badge>{WORK_ARRANGEMENT_LABELS[application.workArrangement]}</Badge>
                      <Badge>{EMPLOYMENT_TYPE_LABELS[application.employmentType]}</Badge>
                    </p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 align-top text-ink-muted">
                    {formatDateOnly(application.appliedDate)}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <StatusSelect
                      value={application.status}
                      onChange={(status) => onStatusChange(application.id, status)}
                      label={`Status for ${application.jobTitle} at ${application.company}`}
                      size="sm"
                    />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 align-top text-xs text-ink-muted">
                    {formatInstant(application.updatedAt)}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(application)}
                        aria-label={`Edit ${application.jobTitle} at ${application.company}`}
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(application)}
                        aria-label={`Delete ${application.jobTitle} at ${application.company}`}
                        className="hover:text-danger"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Cards for narrow screens, where a six-column table would be cramped */}
      <ul className="flex flex-col gap-3 md:hidden">
        {applications.map((application) => {
          const salary = formatSalaryRange(
            application.salaryMin,
            application.salaryMax,
            application.salaryCurrency,
          );
          return (
            <li key={application.id} className="cf-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    to={`/applications/${application.id}`}
                    className="font-medium text-ink underline-offset-4 hover:text-brand hover:underline"
                  >
                    {application.jobTitle}
                  </Link>
                  <p className="text-sm text-ink-muted">{application.company}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(application)}
                    aria-label={`Edit ${application.jobTitle} at ${application.company}`}
                  >
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(application)}
                    aria-label={`Delete ${application.jobTitle} at ${application.company}`}
                    className="hover:text-danger"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              </div>

              {application.location ? (
                <p className="mt-2 flex items-center gap-1.5 text-sm text-ink-muted">
                  <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                  {application.location}
                </p>
              ) : null}

              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge>{WORK_ARRANGEMENT_LABELS[application.workArrangement]}</Badge>
                <Badge>{EMPLOYMENT_TYPE_LABELS[application.employmentType]}</Badge>
                {salary ? <Badge>{salary}</Badge> : null}
              </div>

              <div className="mt-3 flex items-center justify-between gap-3 border-t border-line pt-3">
                <span className="text-xs text-ink-muted">
                  Applied {formatDateOnly(application.appliedDate)}
                </span>
                <StatusSelect
                  value={application.status}
                  onChange={(status) => onStatusChange(application.id, status)}
                  label={`Status for ${application.jobTitle} at ${application.company}`}
                  size="sm"
                />
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
