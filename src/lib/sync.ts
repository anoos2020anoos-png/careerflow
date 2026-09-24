import type {
  Application,
  CompanyDetails,
  FollowUpTask,
  Interview,
  Profile,
  Qualification,
  Requirement,
} from '@/types';
import type { CompanyDetailsInput } from '@/lib/companies';
import { DATA_VERSION } from '@/lib/schemas';
import { EXPORT_APP_ID } from '@/lib/transfer';
import type { ApiClient, HttpMethod } from '@/lib/api';

/**
 * Keeping a signed-in account's data on the server.
 *
 * The app keeps working exactly as it does locally: every change is applied to
 * the data on screen at once, by the same pure functions. What this module adds
 * is the list of API requests that make the server agree, worked out by
 * comparing the data before and after the change. The requests run one at a
 * time, in order (`SyncQueue`), and each answer replaces the local copy of what
 * it describes, so the server's version always wins in the end.
 *
 * The ids the app gives new records are sent along with them, so a record can
 * be edited again before the server has even answered, and the id in the
 * address bar stays valid.
 */

export interface AppData {
  applications: Application[];
  profile: Profile;
  companies: CompanyDetails[];
}

/** What an answer means for the data on screen. */
export type SyncResult =
  /** The body is `{ application }`: replace that one application. */
  | 'application'
  /** The body is `{ profile }`. */
  | 'profile'
  /** Reload everything: the change touched more than the request returns. */
  | 'reload'
  /** Nothing to apply (a delete). */
  | 'none';

export interface SyncOperation {
  method: HttpMethod;
  path: string;
  body?: unknown;
  result: SyncResult;
  /**
   * What the request changes: `application:<id>`, `profile`, `companies` or
   * `all`. An answer is only applied if no later request for the same thing
   * is still waiting, so a quick second change is not undone by the answer to
   * the first.
   */
  target: string;
  /** A delete of something already gone is not a failure. */
  allowNotFound?: boolean;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID.test(value);
}

/** An id the server will accept, or nothing (it then picks one itself). */
function clientId(id: string): { id?: string } {
  return isUuid(id) ? { id } : {};
}

const APPLICATION_FIELDS = [
  'company',
  'jobTitle',
  'jobUrl',
  'location',
  'workArrangement',
  'employmentType',
  'salaryMin',
  'salaryMax',
  'salaryCurrency',
  'salaryPeriod',
  'appliedDate',
  'status',
  'notes',
  'nextFollowUpDate',
] as const satisfies readonly (keyof Application)[];

/** Every editable field, with `null` for the ones that are empty. */
export function applicationFields(application: Application): Record<string, unknown> {
  const fields: Record<string, unknown> = {};
  for (const field of APPLICATION_FIELDS) fields[field] = application[field] ?? null;
  return fields;
}

const encode = encodeURIComponent;
const applicationPath = (id: string) => `/applications/${encode(id)}`;

function added<T extends { id: string }>(before: T[], after: T[]): T[] {
  const known = new Set(before.map((item) => item.id));
  return after.filter((item) => !known.has(item.id));
}

function removed<T extends { id: string }>(before: T[], after: T[]): T[] {
  const kept = new Set(after.map((item) => item.id));
  return before.filter((item) => !kept.has(item.id));
}

function interviewBody(interview: Interview) {
  return {
    ...clientId(interview.id),
    date: interview.date,
    time: interview.time,
    type: interview.type,
    ...(interview.notes ? { notes: interview.notes } : {}),
  };
}

function taskBody(task: FollowUpTask) {
  return {
    ...clientId(task.id),
    title: task.title,
    ...(task.dueDate ? { dueDate: task.dueDate } : {}),
  };
}

function requirementBody(requirement: Requirement) {
  return {
    ...clientId(requirement.id),
    label: requirement.label,
    importance: requirement.importance,
    met: requirement.met,
  };
}

function qualificationBody(qualification: Qualification) {
  return { ...clientId(qualification.id), label: qualification.label, kind: qualification.kind };
}

