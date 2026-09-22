import { useId, useState } from 'react';
import { ArrowDownAZ, ArrowUpAZ, Search, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Field';
import {
  DEFAULT_FILTERS,
  SORT_KEYS,
  SORT_LABELS,
  hasActiveFilters,
  toggleValue,
  type FilterState,
  type SortKey,
} from '@/lib/filters';
import {
  APPLICATION_STATUSES,
  EMPLOYMENT_TYPES,
  EMPLOYMENT_TYPE_LABELS,
  STATUS_LABELS,
  WORK_ARRANGEMENTS,
  WORK_ARRANGEMENT_LABELS,
} from '@/types';
import { cn } from '@/lib/cn';

function CheckboxGroup<T extends string>({
  legend,
  options,
  labels,
  selected,
  onToggle,
}: {
  legend: string;
  options: readonly T[];
  labels: Record<T, string>;
  selected: T[];
  onToggle: (value: T) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
        {legend}
      </legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const checked = selected.includes(option);
          return (
            <label
              key={option}
              className={cn(
                'inline-flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-1.5 text-sm transition-colors',
                checked
                  ? 'border-brand/30 bg-brand-soft text-brand'
                  : 'border-line bg-surface text-ink-muted hover:bg-surface-muted',
              )}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(option)}
                className="h-3.5 w-3.5 rounded border-line accent-brand"
              />
              {labels[option]}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export function FiltersBar({
  state,
  onChange,
  resultCount,
  totalCount,
}: {
  state: FilterState;
  onChange: (next: FilterState) => void;
  resultCount: number;
  totalCount: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const searchId = useId();
  const panelId = useId();
  const sortId = useId();

  const filtersActive = hasActiveFilters(state);
  const activeCount =
    state.statuses.length + state.arrangements.length + state.employmentTypes.length;

  return (
    <div className="mb-4 flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <label htmlFor={searchId} className="sr-only">
            Search by company or role
          </label>
          <Search
            className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
            aria-hidden="true"
          />
          <Input
            id={searchId}
            type="search"
            value={state.search}
            onChange={(event) => onChange({ ...state, search: event.target.value })}
            placeholder="Search company or role"
            className="ps-9"
          />
        </div>

        <Button
          variant={expanded || activeCount > 0 ? 'primary' : 'secondary'}
          onClick={() => setExpanded((open) => !open)}
          aria-expanded={expanded}
          aria-controls={panelId}
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          Filters
          {activeCount > 0 ? (
            <span className="ms-1 rounded-full bg-white/25 px-1.5 text-xs">{activeCount}</span>
          ) : null}
        </Button>

        <div className="flex items-center gap-2">
          <label htmlFor={sortId} className="sr-only">
            Sort by
          </label>
          <Select
            id={sortId}
            value={state.sortKey}
            onChange={(event) => onChange({ ...state, sortKey: event.target.value as SortKey })}
            className="w-auto"
          >
            {SORT_KEYS.map((key) => (
              <option key={key} value={key}>
                Sort: {SORT_LABELS[key]}
              </option>
            ))}
          </Select>

          <Button
            variant="secondary"
            onClick={() =>
              onChange({
                ...state,
                sortDirection: state.sortDirection === 'asc' ? 'desc' : 'asc',
              })
            }
            aria-label={`Sort ${state.sortDirection === 'asc' ? 'descending' : 'ascending'}`}
            title={state.sortDirection === 'asc' ? 'Ascending' : 'Descending'}
            className="w-10 px-0"
          >
            {state.sortDirection === 'asc' ? (
              <ArrowUpAZ className="h-4 w-4" aria-hidden="true" />
            ) : (
              <ArrowDownAZ className="h-4 w-4" aria-hidden="true" />
            )}
          </Button>
        </div>
      </div>

      {expanded ? (
        <div id={panelId} className="cf-card flex flex-col gap-4 p-4">
          <CheckboxGroup
            legend="Status"
            options={APPLICATION_STATUSES}
            labels={STATUS_LABELS}
            selected={state.statuses}
            onToggle={(value) => onChange({ ...state, statuses: toggleValue(state.statuses, value) })}
          />
          <CheckboxGroup
            legend="Work arrangement"
            options={WORK_ARRANGEMENTS}
            labels={WORK_ARRANGEMENT_LABELS}
            selected={state.arrangements}
            onToggle={(value) =>
              onChange({ ...state, arrangements: toggleValue(state.arrangements, value) })
            }
          />
          <CheckboxGroup
            legend="Employment type"
            options={EMPLOYMENT_TYPES}
            labels={EMPLOYMENT_TYPE_LABELS}
            selected={state.employmentTypes}
            onToggle={(value) =>
              onChange({ ...state, employmentTypes: toggleValue(state.employmentTypes, value) })
            }
          />
        </div>
      ) : null}

      <p className="text-sm text-ink-muted" role="status">
        Showing {resultCount} of {totalCount} applications
        {filtersActive ? (
          <>
            {' '}
            <button
              type="button"
              onClick={() =>
                onChange({
                  ...DEFAULT_FILTERS,
                  sortKey: state.sortKey,
                  sortDirection: state.sortDirection,
                })
              }
              className="inline-flex items-center gap-1 font-medium text-brand underline-offset-4 hover:underline"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              Clear filters
            </button>
          </>
        ) : null}
      </p>
    </div>
  );
}
