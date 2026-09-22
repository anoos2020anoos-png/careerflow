import { Activity, Clock, Info } from 'lucide-react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { rate, USEFUL_SAMPLE_SIZE, type OutcomeStats } from '@/lib/outcomes';
import { pluralize } from '@/lib/format';

function Row({
  label,
  count,
  total,
  definition,
}: {
  label: string;
  count: number;
  total: number;
  definition: string;
}) {
  const percentage = rate(count, total);
  const width = percentage ?? 0;

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="text-sm font-medium text-ink">{label}</span>
        <span className="text-sm tabular-nums text-ink-muted">
          <strong className="font-semibold text-ink">
            {count} of {total}
          </strong>
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
  if (stats.submitted === 0) {
    return (
      <Card>
        <CardHeader
          title="Your track record"
          description="Counted from applications you have actually sent."
        />
        <EmptyState
          icon={Activity}
          title="Nothing sent yet"
          description="Once you move an application past Saved, this card starts counting replies, interviews and offers from your own history."
        />
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title="Your track record"
        description={`Counted from the ${stats.submitted} ${pluralize(
          stats.submitted,
          'application',
        )} you have actually sent. These are your own past results, not a prediction about any particular role.`}
      />

      <CardBody className="flex flex-col gap-5">
        <Row
          label="Got a reply"
          count={stats.responded}
          total={stats.submitted}
          definition="Reached Screening, Interview, Offer or Rejected. A rejection is still a reply."
        />
        <Row
          label="Reached an interview"
          count={stats.interviewed}
          total={stats.submitted}
          definition="Reached Interview or Offer at any point, even if it ended in a rejection later."
        />
        <Row
          label="Reached an offer"
          count={stats.offered}
          total={stats.submitted}
          definition="Reached the Offer status at any point."
        />

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-line pt-4">
          <span className="flex items-center gap-2 text-sm text-ink-muted">
            <Clock className="h-4 w-4" aria-hidden="true" />
            {stats.medianDaysToFirstResponse === null ? (
              'No replies yet, so there is no typical wait to report.'
            ) : (
              <>
                Typical wait for a first reply:{' '}
                <strong className="font-semibold text-ink">
                  {stats.medianDaysToFirstResponse}{' '}
                  {pluralize(stats.medianDaysToFirstResponse, 'day')}
                </strong>{' '}
                <span className="text-ink-muted">(median)</span>
              </>
            )}
          </span>

          {stats.awaitingResponse > 0 ? (
            <span className="text-sm text-ink-muted">
              <strong className="font-semibold text-ink">{stats.awaitingResponse}</strong> still
              waiting
            </span>
          ) : null}
        </div>

        {stats.hasUsefulSample ? null : (
          <p className="flex items-start gap-2 rounded-lg bg-surface-muted px-3 py-2 text-xs leading-relaxed text-ink-muted">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>
              Under {USEFUL_SAMPLE_SIZE} applications, these percentages swing wildly with every
              new record. The counts are accurate; the rates are not worth reading yet.
            </span>
          </p>
        )}
      </CardBody>
    </Card>
  );
}