/**
 * The requests that turn `before` into `after` for one application. Either may
 * be missing: a new application, or a deleted one.
 */
export function applicationOperations(
  before: Application | undefined,
  after: Application | undefined,
): SyncOperation[] {
  const current = after ?? before;
  if (!current) return [];
  const id = current.id;
  const target = `application:${id}`;
  const base = applicationPath(id);

  if (!after) {
    return [{ method: 'DELETE', path: base, result: 'none', target, allowNotFound: true }];
  }

  const operations: SyncOperation[] = [];
  const push = (method: HttpMethod, path: string, body?: unknown) =>
    operations.push({
      method,
      path: `${base}${path}`,
      ...(body === undefined ? {} : { body }),
      result: 'application',
      target,
    });

  if (!before) {
    // A new record only needs the fields it has.
    const body: Record<string, unknown> = { ...clientId(id) };
    for (const [field, value] of Object.entries(applicationFields(after))) {
      if (value !== null) body[field] = value;
    }
    if (!isUuid(id)) {
      // Without an id the server can use, the record comes back under an id of
      // the server's choosing, so the whole list is reloaded to pick it up.
      return [{ method: 'POST', path: '/applications', body, result: 'reload', target: 'all' }];
    }
    operations.push({ method: 'POST', path: '/applications', body, result: 'application', target });
  } else if (
    APPLICATION_FIELDS.some((field) => (before[field] ?? null) !== (after[field] ?? null))
  ) {
    push('PATCH', '', applicationFields(after));
  }

  const was = {
    interviews: before?.interviews ?? [],
    tasks: before?.tasks ?? [],
    requirements: before?.requirements ?? [],
  };

  for (const interview of added(was.interviews, after.interviews)) {
    push('POST', '/interviews', interviewBody(interview));
  }
  for (const interview of removed(was.interviews, after.interviews)) {
    push('DELETE', `/interviews/${encode(interview.id)}`);
  }

  for (const task of added(was.tasks, after.tasks)) {
    push('POST', '/tasks', taskBody(task));
    if (task.completed) push('PATCH', `/tasks/${encode(task.id)}`, { completed: true });
  }
  for (const task of removed(was.tasks, after.tasks)) {
    push('DELETE', `/tasks/${encode(task.id)}`);
  }
  for (const task of after.tasks) {
    const previous = was.tasks.find((entry) => entry.id === task.id);
    if (previous && previous.completed !== task.completed) {
      push('PATCH', `/tasks/${encode(task.id)}`, { completed: task.completed });
    }
  }

  for (const requirement of added(was.requirements, after.requirements)) {
    push('POST', '/requirements', requirementBody(requirement));
  }
  for (const requirement of removed(was.requirements, after.requirements)) {
    push('DELETE', `/requirements/${encode(requirement.id)}`);
  }
  for (const requirement of after.requirements) {
    const previous = was.requirements.find((entry) => entry.id === requirement.id);
    if (previous && previous.met !== requirement.met) {
      push('PATCH', `/requirements/${encode(requirement.id)}`, { met: requirement.met });
    }
  }

  return operations;
}

function sameExpectation(
  a: Profile['salaryExpectation'],
  b: Profile['salaryExpectation'],
): boolean {
  if (!a || !b) return a === b;
  return a.amount === b.amount && a.currency === b.currency && a.period === b.period;
}

export function profileOperations(before: Profile, after: Profile): SyncOperation[] {
  const operations: SyncOperation[] = [];
  const target = 'profile';
  const patch: Record<string, unknown> = {};
  if ((before.headline ?? null) !== (after.headline ?? null)) {
    patch.headline = after.headline ?? null;
  }
  if (!sameExpectation(before.salaryExpectation, after.salaryExpectation)) {
    patch.salaryExpectation = after.salaryExpectation ?? null;
  }
  if (Object.keys(patch).length > 0) {
    operations.push({ method: 'PATCH', path: '/profile', body: patch, result: 'profile', target });
  }
  for (const qualification of added(before.qualifications, after.qualifications)) {
    operations.push({
      method: 'POST',
      path: '/profile/qualifications',
      body: qualificationBody(qualification),
      result: 'profile',
      target,
    });
  }
  for (const qualification of removed(before.qualifications, after.qualifications)) {
    operations.push({
      method: 'DELETE',
      path: `/profile/qualifications/${encode(qualification.id)}`,
      result: 'profile',
      target,
      allowNotFound: true,
    });
  }
  return operations;
}

