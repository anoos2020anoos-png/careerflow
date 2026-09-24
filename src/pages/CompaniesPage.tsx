import { useId, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Pencil, Search, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { ExternalLink } from '@/components/ui/ExternalLink';
import { Input, Select } from '@/components/ui/Field';
import { CompanyDetailsDialog } from '@/features/companies/CompanyDetailsDialog';
import { useAppData } from '@/state/app-data-context';
import { useT } from '@/i18n/i18n-context';
import { plural, sectorLabel, statusLabel } from '@/i18n/labels';
import { companyKey, summarizeCompanies, type CompanySummary } from '@/lib/companies';
import { formatDateOnly } from '@/lib/dates';
import { STATUS_TONES } from '@/lib/statusStyles';
import { describeUrl } from '@/lib/urls';
import { APPLICATION_STATUSES, COMPANY_SECTORS, type CompanySector } from '@/types';

type SectorFilter = 'all' | 'unset' | CompanySector;

function CompanyCard({
  summary,
  onEdit,
  onRemoveDetails,
}: {
  summary: CompanySummary;
  onEdit: () => void;
  onRemoveDetails: () => void;
}) {
  const t = useT();
  const headingId = useId();
  const count = summary.applications.length;
  const details = summary.details;

  return (
    <li className="cf-card flex flex-col gap-3 p-4" aria-labelledby={headingId}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id={headingId} className="break-words text-base font-semibold text-ink">
            {summary.name}
          </h2>
          <p className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-ink-muted">
            {details?.sector ? (
              <Badge tone="brand">{sectorLabel(t, details.sector)}</Badge>
            ) : (
              <span className="text-xs">{t('sector.unset')}</span>
            )}
            {details?.industry ? <span>{details.industry}</span> : null}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onEdit}
          aria-label={t('companies.editAria', { name: summary.name })}
          title={t('companies.edit')}
        >
          <Pencil className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>

      {count > 0 ? (
        <>
          <p className="text-sm text-ink">
            <span className="font-medium">
              {plural(t, count, 'companies.oneApplication', 'companies.applications')}
            </span>
            {summary.activeCount > 0 ? (
              <span className="text-ink-muted">
                {' · '}
                {t('companies.active', { count: summary.activeCount })}
              </span>
            ) : null}
            {summary.lastAppliedDate ? (
              <span className="block text-xs text-ink-muted">
                {t('companies.lastApplied', { date: formatDateOnly(summary.lastAppliedDate) })}
              </span>
            ) : null}
          </p>
          <ul className="flex flex-wrap gap-1.5" aria-label={t('filters.status')}>
            {APPLICATION_STATUSES.filter((status) => summary.statusCounts[status]).map(
              (status) => (
                <li key={status}>
                  <Badge tone={STATUS_TONES[status]}>
                    {statusLabel(t, status)} · {summary.statusCounts[status]}
                  </Badge>
                </li>
              ),
            )}
          </ul>
        </>
      ) : (
        <p className="text-sm text-ink-muted">{t('companies.noApplications')}</p>
      )}

      {details?.website ? (
        <p className="text-sm">
          <ExternalLink href={details.website}>{describeUrl(details.website)}</ExternalLink>
        </p>
      ) : null}

      {details?.notes ? (
        <p className="line-clamp-3 whitespace-pre-wrap break-words text-sm text-ink-muted">
          {details.notes}
        </p>
      ) : null}

      <div className="mt-auto flex flex-wrap gap-2 border-t border-line pt-3">
        {count > 0 ? (
          <Link
            to={`/applications?company=${encodeURIComponent(summary.key)}`}
            className="inline-flex items-center rounded-lg px-2.5 py-1.5 text-sm font-medium text-brand underline-offset-4 hover:underline"
          >
            {t('companies.viewApplications')}
          </Link>
        ) : null}
        {count === 0 && details ? (
          <Button variant="ghost" size="sm" onClick={onRemoveDetails} className="hover:text-danger">
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            {t('companies.removeDetails')}
          </Button>
        ) : null}
      </div>
    </li>
  );
}

export function CompaniesPage() {
  const { applications, companies, saveCompanyDetails, removeCompanyDetails } = useAppData();
  const t = useT();
  const searchId = useId();
  const sectorId = useId();

  const [search, setSearch] = useState('');
  const [sector, setSector] = useState<SectorFilter>('all');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [removingKey, setRemovingKey] = useState<string | null>(null);

  const summaries = useMemo(
    () => summarizeCompanies(applications, companies),
    [applications, companies],
  );

  const visible = useMemo(() => {
    const query = companyKey(search);
    return summaries.filter((summary) => {
      if (query && !summary.key.includes(query)) return false;
      if (sector === 'all') return true;
      if (sector === 'unset') return !summary.details?.sector;
      return summary.details?.sector === sector;
    });
  }, [summaries, search, sector]);

  const editing = editingKey ? (summaries.find((entry) => entry.key === editingKey) ?? null) : null;
  const removing = removingKey ? summaries.find((entry) => entry.key === removingKey) : undefined;

  return (
    <>
      <PageHeader title={t('companies.title')} description={t('companies.description')} />

      {summaries.length === 0 ? (
        <div className="cf-card">
          <EmptyState
            icon={Building2}
            title={t('companies.emptyTitle')}
            description={t('companies.emptyDesc')}
          />
        </div>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="relative min-w-0 flex-1 sm:max-w-xs">
              <label htmlFor={searchId} className="sr-only">
                {t('companies.searchLabel')}
              </label>
              <Search
                className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
                aria-hidden="true"
              />
              <Input
                id={searchId}
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t('companies.searchPlaceholder')}
                className="ps-9"
              />
            </div>
            <label htmlFor={sectorId} className="sr-only">
              {t('companies.sectorFilter')}
            </label>
            <Select
              id={sectorId}
              value={sector}
              onChange={(event) => setSector(event.target.value as SectorFilter)}
              className="w-auto"
            >
              <option value="all">{t('companies.allSectors')}</option>
              {COMPANY_SECTORS.map((value) => (
                <option key={value} value={value}>
                  {sectorLabel(t, value)}
                </option>
              ))}
              <option value="unset">{t('sector.unset')}</option>
            </Select>
          </div>

          <p className="mb-3 text-sm text-ink-muted" role="status">
            {plural(t, visible.length, 'companies.oneCompany', 'companies.count')}
          </p>

          {visible.length === 0 ? (
            <div className="cf-card">
              <EmptyState
                icon={Building2}
                title={t('companies.noMatchTitle')}
                description={t('companies.noMatchDesc')}
              />
            </div>
          ) : (
            <ul className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {visible.map((summary) => (
                <CompanyCard
                  key={summary.key}
                  summary={summary}
                  onEdit={() => setEditingKey(summary.key)}
                  onRemoveDetails={() => setRemovingKey(summary.key)}
                />
              ))}
            </ul>
          )}
        </>
      )}

      <CompanyDetailsDialog
        summary={editing}
        allCompanies={summaries}
        onSave={saveCompanyDetails}
        onClose={() => setEditingKey(null)}
      />

      <ConfirmDialog
        open={removing !== undefined}
        title={t('companies.removeDetailsTitle', { name: removing?.name ?? '' })}
        description={t('companies.removeDetailsDesc')}
        confirmLabel={t('companies.removeDetails')}
        destructive
        onConfirm={() => {
          if (removingKey) removeCompanyDetails(removingKey);
          setRemovingKey(null);
        }}
        onCancel={() => setRemovingKey(null)}
      />
    </>
  );
}
