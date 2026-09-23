import type {
  Application,
  ApplicationStatus,
  FollowUpTask,
  Interview,
} from '@/types';
import { ACTIVE_STATUSES, APPLICATION_STATUSES, CLOSED_STATUSES } from '@/types';
import { addDays, differenceInDays, formatDateOnlyShort, parseDateOnly, todayDateOnly } from '@/lib/dates';

export interface StatusBreakdownEntry {
  status: ApplicationStatus;
  count: number;
}

export interface ActivityBucket {
  /** First day of the bucket, `YYYY-MM-DD`. */
  start: string;
  /** The same day formatted for the active locale, for the chart's axis. */
  label: string;
  count: number;
}

export interface UpcomingInterview {
  applicationId: string;
  company: string;
  jobTitle: string;
  interview: Interview;
}

export interface OpenTask {
  applicationId: string;
  company: string;
  jobTitle: string;
  task: FollowUpTask;
}

export interface DashboardMetrics {
  /** Every saved record, whatever its status. */
  total: number;
  /** Records still in play: Applied, Screening, Interview or Offer. */
  active: number;
  /** Interviews dated today or later on records that are still in play. */
  upcomingInterviews: number;
  /** Records currently at the Offer status. */
  offers: number;
  statusBreakdown: StatusBreakdownEntry[];
  activity: ActivityBucket[];
  upcomingInterviewList: UpcomingInterview[];
  openTaskList: OpenTask[];
}

export function isActive(application: Application): boolean {
  return ACTIVE_STATUSES.includes(application.status);
}

export function isClosed(application: Application): boolean {
  return CLOSED_STATUSES.includes(application.status);
}

/**
 * Buckets applications by the week in which they were applied for, ending with
 * the week containing `today`. Weeks start on Monday.
 */
export function buildActivityBuckets(
  applications: Application[],
  weeks = 12,
  today = todayDateOnly(),
): ActivityBucket[] {
  const todayDate = parseDateOnly(today);
  // getDay(): 0 = Sunday. Shift so Monday is the start of the week.
  const offsetToMonday = (todayDate.getDay() + 6) % 7;
  const currentWeekStart = addDays(today, -offsetToMonday);

  const buckets: ActivityBucket[] = [];
  for (let index = weeks - 1; index >= 0; index -= 1) {
    const start = addDays(currentWeekStart, -index * 7);
    buckets.push({
      start,
      label: formatDateOnlyShort(start),
      count: 0,
    });
  }

  const firstStart = buckets[0]?.start;
  if (!firstStart) return buckets;

  for (const application of applications) {
    const delta = differenceInDays(firstStart, application.appliedDate);
    if (delta < 0) continue;
    const index = Math.floor(delta / 7);
    const bucket = buckets[index];
    if (bucket) bucket.count += 1;
  }

  return buckets;
}

export function buildStatusBreakdown(applications: Application[]): StatusBreakdownEntry[] {
  const counts = new Map<ApplicationStatus, number>();
  for (const status of APPLICATION_STATUSES) counts.set(status, 0);
  for (const application of applications) {
    counts.set(application.status, (counts.get(application.status) ?? 0) + 1);
  }
  return APPLICATION_STATUSES.map((status) => ({
    status,
    count: counts.get(status) ?? 0,
  }));
}

export function collectUpcomingInterviews(
  applications: Application[],
  today = todayDateOnly(),
  limit = 5,
): UpcomingInterview[] {
  const entries: UpcomingInterview[] = [];
  for (const application of applications) {
    if (isClosed(application)) continue;
    for (const interview of application.interviews) {
      if (interview.date >= today) {
        entries.push({
          applicationId: application.id,
          company: application.company,
          jobTitle: application.jobTitle,
          interview,
        });
      }
    }
  }
  entries.sort((a, b) => {
    const byDate = a.interview.date.localeCompare(b.interview.date);
    return byDate !== 0 ? byDate : a.interview.time.localeCompare(b.interview.time);
  });
  return limit > 0 ? entries.slice(0, limit) : entries;
}

export function collectOpenTasks(
  applications: Application[],
  limit = 6,
): OpenTask[] {
  const entries: OpenTask[] = [];
  for (const application of applications) {
    if (isClosed(application)) continue;
    for (const task of application.tasks) {
      if (!task.completed) {
        entries.push({
          applicationId: application.id,
          company: application.company,
          jobTitle: application.jobTitle,
          task,
        });
      }
    }
  }
  entries.sort((a, b) => {
    // Tasks with a due date come first, soonest first; undated tasks last.
    const aDue = a.task.dueDate ?? '9999-12-31';
    const bDue = b.task.dueDate ?? '9999-12-31';
    return aDue.localeCompare(bDue);
  });
  return limit > 0 ? entries.slice(0, limit) : entries;
}

export function computeDashboardMetrics(
  applications: Application[],
  today = todayDateOnly(),
): DashboardMetrics {
  const upcomingInterviewList = collectUpcomingInterviews(applications, today, 5);
  const allUpcoming = collectUpcomingInterviews(applications, today, 0);

  return {
    total: applications.length,
    active: applications.filter(isActive).length,
    upcomingInterviews: allUpcoming.length,
    offers: applications.filter((application) => application.status === 'offer').length,
    statusBreakdown: buildStatusBreakdown(applications),
    activity: buildActivityBuckets(applications, 12, today),
    upcomingInterviewList,
    openTaskList: collectOpenTasks(applications, 6),
  };
}

/** Tasks that are due today or already overdue, used for the "due" accent. */
export function isTaskDue(task: FollowUpTask, today = todayDateOnly()): boolean {
  return !task.completed && task.dueDate !== undefined && task.dueDate <= today;
}
