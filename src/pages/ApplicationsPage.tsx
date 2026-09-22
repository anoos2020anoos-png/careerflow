import { useMemo, useState } from 'react';
import { KanbanSquare, Plus, Table2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ApplicationsList } from '@/features/applications/ApplicationsList';
import { ApplicationFormDialog } from '@/features/applications/ApplicationFormDialog';
import { FiltersBar } from '@/features/applications/FiltersBar';
import { KanbanBoard } from '@/features/applications/KanbanBoard';
import { useAppData } from '@/state/app-data-context';
import { DEFAULT_FILTERS, filterAndSortApplications, type FilterState } from '@/lib/filters';
import { emptyFormValues, toFormValues } from '@/lib/applications';
import { todayDateOnly } from '@/lib/dates';
import type { ApplicationFormValues } from '@/lib/schemas';
import type { Application } from '@/types';
import { cn } from '@/lib/cn';

type ViewMode = 'table' | 'kanban';

export function ApplicationsPage() {
  const { applications, addApplication, editApplication, removeApplication, setStatus } =
    useAppData();

  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [view, setView] = useState<ViewMode>('table');
  const [editing, setEditing] = useState<Application | null>(null);
  const [creating, setCreating] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Application | null>(null);

  const visible = useMemo(
    () => filterAndSortApplications(applications, filters),
    [applications, filters],
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
        title="Applications"
        description="Every role you are tracking. Search, filter and sort the list, or switch to the board to see progress by stage."
        actions={
          <>
            <div
              className="inline-flex rounded-lg border border-line bg-surface p-0.5"
              role="group"
              aria-label="View"
            >
              {(
                [
                  { id: 'table', label: 'Table', icon: Table2 },
                  { id: 'kanban', label: 'Board', icon: KanbanSquare },
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
              Add application
            </Button>
          </>
        }
      />

      <FiltersBar
        state={filters}
        onChange={setFilters}
        resultCount={visible.length}
        totalCount={applications.length}
      />

      {view === 'table' ? (
        <ApplicationsList
          applications={visible}
          onStatusChange={setStatus}
          onEdit={setEditing}
          onDelete={setPendingDelete}
          emptyTitle={
            applications.length === 0 ? 'No applications yet' : 'No applications match your filters'
          }
          emptyDescription={
            applications.length === 0
              ? 'Add the first role you are tracking, or restore the sample data from Settings.'
              : 'Try a different search term, or clear the filters to see everything again.'
          }
          emptyAction={
            applications.length === 0 ? (
              <Button variant="primary" onClick={() => setCreating(true)}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                Add application
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
        defaultValues={emptyFormValues(todayDateOnly())}
        onSubmit={handleCreate}
        onClose={() => setCreating(false)}
      />

      <ApplicationFormDialog
        open={editing !== null}
        mode="edit"
        defaultValues={editing ? toFormValues(editing) : emptyFormValues(todayDateOnly())}
        onSubmit={handleEdit}
        onClose={() => setEditing(null)}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this application?"
        description={
          pendingDelete
            ? `${pendingDelete.jobTitle} at ${pendingDelete.company}, along with its interviews, follow-ups and timeline.`
            : ''
        }
        confirmLabel="Delete"
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
}
