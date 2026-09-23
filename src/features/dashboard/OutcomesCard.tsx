import { Activity, Clock, Info } from 'lucide-react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { useT } from '@/i18n/i18n-context';
import { plural } from '@/i18n/labels';
import { rate, USEFUL_SAMPLE_SIZE, type OutcomeStats } from '@/lib/outcomes';

function Row({
  label,
  count,
  total,
  definition,
  countLabel,
}: {
  label: string;
  count: number;
  total: number;
  definition: string;
  countLabel: string;
}) {
  const percentage = rate(count, total);
  const width = percentage ?? 0;

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="text-sm font-medium text-ink">{label}</span>
        <span className="text-sm tabular-nums text-ink-muted">
          <strong className="font-semibold text-ink">{countLabel}</strong>
          {percentage === null ? null : <span className="ms-2">{percentage}%</span>}
        </span>
      </div>

      <div
        className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-muted"
        aria-hidden="true"
      >
        <div className="h-full rounded-full bg-brand" style={{ width: `${width}%` }} />
      </div>

      <p className="mt-1 text-xs leading-relaxed text-ink-muted">{definition}</p>
    </div>
  );
}

/**
 * The honest version of "what are my chances": counts from this person's own
 * history, never a prediction. Each figure keeps its denominator beside it, so
 * a rate built on four applications is visibly a rate built on four
 * applications.
 */
export function OutcomesCard({ stats }: { stats: OutcomeStats }) {
  const t = useT();

  if (stats.submitted === 0) {
    return (
      <Card>
        <CardHeader title={t('outcomes.title')} description={t('outcomes.emptyDesc')} />
        <EmptyState
          icon={Activity}
          title={t('outcomes.emptyTitle')}
          description={t('outcomes.emptyBody')}
        />
      </Card>
    );
  }

  const ofTotal = (count: number) =>
    t('outcomes.ofTotal', { count, total: stats.submitted });

  return (
    <Card>
      <CardHeader
        title={t('outcomes.title')}
        description={t('outcomes.description', { count: stats.submitted })}
      />

      <CardBody className="flex flex-col gap-5">
        <Row
          label={t('outcomes.replied')}
          count={stats.responded}
          total={stats.submitted}
          countLabel={ofTotal(stats.responded)}
          definition={t('outcomes.repliedDef')}
        />
        <Row
          label={t('outcomes.interviewed')}
          count={stats.interviewed}
          total={stats.submitted}
          countLabel={ofTotal(stats.interviewed)}
          definition={t('outcomes.interviewedDef')}
        />
        <Row
          label={t('outcomes.offered')}
          count={stats.offered}
          total={stats.submitted}
          countLabel={ofTotal(stats.offered)}
          definition={t('outcomes.offeredDef')}
        />

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-line pt-4">
          <span className="flex items-center gap-2 text-sm text-ink-muted">
            <Clock className="h-4 w-4" aria-hidden="true" />
            {stats.medianDaysToFirstResponse === null ? (
              t('outcomes.noWait')
            ) : (
              <>
                {t('outcomes.wait')}{' '}
                <strong className="font-semibold text-ink">
                  {plural(
                    t,
                    stats.medianDaysToFirstResponse,
                    'outcomes.oneDay',
                    'outcomes.days',
                  )}
                </strong>{' '}
                <span className="text-ink-muted">{t('outcomes.median')}</span>
              </>
            )}
          </span>

          {stats.awaitingResponse > 0 ? (
            <span className="text-sm font-medium text-ink">
              {t('outcomes.waiting', { count: stats.awaitingResponse })}
            </span>
          ) : null}
        </div>

        {stats.hasUsefulSample ? null : (
          <p className="flex items-start gap-2 rounded-lg bg-surface-muted px-3 py-2 text-xs leading-relaxed text-ink-muted">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{t('outcomes.smallSample', { threshold: USEFUL_SAMPLE_SIZE })}</span>
          </p>
        )}
      </CardBody>
    </Card>
  );
}
