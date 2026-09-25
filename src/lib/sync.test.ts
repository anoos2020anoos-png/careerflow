import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/lib/api';
import {
  SyncQueue,
  alreadyApplied,
  forgetAccount,
  isRetryableError,
  readAccountCache,
  readPendingOperations,
  saveAccountCache,
  savePendingOperations,
  applicationFields,
  applicationOperations,
  dataOperations,
  fromServer,
  isUuid,
  profileOperations,
  replaceAllOperation,
  saveCompanyOperation,
  type AppData,
  type SyncOperation,
} from '@/lib/sync';
import {
  withInterview,
  withNotes,
  withQualification,
  withRequirement,
  withRequirementToggled,
  withSalaryExpectation,
  withStatus,
  withTask,
  withTaskToggled,
  withoutInterview,
  withoutQualification,
  withoutTask,
} from '@/lib/applications';
import { makeApplication, makeProfile } from '@/test/factories';

const ID = '3f2a1c9e-7b4d-4e8a-9c1f-5d6e7a8b9c0d';
const base = `/applications/${ID}`;

const summary = (operations: SyncOperation[]) =>
  operations.map((operation) => `${operation.method} ${operation.path}`);

describe('requests for one application', () => {
  it('creates a new one under its own id, sending only the fields it has', () => {
    const application = makeApplication({ id: ID, company: 'Sahaab Cloud', location: 'Riyadh' });
    const [operation, ...rest] = applicationOperations(undefined, application);
    expect(rest).toHaveLength(0);
    expect(operation).toMatchObject({ method: 'POST', path: '/applications', result: 'application' });
    const body = operation?.body as Record<string, unknown>;
    expect(body.id).toBe(ID);
    expect(body.company).toBe('Sahaab Cloud');
    expect(body.location).toBe('Riyadh');
    expect('salaryMin' in body).toBe(false);
    expect('notes' in body).toBe(false);
  });

  it('falls back to a full reload when the local id is not a UUID', () => {
    const [operation] = applicationOperations(undefined, makeApplication({ id: 'lx4k2-abc' }));
    expect(operation).toMatchObject({ method: 'POST', result: 'reload', target: 'all' });
    expect('id' in (operation?.body as object)).toBe(false);
  });

  it('sends every field on an edit, with null for the ones cleared', () => {
    const before = makeApplication({ id: ID, location: 'Riyadh', notes: 'Old' });
    const after = { ...before, status: 'interview' as const, location: undefined };
    const [operation] = applicationOperations(before, after);
    expect(operation).toMatchObject({ method: 'PATCH', path: base });
    expect(operation?.body).toEqual(applicationFields(after));
    const body = operation?.body as Record<string, unknown>;
    expect(body.location).toBeNull();
    expect(body.notes).toBe('Old');
    expect(body.status).toBe('interview');
  });

  it('sends nothing when nothing changed', () => {
    const application = makeApplication({ id: ID });
    expect(applicationOperations(application, application)).toEqual([]);
    expect(applicationOperations(application, withStatus(application, application.status))).toEqual([]);
  });

  it('deletes, and does not mind if it is already gone', () => {
    const [operation] = applicationOperations(makeApplication({ id: ID }), undefined);
    expect(operation).toMatchObject({ method: 'DELETE', path: base, allowNotFound: true });
  });

  it('adds and removes interviews, tasks and requirements under the ids the app gave them', () => {
    const start = makeApplication({ id: ID });
    const withInterviewAdded = withInterview(start, {
      date: '2026-09-15',
      time: '10:30',
      type: 'technical',
      notes: '',
    });
    const interview = withInterviewAdded.interviews[0];
    const [addInterview] = applicationOperations(start, withInterviewAdded);
    expect(addInterview).toMatchObject({ method: 'POST', path: `${base}/interviews` });
    expect(addInterview?.body).toEqual({
      id: interview?.id,
      date: '2026-09-15',
      time: '10:30',
      type: 'technical',
    });
    expect(isUuid(interview?.id ?? '')).toBe(true);

    const withTaskAdded = withTask(start, { title: 'Send portfolio', dueDate: '2026-09-20' });
    const task = withTaskAdded.tasks[0];
    expect(applicationOperations(start, withTaskAdded)[0]?.body).toEqual({
      id: task?.id,
      title: 'Send portfolio',
      dueDate: '2026-09-20',
    });

    const ticked = withTaskToggled(withTaskAdded, task?.id ?? '');
    expect(summary(applicationOperations(withTaskAdded, ticked))).toEqual([
      `PATCH ${base}/tasks/${task?.id}`,
    ]);
    expect(applicationOperations(withTaskAdded, ticked)[0]?.body).toEqual({ completed: true });

    expect(summary(applicationOperations(withTaskAdded, withoutTask(withTaskAdded, task?.id ?? '')))).toEqual([
      `DELETE ${base}/tasks/${task?.id}`,
    ]);
    expect(
      summary(applicationOperations(withInterviewAdded, withoutInterview(withInterviewAdded, interview?.id ?? ''))),
    ).toEqual([`DELETE ${base}/interviews/${interview?.id}`]);

    const withRequirementAdded = withRequirement(start, { label: 'React', importance: 'essential' });
    const requirement = withRequirementAdded.requirements[0];
    expect(applicationOperations(start, withRequirementAdded)[0]?.body).toEqual({
      id: requirement?.id,
      label: 'React',
      importance: 'essential',
      met: false,
    });
    const met = withRequirementToggled(withRequirementAdded, requirement?.id ?? '');
    expect(applicationOperations(withRequirementAdded, met)[0]).toMatchObject({
      method: 'PATCH',
      path: `${base}/requirements/${requirement?.id}`,
      body: { met: true },
    });
  });

  it('puts notes-only edits through the same PATCH', () => {
    const start = makeApplication({ id: ID });
    const [operation] = applicationOperations(start, withNotes(start, 'Recruiter: Lama'));
    expect((operation?.body as Record<string, unknown>).notes).toBe('Recruiter: Lama');
  });
});

