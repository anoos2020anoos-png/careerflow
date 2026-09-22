import { describe, expect, it } from 'vitest';
import {
  buildActivityBuckets,
  buildStatusBreakdown,
  collectOpenTasks,
  collectUpcomingInterviews,
  computeDashboardMetrics,
  isTaskDue,
} from '@/lib/metrics';
import { makeApplication } from '@/test/factories';
import type { Application } from '@/types';

/** A fixed "today" keeps every assertion below deterministic. */
const TODAY = '2026-03-18'; // a Wednesday

function withInterview(application: Application, date: string, time = '10:00'): Application {
  return {
    ...application,
    interviews: [
      {
        id: `${application.id}-int-${date}`,
        date,
        time,
        type: 'technical',
        createdAt: '2026-03-01T09:00:00.000Z',
      },
    ],
  };
}

describe('buildStatusBreakdown', () => {
  it('reports every status, including those with no applications', () => {
    const breakdown = buildStatusBreakdown([
      makeApplication({ status: 'applied' }),
      makeApplication({ status: 'applied' }),
      makeApplication({ status: 'offer' }),
    ]);

    expect(breakdown).toHaveLength(7);
    expect(breakdown.find((entry) => entry.status === 'applied')?.count).toBe(2);
    expect(breakdown.find((entry) => entry.status === 'offer')?.count).toBe(1);
    expect(breakdown.find((entry) => entry.status === 'withdrawn')?.count).toBe(0);
  });

  it('counts every application exactly once', () => {
    const applications = [
      makeApplication({ status: 'saved' }),
      makeApplication({ status: 'rejected' }),
      makeApplication({ status: 'interview' }),
    ];
    const total = buildStatusBreakdown(applications).reduce((sum, e) => sum + e.count, 0);
    expect(total).toBe(applications.length);
  });
});

describe('buildActivityBuckets', () => {
  it('produces one bucket per week, ending with the current week', () => {
    const buckets = buildActivityBuckets([], 12, TODAY);
    expect(buckets).toHaveLength(12);
    // 2026-03-18 is a Wednesday, so its week starts on Monday 2026-03-16.
    expect(buckets[11]?.start).toBe('2026-03-16');
    expect(buckets[0]?.start).toBe('2025-12-29');
  });

  it('places an application in the week it was applied for', () => {
    const buckets = buildActivityBuckets(
      [
        makeApplication({ appliedDate: '2026-03-16' }),
        makeApplication({ appliedDate: '2026-03-18' }),
        makeApplication({ appliedDate: '2026-03-09' }),
      ],
      12,
      TODAY,
    );

    expect(buckets[11]?.count).toBe(2);
    expect(buckets[10]?.count).toBe(1);
  });

  it('ignores applications older than the window', () => {
    const buckets = buildActivityBuckets(
      [makeApplication({ appliedDate: '2024-01-01' })],
      12,
      TODAY,
    );
    expect(buckets.reduce((sum, bucket) => sum + bucket.count, 0)).toBe(0);
  });
});

describe('collectUpcomingInterviews', () => {
  it('includes interviews today and later, and excludes past ones', () => {
    const upcoming = collectUpcomingInterviews(
      [
        withInterview(makeApplication({ id: 'past' }), '2026-03-17'),
        withInterview(makeApplication({ id: 'today' }), TODAY),
        withInterview(makeApplication({ id: 'future' }), '2026-03-25'),
      ],
      TODAY,
      0,
    );

    expect(upcoming.map((entry) => entry.applicationId)).toEqual(['today', 'future']);
  });

  it('excludes interviews on rejected or withdrawn applications', () => {
    const upcoming = collectUpcomingInterviews(
      [
        withInterview(makeApplication({ id: 'rejected', status: 'rejected' }), '2026-03-25'),
        withInterview(makeApplication({ id: 'withdrawn', status: 'withdrawn' }), '2026-03-25'),
        withInterview(makeApplication({ id: 'live', status: 'interview' }), '2026-03-25'),
      ],
      TODAY,
      0,
    );

    expect(upcoming.map((entry) => entry.applicationId)).toEqual(['live']);
  });

  it('orders by date and then by time, and respects the limit', () => {
    const upcoming = collectUpcomingInterviews(
      [
        withInterview(makeApplication({ id: 'late-day' }), '2026-03-25', '16:00'),
        withInterview(makeApplication({ id: 'early-day' }), '2026-03-25', '09:00'),
        withInterview(makeApplication({ id: 'soonest' }), '2026-03-20', '12:00'),
      ],
      TODAY,
      2,
    );

    expect(upcoming.map((entry) => entry.applicationId)).toEqual(['soonest', 'early-day']);
  });
});

