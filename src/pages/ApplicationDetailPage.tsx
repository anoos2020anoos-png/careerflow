import { useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Briefcase, CalendarDays, MapPin, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { ExternalLink } from '@/components/ui/ExternalLink';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Badge } from '@/components/ui/Badge';
import { ApplicationFormDialog } from '@/features/applications/ApplicationFormDialog';
import { StatusSelect } from '@/features/applications/StatusSelect';
import { InterviewsPanel } from '@/features/detail/InterviewsPanel';
import { TasksPanel } from '@/features/detail/TasksPanel';
import { TimelinePanel } from '@/features/detail/TimelinePanel';
import { NotesPanel } from '@/features/detail/NotesPanel';
import { RequirementsPanel } from '@/features/detail/RequirementsPanel';
import { useAppData } from '@/state/app-data-context';
import { useT } from '@/i18n/i18n-context';
import { arrangementLabel, employmentLabel, relativeDay, salaryLabels } from '@/i18n/labels';
import { emptyFormValues, toFormValues } from '@/lib/applications';
import { formatDateOnly, formatInstant, todayDateOnly } from '@/lib/dates';
import { formatSalaryRange } from '@/lib/format';
import { describeUrl } from '@/lib/urls';

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-2 sm:flex-row sm:gap-4 sm:py-1.5">
      <dt className="w-40 shrink-0 text-sm text-ink-muted">{label}</dt>
      <dd className="min-w-0 break-words text-sm text-ink">{children}</dd>
    </div>
  );
}

export function ApplicationDetailPage() {
  const { applicationId } = useParams<{ applicationId: string }>();
  const navigate = useNavigate();
  const {
    getApplication,
    editApplication,
    removeApplication,
    setStatus,
    setNotes,
    addInterview,
    removeInterview,
    addTask,
    toggleTask,
    removeTask,
    addRequirement,
    toggleRequirement,
    removeRequirement,
  } = useAppData();

  const t = useT();
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const application = applicationId ? getApplication(applicationId) : undefined;

  if (!application) {
    return (
      <div className="cf-card">
        <EmptyState
          icon={Briefcase}
          title={t('detail.notFound')}
          description={t('detail.notFoundDesc')}
          action={
            <Button variant="primary" onClick={() => navigate('/applications')}>
              {t('detail.backButton')}
            </Button>
          }
        />
      </div>
    );
  }

  const salary = formatSalaryRange(
    application.salaryMin,
    application.salaryMax,
    application.salaryCurrency,
    salaryLabels(t),
  );
  const today = todayDateOnly();

  return (
    <>
      <Link
        to="/applications"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {t('detail.back')}
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
              {application.jobTitle}
            </h1>
            <StatusBadge status={application.status} />
          </div>
          <p className="mt-1 text-sm text-ink-muted">
            {application.company}
            {application.location ? ` · ${application.location}` : ''}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <StatusSelect
            value={application.status}
            onChange={(status) => setStatus(application.id, status)}
            label={t('applications.statusAria', {
              title: application.jobTitle,
              company: application.company,
            })}
          />
          <Button onClick={() => setEditing(true)}>
            <Pencil className="h-4 w-4" aria-hidden="true" />
            {t('action.edit')}
          </Button>
          <Button
            variant="secondary"
            onClick={() => setConfirmingDelete(true)}
            className="text-danger hover:bg-danger-soft"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            {t('action.delete')}
          </Button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="flex flex-col gap-5 lg:col-span-2">
          <Card>
            <CardHeader title={t('detail.roleDetails')} />
            <CardBody>
              <dl className="divide-y divide-line sm:divide-y-0">
                <DetailRow label={t('form.company')}>{application.company}</DetailRow>
                <DetailRow label={t('form.jobTitle')}>{application.jobTitle}</DetailRow>
                <DetailRow label={t('form.location')}>
                  {application.location ? (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-ink-muted" aria-hidden="true" />
                      {application.location}
                    </span>
                  ) : (
                    t('common.none')
                  )}
                </DetailRow>
                <DetailRow label={t('detail.arrangement')}>
                  <span className="flex flex-wrap gap-1.5">
                    <Badge>{arrangementLabel(t, application.workArrangement)}</Badge>
                    <Badge>{employmentLabel(t, application.employmentType)}</Badge>
                  </span>
                </DetailRow>
                <DetailRow label={t('detail.salary')}>{salary ?? t('common.notRecorded')}</DetailRow>
                <DetailRow label={t('detail.posting')}>
                  {application.jobUrl ? (
                    <ExternalLink href={application.jobUrl}>
                      {describeUrl(application.jobUrl)}
                    </ExternalLink>
                  ) : (
                    t('common.none')
                  )}
                </DetailRow>
                <DetailRow label={t('form.appliedDate')}>
                  {formatDateOnly(application.appliedDate)}
                </DetailRow>
                <DetailRow label={t('form.followUp')}>
                  {application.nextFollowUpDate ? (
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5 text-ink-muted" aria-hidden="true" />
                      {formatDateOnly(application.nextFollowUpDate)}
                      <span className="text-ink-muted">
                        ({relativeDay(t, application.nextFollowUpDate, today)})
                      </span>
                    </span>
                  ) : (
                    t('common.none')
                  )}
                </DetailRow>
                <DetailRow label={t('detail.updated')}>{formatInstant(application.updatedAt)}</DetailRow>
              </dl>
            </CardBody>
          </Card>

          <NotesPanel
            notes={application.notes}
            onSave={(value) => setNotes(application.id, value)}
          />

          <RequirementsPanel
            requirements={application.requirements}
            onAdd={(values) => addRequirement(application.id, values)}
            onToggle={(requirementId) => toggleRequirement(application.id, requirementId)}
            onRemove={(requirementId) => removeRequirement(application.id, requirementId)}
          />

          <InterviewsPanel
            interviews={application.interviews}
            onAdd={(values) => addInterview(application.id, values)}
            onRemove={(interviewId) => removeInterview(application.id, interviewId)}
          />
        </div>

        <div className="flex flex-col gap-5">
          <TasksPanel
            tasks={application.tasks}
            onAdd={(values) => addTask(application.id, values)}
            onToggle={(taskId) => toggleTask(application.id, taskId)}
            onRemove={(taskId) => removeTask(application.id, taskId)}
          />
          <TimelinePanel activity={application.activity} />
        </div>
      </div>

      <ApplicationFormDialog
        open={editing}
        mode="edit"
        defaultValues={editing ? toFormValues(application) : emptyFormValues(today)}
        onSubmit={(values) => {
          editApplication(application.id, values);
          setEditing(false);
        }}
        onClose={() => setEditing(false)}
      />

      <ConfirmDialog
        open={confirmingDelete}
        title={t('applications.deleteTitle')}
        description={t('applications.deleteDesc', {
          title: application.jobTitle,
          company: application.company,
        })}
        confirmLabel={t('action.delete')}
        destructive
        onConfirm={() => {
          removeApplication(application.id);
          navigate('/applications');
        }}
        onCancel={() => setConfirmingDelete(false)}
      />
    </>
  );
}
