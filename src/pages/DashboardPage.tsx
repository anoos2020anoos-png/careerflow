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
import { useAppData } from '@/state/app-data-context';
import { computeDashboardMetrics } from '@/lib/metrics';

export function DashboardPage() {
  const { applications } = useAppData();
  const metrics = useMemo(() => computeDashboardMetrics(applications), [applications]);

  if (applications.length === 0) {
    return (
      <>
        <PageHeader
          title="Dashboard"
          description="A summary of your job search, calculated from the applications you have saved."
        />
        <div className="cf-card">
          <EmptyState
            icon={Briefcase}
            title="No applications yet"
            description="Add your first application and this dashboard will fill in: totals, weekly activity, status breakdown, interviews and follow-ups. You can also restore the sample data from Settings."
            action={
              <Link to="/applications">
                <Button variant="primary">
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Add an application
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
        title="Dashboard"
        description="A summary of your job search, calculated from the applications saved in this browser."
        actions={
          <Link to="/applications">
            <Button variant="primary">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add application
            </Button>
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total applications"
          value={metrics.total}
          definition="Every record saved, whatever its status."
          icon={Briefcase}
        />
        <StatCard
          label="Active"
          value={metrics.active}
          definition="Still in play: Applied, Screening, Interview or Offer."
          icon={TrendingUp}
        />
        <StatCard
          label="Upcoming interviews"
          value={metrics.upcomingInterviews}
          definition="Interviews dated today or later, on applications still in play."
          icon={CalendarClock}
        />
        <StatCard
          label="Offers"
          value={metrics.offers}
          definition="Applications currently at the Offer status."
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
    </>
  );
}