describe('requests for the profile', () => {
  const profile = makeProfile();

  it('patches only what changed, and clears with null', () => {
    const withHeadline = { ...profile, headline: 'Frontend engineer' };
    expect(profileOperations(profile, withHeadline)[0]).toMatchObject({
      method: 'PATCH',
      path: '/profile',
      body: { headline: 'Frontend engineer' },
    });
    expect(profileOperations(withHeadline, profile)[0]?.body).toEqual({ headline: null });

    const expecting = withSalaryExpectation(profile, { amount: 20000, currency: 'SAR', period: 'monthly' });
    expect(profileOperations(profile, expecting)[0]?.body).toEqual({
      salaryExpectation: { amount: 20000, currency: 'SAR', period: 'monthly' },
    });
    expect(profileOperations(expecting, profile)[0]?.body).toEqual({ salaryExpectation: null });
    expect(profileOperations(profile, profile)).toEqual([]);
  });

  it('adds and removes qualifications', () => {
    const added = withQualification(profile, { label: 'TypeScript', kind: 'skill' });
    const qualification = added.qualifications[0];
    expect(profileOperations(profile, added)[0]).toMatchObject({
      method: 'POST',
      path: '/profile/qualifications',
      body: { id: qualification?.id, label: 'TypeScript', kind: 'skill' },
    });
    expect(summary(profileOperations(added, withoutQualification(added, qualification?.id ?? '')))).toEqual([
      `DELETE /profile/qualifications/${qualification?.id}`,
    ]);
  });
});

describe('requests for a whole change', () => {
  it('compares record by record and leaves untouched ones alone', () => {
    const kept = makeApplication({ id: '11111111-1111-4111-8111-111111111111' });
    const edited = makeApplication({ id: '22222222-2222-4222-8222-222222222222' });
    const deleted = makeApplication({ id: '33333333-3333-4333-8333-333333333333' });
    const created = makeApplication({ id: '44444444-4444-4444-8444-444444444444' });
    const profile = makeProfile();
    const before: AppData = { applications: [kept, edited, deleted], profile, companies: [] };
    const after: AppData = {
      applications: [created, kept, withStatus(edited, 'offer')],
      profile,
      companies: [],
    };
    expect(summary(dataOperations(before, after))).toEqual([
      'POST /applications',
      `PATCH /applications/${edited.id}`,
      `DELETE /applications/${deleted.id}`,
    ]);
  });

  it('saves a company under its previous key, encoded, without empty fields', () => {
    const operation = saveCompanyOperation('شركة سحاب', {
      name: '  شركة سحاب للتقنية ',
      sector: 'private',
      industry: ' ',
      website: 'https://sahaab.example',
    });
    expect(operation.path).toBe(`/companies/${encodeURIComponent('شركة سحاب')}`);
    expect(operation.body).toEqual({
      name: 'شركة سحاب للتقنية',
      sector: 'private',
      website: 'https://sahaab.example',
    });
    expect(operation.result).toBe('reload');
  });

  it('replaces everything in the export format, leaving out what was not given', () => {
    const operation = replaceAllOperation([], undefined, []);
    const body = operation.body as Record<string, unknown>;
    expect(operation.path).toBe('/import');
    expect(body.app).toBe('careerflow');
    expect(body.version).toBe(3);
    expect(body.applications).toEqual([]);
    expect(body.companies).toEqual([]);
    expect('profile' in body).toBe(false);
  });

  it('keeps interviews in date order whichever side the data came from', () => {
    const application = makeApplication({
      interviews: [
        { id: 'b', date: '2026-09-20', time: '09:00', type: 'final', createdAt: '2026-09-01T00:00:00.000Z' },
        { id: 'a', date: '2026-09-15', time: '10:00', type: 'technical', createdAt: '2026-09-02T00:00:00.000Z' },
      ],
    });
    expect(fromServer(application).interviews.map((interview) => interview.id)).toEqual(['a', 'b']);
  });
});