/**
 * The requests for an ordinary change: any number of applications and the
 * profile, compared record by record. Company details are not covered here;
 * saving them goes through `companyOperations`, because a rename on the server
 * renames the applications too.
 */
export function dataOperations(before: AppData, after: AppData): SyncOperation[] {
  const operations: SyncOperation[] = [];
  const previous = new Map(before.applications.map((application) => [application.id, application]));
  const next = new Map(after.applications.map((application) => [application.id, application]));
  for (const application of after.applications) {
    const old = previous.get(application.id);
    if (old !== application) operations.push(...applicationOperations(old, application));
  }
  for (const application of before.applications) {
    if (!next.has(application.id)) operations.push(...applicationOperations(application, undefined));
  }
  if (before.profile !== after.profile) {
    operations.push(...profileOperations(before.profile, after.profile));
  }
  return operations;
}

export function saveCompanyOperation(previousKey: string, input: CompanyDetailsInput): SyncOperation {
  const body: Record<string, unknown> = { name: input.name.trim() };
  if (input.sector) body.sector = input.sector;
  for (const field of ['industry', 'website', 'notes'] as const) {
    const value = input[field]?.trim();
    if (value) body[field] = value;
  }
  return {
    method: 'PUT',
    path: `/companies/${encode(previousKey)}`,
    body,
    // A rename changes applications too, so everything is reloaded.
    result: 'reload',
    target: 'all',
  };
}

export function removeCompanyOperation(key: string): SyncOperation {
  return {
    method: 'DELETE',
    path: `/companies/${encode(key)}`,
    result: 'none',
    target: 'companies',
    allowNotFound: true,
  };
}

/**
 * Replaces the account's data in one request, as an import does: the
 * applications always, the profile and companies only when given.
 */
export function replaceAllOperation(
  applications: Application[],
  profile?: Profile,
  companies?: CompanyDetails[],
): SyncOperation {
  const body: Record<string, unknown> = {
    app: EXPORT_APP_ID,
    version: DATA_VERSION,
    exportedAt: new Date().toISOString(),
    applications,
  };
  if (profile) body.profile = profile;
  if (companies) body.companies = companies;
  return { method: 'POST', path: '/import', body, result: 'reload', target: 'all' };
}

/* ------------------------------------------------------------------ */
/* Reading the account's data                                          */
/* ------------------------------------------------------------------ */

/**
 * The browser app keeps interviews in date order; the server keeps them in
 * the order they were added. Sorting on the way in keeps the screen the same
 * whichever side the data came from.
 */
export function fromServer(application: Application): Application {
  return {
    ...application,
    interviews: [...application.interviews].sort((a, b) =>
      `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`),
    ),
  };
}

export async function loadAccountData(client: ApiClient): Promise<AppData> {
  const [applications, profile, companies] = await Promise.all([
    client.request<{ applications: Application[] }>('GET', '/applications'),
    client.request<{ profile: Profile }>('GET', '/profile'),
    client.request<{ companies: CompanyDetails[] }>('GET', '/companies'),
  ]);
  return {
    applications: applications.applications.map(fromServer),
    profile: profile.profile,
    companies: companies.companies,
  };
}

/* ------------------------------------------------------------------ */
/* Running the requests                                                */
/* ------------------------------------------------------------------ */

export interface SyncQueueHandlers {
  send: (operation: SyncOperation) => Promise<unknown>;
  /** `latest` is false when a later request for the same target is waiting. */
  onResult: (operation: SyncOperation, body: unknown, latest: boolean) => void;
  /** Called once; every request still waiting has been dropped. */
  onError: (operation: SyncOperation, error: unknown) => void;
  onPendingChange?: (pending: number) => void;
}

