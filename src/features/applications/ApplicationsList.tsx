import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, MapPin, Pencil, Trash2 } from 'lucide-react';
import type { Application, ApplicationStatus, SalaryExpectation } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusSelect } from '@/features/applications/StatusSelect';
import { formatDateOnly, formatInstant } from '@/lib/dates';
import { useT } from '@/i18n/i18n-context';
import type { Translate } from '@/i18n/i18n-context';
import { arrangementLabel, employmentLabel, salaryText } from '@/i18n/labels';
import { compareToExpectation } from '@/lib/salary';

export interface ApplicationsListProps {
  applications: Application[];
  onStatusChange: (id: string, status: ApplicationStatus) => void;
  onEdit: (application: Application) => void;
  onDelete: (application: Application) => void;
  emptyAction?: ReactNode;
  emptyTitle: string;
  emptyDescription: string;
  /** When set, each salary gets a short "meets / below" marker. */
  salaryExpectation?: SalaryExpectation;
}

/**
 * A compact marker for the list. Only the two definite outcomes get one; "not
 * compared" cases are explained on the detail page instead, since a badge for
 * them would be noise on every row in another currency.
 */
function SalaryMarker({
  t,
  application,
  expectation,
}: {
  t: Translate;
  application: Application;
  expectation: SalaryExpectation | undefined;
}) {
  if (!expectation) return null;
  const comparison = compareToExpectation(application, expectation);
  if (comparison.kind === 'above' || comparison.kind === 'within') {
    return <Badge tone="success">{t('salaryBadge.meets')}</Badge>;
  }
  if (comparison.kind === 'below') {
    return <Badge tone="warning">{t('salaryBadge.below')}</Badge>;
  }
  return null;
}

export function ApplicationsList({
  applications,
  onStatusChange,
  onEdit,
  onDelete,
  emptyAction,
  emptyTitle,
  emptyDescription,
  salaryExpectation,
}: ApplicationsListProps) {
  const t = useT();

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
            {t('applications.caption')}
          </caption>
          <thead>
            <tr className="border-b border-line bg-surface-muted/60 text-start">
              <th scope="col" className="px-4 py-3 font-medium text-ink-muted">
                {t('applications.colRole')}
              </th>
              <th scope="col" className="px-4 py-3 font-medium text-ink-muted">
                {t('applications.colLocation')}
              </th>
              <th scope="col" className="px-4 py-3 font-medium text-ink-muted">
                {t('applications.colApplied')}
              </th>
              <th scope="col" className="px-4 py-3 font-medium text-ink-muted">
                {t('applications.colStatus')}
              </th>
              <th scope="col" className="px-4 py-3 font-medium text-ink-muted">
                {t('applications.colUpdated')}
              </th>
              <th scope="col" className="px-4 py-3 text-end font-medium text-ink-muted">
                {t('applications.colActions')}
              </th>
            </tr>
          </thead>
          <tbody>
            {applications.map((application) => {
              const salary = salaryText(t, application);
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
                    {salary ? (
                      <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-ink-muted">
                        <span>{salary}</span>
                        <SalaryMarker
                          t={t}
                          application={application}
                          expectation={salaryExpectation}
                        />
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 align-top text-ink-muted">
                    <p>{application.location || t('common.none')}</p>
                    <p className="mt-1 flex flex-wrap gap-1">
                      <Badge>{arrangementLabel(t, application.workArrangement)}</Badge>
                      <Badge>{employmentLabel(t, application.employmentType)}</Badge>
                    </p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 align-top text-ink-muted">
                    {formatDateOnly(application.appliedDate)}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <StatusSelect
                      value={application.status}
                      onChange={(status) => onStatusChange(application.id, status)}
                      label={t('applications.statusAria', {
                        title: application.jobTitle,
                        company: application.company,
                      })}
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
                        aria-label={t('applications.editAria', {
                          title: application.jobTitle,
                          company: application.company,
                        })}
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(application)}
                        aria-label={t('applications.deleteAria', {
                          title: application.jobTitle,
                          company: application.company,
                        })}
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
          const salary = salaryText(t, application);
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
                    aria-label={t('applications.editAria', {
                          title: application.jobTitle,
                          company: application.company,
                        })}
                  >
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(application)}
                    aria-label={t('applications.deleteAria', {
                          title: application.jobTitle,
                          company: application.company,
                        })}
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
                <Badge>{arrangementLabel(t, application.workArrangement)}</Badge>
                <Badge>{employmentLabel(t, application.employmentType)}</Badge>
                {salary ? <Badge>{salary}</Badge> : null}
                <SalaryMarker t={t} application={application} expectation={salaryExpectation} />
              </div>

              <div className="mt-3 flex items-center justify-between gap-3 border-t border-line pt-3">
                <span className="text-xs text-ink-muted">
                  {t('applications.appliedOn', {
                    date: formatDateOnly(application.appliedDate),
                  })}
                </span>
                <StatusSelect
                  value={application.status}
                  onChange={(status) => onStatusChange(application.id, status)}
                  label={t('applications.statusAria', {
                        title: application.jobTitle,
                        company: application.company,
                      })}
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