describe('the request queue', () => {
  const operation = (path: string, target = 'application:x'): SyncOperation => ({
    method: 'PATCH',
    path,
    result: 'application',
    target,
  });

  it('sends one request at a time, in order, and applies only the latest answer per record', async () => {
    const sent: string[] = [];
    const applied: [string, boolean][] = [];
    let release: () => void = () => {};
    const queue = new SyncQueue({
      send: (op) => {
        sent.push(op.path);
        return op.path === '/first' ? new Promise<void>((resolve) => (release = resolve)) : Promise.resolve();
      },
      onResult: (op, _body, latest) => applied.push([op.path, latest]),
      onError: () => {
        throw new Error('no request should fail here');
      },
    });

    queue.push([operation('/first')]);
    queue.push([operation('/second'), operation('/other', 'application:y')]);
    expect(sent).toEqual(['/first']);
    release();
    await queue.idle();

    expect(sent).toEqual(['/first', '/second', '/other']);
    expect(applied).toEqual([
      ['/first', false],
      ['/second', true],
      ['/other', true],
    ]);
  });

  it('stops at the first failure and drops what was waiting', async () => {
    const sent: string[] = [];
    const errors: string[] = [];
    const queue = new SyncQueue({
      send: async (op) => {
        sent.push(op.path);
        if (op.path === '/broken') throw new Error('refused');
      },
      onResult: () => {},
      onError: (op) => errors.push(op.path),
    });
    queue.push([operation('/ok'), operation('/broken'), operation('/never')]);
    await queue.idle();
    expect(sent).toEqual(['/ok', '/broken']);
    expect(errors).toEqual(['/broken']);
    expect(queue.pending).toBe(0);
  });

  it('ignores the answer to a request sent before clear()', async () => {
    const applied: string[] = [];
    let release: () => void = () => {};
    const queue = new SyncQueue({
      send: () => new Promise<void>((resolve) => (release = resolve)),
      onResult: (op) => applied.push(op.path),
      onError: () => {},
    });
    queue.push([operation('/before-sign-out')]);
    queue.clear();
    release();
    await queue.idle();
    expect(applied).toEqual([]);
  });
});

describe('the request queue without a connection', () => {
  const operation = (path: string, target = 'application:x', method: SyncOperation['method'] = 'PATCH'): SyncOperation => ({
    method,
    path,
    result: 'application',
    target,
  });
  const unreachable = () => new ApiError(0, 'network_error', 'The server could not be reached.');

  it('keeps a change the server could not receive, and sends it, in order, once it can', async () => {
    let up = false;
    const sent: string[] = [];
    const offline: boolean[] = [];
    const waiting: number[] = [];
    const queue = new SyncQueue(
      {
        send: async (op) => {
          if (!up) throw unreachable();
          sent.push(op.path);
        },
        onResult: () => {},
        onError: () => {
          throw new Error('nothing should be dropped');
        },
        onOfflineChange: (value) => offline.push(value),
        onPendingChange: (list) => waiting.push(list.length),
      },
      { retryDelaysMs: [5] },
    );

    queue.push([operation('/first'), operation('/second', 'application:y')]);
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(queue.offline).toBe(true);
    expect(queue.pending).toBe(2);
    expect(sent).toEqual([]);

    queue.push([operation('/third')]);
    up = true;
    await queue.idle();
    expect(sent).toEqual(['/first', '/second', '/third']);
    expect(queue.offline).toBe(false);
    expect(offline).toEqual([true, false]);
    expect(waiting.at(-1)).toBe(0);
  });

  it('tries again at once when asked, without waiting out the pause', async () => {
    let up = false;
    const sent: string[] = [];
    const queue = new SyncQueue(
      {
        send: async (op) => {
          if (!up) throw unreachable();
          sent.push(op.path);
        },
        onResult: () => {},
        onError: () => {},
      },
      { retryDelaysMs: [60_000] },
    );
    queue.push([operation('/waiting')]);
    await new Promise((resolve) => setTimeout(resolve, 10));
    up = true;
    queue.retryNow();
    await queue.idle(1_000);
    expect(sent).toEqual(['/waiting']);
  });

  it('treats a gateway error from a waking server like no connection, and a refusal as a refusal', async () => {
    expect(isRetryableError(new ApiError(503, 'http_error', 'Unavailable'))).toBe(true);
    expect(isRetryableError(new ApiError(0, 'timeout', 'Slow'))).toBe(true);
    expect(isRetryableError(new ApiError(400, 'validation_failed', 'No'))).toBe(false);
    expect(isRetryableError(new Error('something else'))).toBe(false);
  });

  it('stops waiting when cleared, and sends nothing afterwards', async () => {
    const sent: string[] = [];
    const queue = new SyncQueue(
      {
        send: async () => {
          throw unreachable();
        },
        onResult: (op) => sent.push(op.path),
        onError: () => {},
      },
      { retryDelaysMs: [60_000] },
    );
    queue.push([operation('/never')]);
    await new Promise((resolve) => setTimeout(resolve, 10));
    queue.clear();
    await queue.idle(1_000);
    expect(queue.pending).toBe(0);
    expect(queue.offline).toBe(false);
    expect(sent).toEqual([]);
  });

  it('counts a repeated create or delete as done when the first attempt got through', () => {
    const create = operation('/applications', 'application:x', 'POST');
    const remove = operation('/applications/x/tasks/t', 'application:x', 'DELETE');
    const conflict = new ApiError(409, 'conflict', 'Exists');
    const missing = new ApiError(404, 'not_found', 'Gone');
    expect(alreadyApplied(create, 2, conflict)).toBe(true);
    expect(alreadyApplied(remove, 3, missing)).toBe(true);
    // The first time, the same answers are real refusals.
    expect(alreadyApplied(create, 1, conflict)).toBe(false);
    expect(alreadyApplied(remove, 1, missing)).toBe(false);
    expect(alreadyApplied(operation('/applications/x'), 2, missing)).toBe(false);
  });
});