describe('collectOpenTasks', () => {
  const withTasks = (id: string, status: Application['status'], completed: boolean, dueDate?: string) =>
    makeApplication({
      id,
      status,
      tasks: [
        {
          id: `${id}-task`,
          title: `Task for ${id}`,
          completed,
          createdAt: '2026-03-01T09:00:00.000Z',
          ...(dueDate ? { dueDate } : {}),
        },
      ],
    });

  it('lists only incomplete tasks on applications that are still open', () => {
    const tasks = collectOpenTasks(
      [
        withTasks('open', 'applied', false, '2026-03-20'),
        withTasks('done', 'applied', true, '2026-03-20'),
        withTasks('closed', 'rejected', false, '2026-03-20'),
      ],
      0,
    );

    expect(tasks.map((entry) => entry.applicationId)).toEqual(['open']);
  });

  it('puts dated tasks first, soonest first, and undated ones last', () => {
    const tasks = collectOpenTasks(
      [
        withTasks('later', 'applied', false, '2026-04-01'),
        withTasks('undated', 'applied', false),
        withTasks('sooner', 'applied', false, '2026-03-19'),
      ],
      0,
    );

    expect(tasks.map((entry) => entry.applicationId)).toEqual(['sooner', 'later', 'undated']);
  });
});

describe('isTaskDue', () => {
  const task = (dueDate?: string, completed = false) => ({
    id: 't',
    title: 'x',
    completed,
    createdAt: '2026-03-01T09:00:00.000Z',
    ...(dueDate ? { dueDate } : {}),
  });

  it('is due today and overdue in the past, but not in the future', () => {
    expect(isTaskDue(task(TODAY), TODAY)).toBe(true);
    expect(isTaskDue(task('2026-03-01'), TODAY)).toBe(true);
    expect(isTaskDue(task('2026-04-01'), TODAY)).toBe(false);
  });

  it('is never due when completed or undated', () => {
    expect(isTaskDue(task(TODAY, true), TODAY)).toBe(false);
    expect(isTaskDue(task(undefined), TODAY)).toBe(false);
  });
});

describe('computeDashboardMetrics', () => {
  it('derives every headline figure from the records', () => {
    const applications = [
      makeApplication({ status: 'saved', appliedDate: '2026-03-16' }),
      makeApplication({ status: 'applied', appliedDate: '2026-03-16' }),
      makeApplication({ status: 'screening', appliedDate: '2026-03-10' }),
      withInterview(makeApplication({ status: 'interview', appliedDate: '2026-03-09' }), '2026-03-25'),
      makeApplication({ status: 'offer', appliedDate: '2026-03-02' }),
      makeApplication({ status: 'rejected', appliedDate: '2026-02-20' }),
      makeApplication({ status: 'withdrawn', appliedDate: '2026-02-10' }),
    ];

    const metrics = computeDashboardMetrics(applications, TODAY);

    expect(metrics.total).toBe(7);
    // Active = applied + screening + interview + offer. Saved is not yet active.
    expect(metrics.active).toBe(4);
    expect(metrics.offers).toBe(1);
    expect(metrics.upcomingInterviews).toBe(1);
    expect(metrics.statusBreakdown.reduce((sum, entry) => sum + entry.count, 0)).toBe(7);
  });

  it('returns zeroes and empty lists for an empty data set', () => {
    const metrics = computeDashboardMetrics([], TODAY);

    expect(metrics.total).toBe(0);
    expect(metrics.active).toBe(0);
    expect(metrics.offers).toBe(0);
    expect(metrics.upcomingInterviews).toBe(0);
    expect(metrics.upcomingInterviewList).toEqual([]);
    expect(metrics.openTaskList).toEqual([]);
    expect(metrics.activity).toHaveLength(12);
  });

  it('updates as soon as an application changes status', () => {
    const application = makeApplication({ status: 'applied' });
    expect(computeDashboardMetrics([application], TODAY).offers).toBe(0);

    const promoted = { ...application, status: 'offer' as const };
    const after = computeDashboardMetrics([promoted], TODAY);
    expect(after.offers).toBe(1);
    expect(after.active).toBe(1);
  });
});
