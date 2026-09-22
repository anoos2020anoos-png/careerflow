import { describe, expect, it } from 'vitest';
import {
  computeOutcomeStats,
  daysToFirstResponse,
  rate,
  wasSubmitted,
  USEFUL_SAMPLE_SIZE,
} from '@/lib/outcomes';
import { makeApplication } from '@/test/factories';
import type { Application, ApplicationStatus } from '@/types';

/** Builds an application whose activity log walks through `path`. */
function withHistory(
  id: string,
  path: { to: ApplicationStatus; at: string }[],
  appliedDate = '2026-03-01',
): Application {
  const base = makeApplication({ id, appliedDate });
  let previous: ApplicationStatus = 'saved';
  const activity = [
    { id: `${id}-created`, kind: 'created' as const, at: `${appliedDate}T09:00:00.000Z` },
    ...path.map((step, index) => {
      const entry = {
        id: `${id}-${index}`,
        kind: 'status_changed' as const,
        at: step.at,
        from: previous,
        to: step.to,
      };
      previous = step.to;
      return entry;
    }),
  ];
  return { ...base, status: previous, activity };
}

describe('wasSubmitted', () => {
  it('excludes a record still sitting at Saved', () => {
    expect(wasSubmitted(makeApplication({ status: 'saved', activity: [] }))).toBe(false);
  });

  it('includes a record that was applied for', () => {
    expect(wasSubmitted(makeApplication({ status: 'applied' }))).toBe(true);
  });

  it('includes a record moved back to Saved after being sent', () => {
    const application = withHistory('a', [
      { to: 'applied', at: '2026-03-02T10:00:00.000Z' },
      { to: 'saved', at: '2026-03-03T10:00:00.000Z' },
    ]);
    expect(wasSubmitted(application)).toBe(true);
  });
});

describe('daysToFirstResponse', () => {
  it('measures from the application date to the first response', () => {
    const application = withHistory(
      'a',
      [
        { to: 'applied', at: '2026-03-01T10:00:00.000Z' },
        { to: 'screening', at: '2026-03-08T10:00:00.000Z' },
        { to: 'interview', at: '2026-03-15T10:00:00.000Z' },
      ],
      '2026-03-01',
    );
    // Screening is the first response; the later interview must not win.
    expect(daysToFirstResponse(application)).toBe(7);
  });

  it('counts a rejection as a response', () => {
    const application = withHistory(
      'a',
      [
        { to: 'applied', at: '2026-03-01T10:00:00.000Z' },
        { to: 'rejected', at: '2026-03-06T10:00:00.000Z' },
      ],
      '2026-03-01',
    );
    expect(daysToFirstResponse(application)).toBe(5);
  });

  it('returns null while nothing has come back', () => {
    const application = withHistory('a', [{ to: 'applied', at: '2026-03-01T10:00:00.000Z' }]);
    expect(daysToFirstResponse(application)).toBeNull();
  });

  it('does not treat withdrawing as a response', () => {
    const application = withHistory('a', [
      { to: 'applied', at: '2026-03-01T10:00:00.000Z' },
      { to: 'withdrawn', at: '2026-03-04T10:00:00.000Z' },
    ]);
    expect(daysToFirstResponse(application)).toBeNull();
  });

  it('never reports a negative wait', () => {
    const application = withHistory(
      'a',
      [
        { to: 'applied', at: '2026-03-10T10:00:00.000Z' },
        { to: 'screening', at: '2026-02-20T10:00:00.000Z' },
      ],
      '2026-03-10',
    );
    expect(daysToFirstResponse(application)).toBe(0);
  });
});

describe('computeOutcomeStats', () => {
  it('counts an application that reached interview then was rejected', () => {
    const stats = computeOutcomeStats([
      withHistory('a', [
        { to: 'applied', at: '2026-03-01T10:00:00.000Z' },
        { to: 'interview', at: '2026-03-08T10:00:00.000Z' },
        { to: 'rejected', at: '2026-03-20T10:00:00.000Z' },
      ]),
    ]);

    // The history is what makes this knowable — the current status is "rejected".
    expect(stats.interviewed).toBe(1);
    expect(stats.responded).toBe(1);
    expect(stats.offered).toBe(0);
  });

  it('keeps unsent records out of the denominator', () => {
    const stats = computeOutcomeStats([
      makeApplication({ status: 'saved', activity: [] }),
      makeApplication({ status: 'saved', activity: [] }),
      withHistory('sent', [{ to: 'applied', at: '2026-03-01T10:00:00.000Z' }]),
    ]);

    expect(stats.submitted).toBe(1);
  });

  it('reports the median wait, not the average', () => {
    const stats = computeOutcomeStats([
      withHistory('a', [
        { to: 'applied', at: '2026-03-01T10:00:00.000Z' },
        { to: 'screening', at: '2026-03-03T10:00:00.000Z' },
      ]),
      withHistory('b', [
        { to: 'applied', at: '2026-03-01T10:00:00.000Z' },
        { to: 'screening', at: '2026-03-06T10:00:00.000Z' },
      ]),
      withHistory('c', [
        { to: 'applied', at: '2026-03-01T10:00:00.000Z' },
        { to: 'screening', at: '2026-06-01T10:00:00.000Z' },
      ]),
    ]);

    // Waits are 2, 5 and 92 days. The median ignores the outlier; a mean of 33
    // would describe none of them.
    expect(stats.medianDaysToFirstResponse).toBe(5);
  });

  it('tracks how many are still waiting', () => {
    const stats = computeOutcomeStats([
      withHistory('a', [{ to: 'applied', at: '2026-03-01T10:00:00.000Z' }]),
      withHistory('b', [{ to: 'applied', at: '2026-03-01T10:00:00.000Z' }]),
      withHistory('c', [
        { to: 'applied', at: '2026-03-01T10:00:00.000Z' },
        { to: 'screening', at: '2026-03-05T10:00:00.000Z' },
      ]),
    ]);

    expect(stats.awaitingResponse).toBe(2);
  });

  it('flags a sample too small to read anything into', () => {
    const few = Array.from({ length: USEFUL_SAMPLE_SIZE - 1 }, (_, index) =>
      withHistory(`a${index}`, [{ to: 'applied', at: '2026-03-01T10:00:00.000Z' }]),
    );
    expect(computeOutcomeStats(few).hasUsefulSample).toBe(false);

    const enough = Array.from({ length: USEFUL_SAMPLE_SIZE }, (_, index) =>
      withHistory(`b${index}`, [{ to: 'applied', at: '2026-03-01T10:00:00.000Z' }]),
    );
    expect(computeOutcomeStats(enough).hasUsefulSample).toBe(true);
  });

  it('returns zeroes for an empty list', () => {
    const stats = computeOutcomeStats([]);
    expect(stats).toMatchObject({
      submitted: 0,
      responded: 0,
      interviewed: 0,
      offered: 0,
      awaitingResponse: 0,
      medianDaysToFirstResponse: null,
      hasUsefulSample: false,
    });
  });
});

describe('rate', () => {
  it('rounds to a whole percentage', () => {
    expect(rate(1, 3)).toBe(33);
    expect(rate(2, 3)).toBe(67);
  });

  it('returns null rather than dividing by zero', () => {
    expect(rate(0, 0)).toBeNull();
  });
});