describe('what is kept in this browser for an account', () => {
  const session = {
    serverUrl: 'https://api.example',
    token: 'A'.repeat(43),
    email: 'reem@example.com',
    expiresAt: '2099-01-01T00:00:00.000Z',
  };
  const other = { ...session, email: 'someone@example.com' };
  const op: SyncOperation = { method: 'PATCH', path: '/profile', body: { headline: 'x' }, result: 'profile', target: 'profile' };

  afterEach(() => {
    forgetAccount(session);
    forgetAccount(other);
  });

  it('keeps the unsent changes per account, and removes them once sent', () => {
    savePendingOperations(session, [op]);
    expect(readPendingOperations(session)).toEqual([op]);
    expect(readPendingOperations(other)).toEqual([]);
    savePendingOperations(session, []);
    expect(readPendingOperations(session)).toEqual([]);
  });

  it('ignores a damaged list rather than sending part of it', () => {
    window.localStorage.setItem(
      'careerflow:pending:https://api.example|reem@example.com',
      JSON.stringify([op, { method: 'PATCH', path: 'no-slash', result: 'profile', target: 'profile' }]),
    );
    expect(readPendingOperations(session)).toEqual([]);
    window.localStorage.setItem('careerflow:pending:https://api.example|reem@example.com', '{not json');
    expect(readPendingOperations(session)).toEqual([]);
  });

  it('keeps the account data as last shown, and forgets both on request', () => {
    const data = { applications: [], profile: { qualifications: [], updatedAt: '2026-09-01T00:00:00.000Z' }, companies: [] };
    saveAccountCache(session, data as unknown as AppData);
    savePendingOperations(session, [op]);
    expect(readAccountCache(session)).toEqual(data);
    expect(readAccountCache(other)).toBeNull();
    forgetAccount(session);
    expect(readAccountCache(session)).toBeNull();
    expect(readPendingOperations(session)).toEqual([]);
  });

  it('ignores a cache that is not account data', () => {
    window.localStorage.setItem('careerflow:account-cache:https://api.example|reem@example.com', '{"applications":1}');
    expect(readAccountCache(session)).toBeNull();
  });
});

describe('the server the sign-in form suggests', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  async function suggested() {
    vi.resetModules();
    return (await import('@/lib/sync')).DEFAULT_SERVER_URL;
  }

  it('is the hosted server in the published app', async () => {
    vi.stubEnv('DEV', false);
    vi.stubEnv('VITE_API_URL', '');
    expect(await suggested()).toBe('https://careerflow-api-yjwq.onrender.com');
  });

  it('is this computer while developing', async () => {
    vi.stubEnv('DEV', true);
    vi.stubEnv('VITE_API_URL', '');
    expect(await suggested()).toBe('http://localhost:3000');
  });

  it('is whatever a build names', async () => {
    vi.stubEnv('DEV', false);
    vi.stubEnv('VITE_API_URL', 'https://api.example.com');
    expect(await suggested()).toBe('https://api.example.com');
  });
});