/**
 * Sends requests one at a time, in the order the changes were made. The first
 * failure stops the queue and drops what is left, because later requests may
 * depend on the one that failed; the caller then reloads from the server.
 */
export class SyncQueue {
  private readonly handlers: SyncQueueHandlers;
  private waiting: SyncOperation[] = [];
  private running = false;
  private generation = 0;

  constructor(handlers: SyncQueueHandlers) {
    this.handlers = handlers;
  }

  get pending(): number {
    return this.waiting.length;
  }

  /**
   * Resolves once everything waiting has been sent, or failed, or after
   * `timeoutMs`, whichever is first. Used before signing out, so a change made
   * a moment earlier is not silently dropped.
   */
  idle(timeoutMs = 5_000): Promise<void> {
    return new Promise((resolve) => {
      const started = Date.now();
      const check = () => {
        if ((!this.running && this.waiting.length === 0) || Date.now() - started >= timeoutMs) {
          resolve();
        } else {
          setTimeout(check, 50);
        }
      };
      check();
    });
  }

  push(operations: SyncOperation[]): void {
    if (operations.length === 0) return;
    this.waiting.push(...operations);
    this.handlers.onPendingChange?.(this.pending);
    void this.run();
  }

  /** Drops everything waiting. A request already sent is not applied. */
  clear(): void {
    this.waiting = [];
    this.generation += 1;
    this.handlers.onPendingChange?.(0);
  }

  private async run(): Promise<void> {
    if (this.running) return;
    this.running = true;
    const generation = this.generation;
    try {
      while (this.waiting.length > 0 && generation === this.generation) {
        const operation = this.waiting[0] as SyncOperation;
        let body: unknown;
        try {
          body = await this.handlers.send(operation);
        } catch (error) {
          if (generation !== this.generation) return;
          this.waiting = [];
          this.handlers.onPendingChange?.(0);
          this.handlers.onError(operation, error);
          return;
        }
        if (generation !== this.generation) return;
        this.waiting.shift();
        const latest = !this.waiting.some(
          (next) => next.target === operation.target || next.target === 'all' || operation.target === 'all',
        );
        this.handlers.onResult(operation, body, latest);
        this.handlers.onPendingChange?.(this.pending);
      }
    } finally {
      this.running = false;
      // Requests pushed after a `clear()` while one was in flight.
      if (this.waiting.length > 0) void this.run();
    }
  }
}

/* ------------------------------------------------------------------ */
/* The saved session                                                   */
/* ------------------------------------------------------------------ */

export const SESSION_KEY = 'careerflow:session';
export const SERVER_URL_KEY = 'careerflow:server-url';
export const DEFAULT_SERVER_URL = 'http://localhost:3000';

export interface Session {
  serverUrl: string;
  token: string;
  email: string;
  expiresAt: string;
}

function storage(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function readSession(now = Date.now()): Session | null {
  try {
    const raw = storage()?.getItem(SESSION_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<Session>;
    if (
      typeof value.serverUrl !== 'string' ||
      typeof value.token !== 'string' ||
      typeof value.email !== 'string' ||
      typeof value.expiresAt !== 'string'
    ) {
      return null;
    }
    if (Date.parse(value.expiresAt) <= now) return null;
    return value as Session;
  } catch {
    return null;
  }
}

export function writeSession(session: Session | null): void {
  try {
    const store = storage();
    if (!store) return;
    if (session) {
      store.setItem(SESSION_KEY, JSON.stringify(session));
      store.setItem(SERVER_URL_KEY, session.serverUrl);
    } else {
      store.removeItem(SESSION_KEY);
    }
  } catch {
    // A session that cannot be remembered still works until the tab closes.
  }
}

export function lastServerUrl(): string {
  try {
    return storage()?.getItem(SERVER_URL_KEY) || DEFAULT_SERVER_URL;
  } catch {
    return DEFAULT_SERVER_URL;
  }
}
