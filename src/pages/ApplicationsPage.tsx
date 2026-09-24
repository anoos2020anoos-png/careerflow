import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { KanbanSquare, Plus, Table2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ApplicationsList } from '@/features/applications/ApplicationsList';
import { ApplicationFormDialog } from '@/features/applications/ApplicationFormDialog';
import { FiltersBar } from '@/features/applications/FiltersBar';
import { KanbanBoard } from '@/features/applications/KanbanBoard';
import { useAppData } from '@/state/app-data-context';
import { useT } from '@/i18n/i18n-context';
import { DEFAULT_FILTERS, filterAndSortApplications, type FilterState } from '@/lib/filters';
import { emptyFormValues, salaryDefaultsFor, toFormValues } from '@/lib/applications';
import { companyKey, companyNames } from '@/lib/companies';
import { todayDateOnly } from '@/lib/dates';
import type { ApplicationFormValues } from '@/lib/schemas';
import type { Application } from '@/types';
import { cn } from '@/lib/cn';

type ViewMode = 'table' | 'kanban';

export function ApplicationsPage() {
  const {
    applications,
    addApplication,
    editApplication,
    removeApplication,
    setStatus,
    profile,
    companies,
  } = useAppData();
  const t = useT();

  // The company filter is part of the URL, so "View applications" on the
  // Companies page is a real link: it survives a refresh and can be bookmarked.
  const [searchParams, setSearchParams] = useSearchParams();
  const companyParam = searchParams.get('company');

  const [filters, setFilters] = useState<FilterState>(() => ({
    ...DEFAULT_FILTERS,
    company: companyParam,
  }));

  useEffect(() => {
    setFilters((current) =>
      current.company === companyParam ? current : { ...current, company: companyParam },
    );
  }, [companyParam]);

  const changeFilters = (next: FilterState) => {
    setFilters(next);
    if (next.company !== companyParam) {
      const params = new URLSearchParams(searchParams);
      if (next.company === null) params.delete('company');
      else params.set('company', next.company);
      setSearchParams(params, { replace: true });
    }
  };

  const companyName = useMemo(() => {
    if (filters.company === null) return undefined;
    const match = applications.find(
      (application) => companyKey(application.company) === filters.company,
    );
    return (
      match?.company ?? companies.find((entry) => entry.key === filters.company)?.name
    );
  }, [applications, companies, filters.company]);

  const suggestions = useMemo(() => companyNames(applications), [applications]);
  const blankForm = () => emptyFormValues(todayDateOnly(), salaryDefaultsFor(profile));
  const [view, setView] = useState<ViewMode>('table');
  const [editing, setEditing] = useState<Application | null>(null);
  const [creating, setCreating] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Application | null>(null);

  const visible = useMemo(
    () =>
      filterAndSortApplications(applications, filters, {
        salaryExpectation: profile.salaryExpectation,
        companies,
      }),
    [applications, filters, profile.salaryExpectation, companies],
  );

  const handleCreate = (values: ApplicationFormValues) => {
    addApplication(values);
    setCreating(false);
  };

  const handleEdit = (values: ApplicationFormValues) => {
    if (!editing) return;
    editApplication(editing.id, values);
    setEditing(null);
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    removeApplication(pendingDelete.id);
    setPendingDelete(null);
  };

  return (
    <>
      <PageHeader
        title={t('applications.title')}
        description={t('applications.description')}
        actions={
          <>
            <div
              className="inline-flex rounded-lg border border-line bg-surface p-0.5"
              role="group"
              aria-label={t('applications.view')}
            >
              {(
                [
                  { id: 'table', label: t('applications.viewTable'), icon: Table2 },
                  { id: 'kanban', label: t('applications.viewBoard'), icon: KanbanSquare },
                ] as const
              ).map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setView(option.id)}
                  aria-pressed={view === option.id}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                    view === option.id
                      ? 'bg-brand-soft text-brand'
                      : 'text-ink-muted hover:text-ink',
                  )}
                >
                  <option.icon className="h-4 w-4" aria-hidden="true" />
                  {option.label}
                </button>
              ))}
            </div>

            <Button variant="primary" onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              {t('action.addApplication')}
            </Button>
          </>
        }
      />

      <FiltersBar
        state={filters}
        onChange={changeFilters}
        resultCount={visible.length}
        totalCount={applications.length}
        hasSalaryExpectation={profile.salaryExpectation !== undefined}
        companyName={companyName}
      />

      {view === 'table' ? (
        <ApplicationsList
          applications={visible}
          onStatusChange={setStatus}
          onEdit={setEditing}
          onDelete={setPendingDelete}
          salaryExpectation={profile.salaryExpectation}
          emptyTitle={
            applications.length === 0
              ? t('applications.emptyTitle')
              : t('applications.emptyFiltered')
          }
          emptyDescription={
            applications.length === 0
              ? t('applications.emptyDesc')
              : t('applications.emptyFilteredDesc')
          }
          emptyAction={
            applications.length === 0 ? (
              <Button variant="primary" onClick={() => setCreating(true)}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                {t('action.addApplication')}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <KanbanBoard applications={visible} onStatusChange={setStatus} />
      )}

      <ApplicationFormDialog
        open={creating}
        mode="create"
        defaultValues={blankForm()}
        onSubmit={handleCreate}
        onClose={() => setCreating(false)}
        companySuggestions={suggestions}
      />

      <ApplicationFormDialog
        open={editing !== null}
        mode="edit"
        defaultValues={editing ? toFormValues(editing) : blankForm()}
        onSubmit={handleEdit}
        onClose={() => setEditing(null)}
        companySuggestions={suggestions}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        title={t('applications.deleteTitle')}
        description={
          pendingDelete
            ? t('applications.deleteDesc', {
                title: pendingDelete.jobTitle,
                company: pendingDelete.company,
              })
            : ''
        }
        confirmLabel={t('action.delete')}
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
}
