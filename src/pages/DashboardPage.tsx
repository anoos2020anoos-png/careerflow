import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Award, Briefcase, CalendarClock, Plus, TrendingUp } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatCard } from '@/features/dashboard/StatCard';
import { ActivityChart } from '@/features/dashboard/ActivityChart';
import { StatusChart } from '@/features/dashboard/StatusChart';
import { OpenTasksCard, UpcomingInterviewsCard } from '@/features/dashboard/UpcomingPanel';
import { OutcomesCard } from '@/features/dashboard/OutcomesCard';
import { useAppData } from '@/state/app-data-context';
import { useI18n } from '@/i18n/i18n-context';
import { computeDashboardMetrics } from '@/lib/metrics';
import { computeOutcomeStats } from '@/lib/outcomes';

export function DashboardPage() {
  const { applications } = useAppData();
  const { t, locale } = useI18n();
  // `locale` is a dependency because the activity buckets carry a formatted
  // date label, which has to be rebuilt when the language changes.
  const metrics = useMemo(
    () => computeDashboardMetrics(applications),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [applications, locale],
  );
  const outcomes = useMemo(() => computeOutcomeStats(applications), [applications]);

  if (applications.length === 0) {
    return (
      <>
        <PageHeader
          title={t('dashboard.title')}
          description={t('dashboard.descriptionEmpty')}
        />
        <div className="cf-card">
          <EmptyState
            icon={Briefcase}
            title={t('dashboard.emptyTitle')}
            description={t('dashboard.emptyDescription')}
            action={
              <Link to="/applications">
                <Button variant="primary">
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  {t('dashboard.addFirst')}
                </Button>
              </Link>
            }
          />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={t('dashboard.title')}
        description={t('dashboard.description')}
        actions={
          <Link to="/applications">
            <Button variant="primary">
              <Plus className="h-4 w-4" aria-hidden="true" />
              {t('action.addApplication')}
            </Button>
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t('dashboard.total')}
          value={metrics.total}
          definition={t('dashboard.totalDef')}
          icon={Briefcase}
        />
        <StatCard
          label={t('dashboard.active')}
          value={metrics.active}
          definition={t('dashboard.activeDef')}
          icon={TrendingUp}
        />
        <StatCard
          label={t('dashboard.upcoming')}
          value={metrics.upcomingInterviews}
          definition={t('dashboard.upcomingDef')}
          icon={CalendarClock}
        />
        <StatCard
          label={t('dashboard.offers')}
          value={metrics.offers}
          definition={t('dashboard.offersDef')}
          icon={Award}
        />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <ActivityChart data={metrics.activity} />
        <StatusChart data={metrics.statusBreakdown} />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <UpcomingInterviewsCard items={metrics.upcomingInterviewList} />
        <OpenTasksCard items={metrics.openTaskList} />
      </div>

      <div className="mt-5">
        <OutcomesCard stats={outcomes} />
      </div>
    </>
  );
}
