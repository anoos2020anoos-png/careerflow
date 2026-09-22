import type { Application, ApplicationStatus } from '@/types';
import { differenceInDays, toDateOnly } from '@/lib/dates';

/**
 * Outcome statistics derived from the user's own history.
 *
 * This is deliberately *not* a prediction. CareerFlow has no dataset of other
 * people's applications, no job-requirement data and no labour-market data, so
 * it cannot say how likely any particular application is to succeed. What it
 * can do honestly is count what has already happened to this person: how often
 * employers replied, how often that turned into an interview, and how long the
 * first reply took.
 *
 * Every figure is reported as a fraction (`3 of 12`) rather than a bare
 * percentage, so the sample size is always visible next to the rate. A rate
 * computed from four applications is not worth reading, and showing the
 * denominator is what makes that obvious without a disclaimer.
 */

/** Statuses that can only be reached because an employer responded. */
const RESPONSE_STATUSES: readonly ApplicationStatus[] = [
  'screening',
  'interview',
  'offer',
  'rejected',
];

const INTERVIEW_STATUSES: readonly ApplicationStatus[] = ['interview', 'offer'];

/**
 * Whether an application ever reached one of `statuses`, even if it has since
 * moved on. An application that is now "Rejected" but went through an
 * interview still counts as having reached the interview stage — the activity
 * log is what makes that knowable.
 */
function everReached(
  application: Application,
  statuses: readonly ApplicationStatus[],
): boolean {
  if (statuses.includes(application.status)) return true;
  return application.activity.some(
    (entry) => entry.kind === 'status_changed' && entry.to !== undefined && statuses.includes(entry.to),
  );
}

/**
 * Whether the application was actually submitted. A record still sitting at
 * "Saved" was never sent anywhere, so it must not drag the rates down.
 */
export function wasSubmitted(application: Application): boolean {
  if (application.status !== 'saved') return true;
  return application.activity.some(
    (entry) => entry.kind === 'status_changed' && entry.to !== undefined && entry.to !== 'saved',
  );
}

/**
 * Days between applying and the first employer response, or `null` when no
 * response has arrived yet.
 */
export function daysToFirstResponse(application: Application): number | null {
  const responses = application.activity
    .filter(
      (entry) =>
        entry.kind === 'status_changed' &&
        entry.to !== undefined &&
        RESPONSE_STATUSES.includes(entry.to),
    )
    .map((entry) => entry.at)
    .sort();

  const first = responses[0];
  if (first === undefined) return null;

  const respondedOn = new Date(first);
  if (Number.isNaN(respondedOn.getTime())) return null;

  const delta = differenceInDays(application.appliedDate, toDateOnly(respondedOn));
  // A response recorded before the application date means the dates were
  // entered inconsistently; treat it as same-day rather than a negative wait.
  return Math.max(0, delta);
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[middle] as number;
  return ((sorted[middle - 1] as number) + (sorted[middle] as number)) / 2;
}

export interface OutcomeStats {
  /** Applications actually sent — the denominator for every rate below. */
  submitted: number;
  /** Of those, how many ever got any employer response. */
  responded: number;
  /** Of those, how many ever reached an interview. */
  interviewed: number;
  /** Of those, how many ever reached an offer. */
  offered: number;
  /** Median days from applying to the first response, across answered ones. */
  medianDaysToFirstResponse: number | null;
  /** Applications sent that are still waiting for any reply. */
  awaitingResponse: number;
  /**
   * False when there is too little history for the rates to mean anything.
   * The UI still shows the counts; it just does not dress them up as rates.
   */
  hasUsefulSample: boolean;
}

/** Below this many submitted applications, a percentage is noise. */
export const USEFUL_SAMPLE_SIZE = 5;

export function computeOutcomeStats(applications: Application[]): OutcomeStats {
  const submittedApplications = applications.filter(wasSubmitted);

  const responded = submittedApplications.filter((application) =>
    everReached(application, RESPONSE_STATUSES),
  );
  const interviewed = submittedApplications.filter((application) =>
    everReached(application, INTERVIEW_STATUSES),
  );
  const offered = submittedApplications.filter((application) =>
    everReached(application, ['offer']),
  );

  const waits = responded
    .map(daysToFirstResponse)
    .filter((value): value is number => value !== null);

  return {
    submitted: submittedApplications.length,
    responded: responded.length,
    interviewed: interviewed.length,
    offered: offered.length,
    medianDaysToFirstResponse: median(waits),
    awaitingResponse: submittedApplications.length - responded.length,
    hasUsefulSample: submittedApplications.length >= USEFUL_SAMPLE_SIZE,
  };
}

/** Formats a count and its denominator as a percentage, or `null` if no base. */
export function rate(count: number, total: number): number | null {
  if (total <= 0) return null;
  return Math.round((count / total) * 100);
}
