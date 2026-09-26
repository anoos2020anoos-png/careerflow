import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsPage } from '@/pages/SettingsPage';
import { ApplicationsPage } from '@/pages/ApplicationsPage';
import { renderWithProviders } from '@/test/renderWithProviders';
import { makeApplication } from '@/test/factories';
import { STORAGE_KEY, saveData } from '@/lib/storage';
import { SESSION_KEY, readAccountCache, readPendingOperations, type Session } from '@/lib/sync';
import { useAppData } from '@/state/app-data-context';
import type { Application } from '@/types';

/**
 * A stand-in for the CareerFlow API, holding one account's data in memory.
 * It answers just the requests these tests make, the way the real server
 * does, and records every request so the tests can check what was sent.
 */
function fakeServer(applications: Application[] = []) {
  const requests: { method: string; path: string; body: unknown }[] = [];
  let failNext: { status: number; code: string } | null = null;
  let down = false;
  const state = { applications: [...applications] };

  const json = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

  const fetchImpl = vi.fn(async (url: string, init: RequestInit = {}) => {
    const path = new URL(url).pathname;
    const method = init.method ?? 'GET';
    const body = typeof init.body === 'string' ? JSON.parse(init.body) : undefined;
    if (down) throw new TypeError('Failed to fetch');
    requests.push({ method, path, body });

    if (failNext) {
      const failure = failNext;
      failNext = null;
      return json(failure.status, { error: { code: failure.code, message: 'Refused by the test.' } });
    }

    if (path === '/auth/login') {
      if (body.password !== 'correct horse battery staple') {
        return json(401, { error: { code: 'invalid_credentials', message: 'Wrong.' } });
      }
      return json(200, {
        user: { id: 'u1', email: body.email, createdAt: '2026-09-01T00:00:00.000Z' },
        token: 'A'.repeat(43),
        expiresAt: '2099-01-01T00:00:00.000Z',
      });
    }
    if (path === '/auth/logout') return new Response(null, { status: 204 });
    if (path === '/applications' && method === 'GET') {
      return json(200, { applications: state.applications });
    }
    if (path === '/profile') {
      return json(200, { profile: { qualifications: [], updatedAt: '2026-09-01T00:00:00.000Z' } });
    }
    if (path === '/companies') return json(200, { companies: [] });

    const match = /^\/applications\/([^/]+)$/.exec(path);
    if (match && method === 'PATCH') {
      const index = state.applications.findIndex((application) => application.id === match[1]);
      const current = state.applications[index];
      if (!current) return json(404, { error: { code: 'not_found', message: 'Gone.' } });
      const updated: Application = { ...current };
      for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
        if (value === null) delete (updated as unknown as Record<string, unknown>)[key];
        else (updated as unknown as Record<string, unknown>)[key] = value;
      }
      updated.activity = [
        ...current.activity,
        {
          id: `server-${requests.length}`,
          kind: 'status_changed',
          at: '2026-09-02T00:00:00.000Z',
          from: current.status,
          to: updated.status,
        },
      ];
      state.applications[index] = updated;
      return json(200, { application: updated });
    }
    return json(404, { error: { code: 'not_found', message: `No route ${method} ${path}` } });
  });

  return {
    fetchImpl,
    requests,
    state,
    failNextWith: (status: number, code: string) => {
      failNext = { status, code };
    },
    /** No answer at all, as with no network. */
    setDown: (value: boolean) => {
      down = value;
    },
  };
}

/** Exposes the data context to the test, for actions no page needs here. */
let context: ReturnType<typeof useAppData> | null = null;
function Probe() {
  context = useAppData();
  return null;
}

const onServer = makeApplication({
  id: '6c1d8f3a-2b4e-4a7c-9d5f-1e2a3b4c5d6e',
  company: 'Qamar Health',
  status: 'applied',
});

async function signIn(user: ReturnType<typeof userEvent.setup>) {
  await user.clear(screen.getByLabelText(/server address/i));
  await user.type(screen.getByLabelText(/server address/i), 'http://api.test');
  await user.type(screen.getByLabelText(/^email/i), 'reem@example.com');
  await user.type(screen.getByLabelText(/^password/i), 'correct horse battery staple');
  await user.click(screen.getByRole('button', { name: /^sign in$/i }));
}

beforeEach(() => {
  context = null;
  saveData([makeApplication({ id: 'local-1', company: 'Only On This Device' })]);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('signing in to a CareerFlow server', () => {
  it('shows the account’s data instead of this browser’s, and leaves this browser’s data alone', async () => {
    const server = fakeServer([onServer]);
    vi.stubGlobal('fetch', server.fetchImpl);
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <SettingsPage />
        <ApplicationsPage />
      </>,
    );
    expect(screen.getAllByText('Only On This Device').length).toBeGreaterThan(0);

    await signIn(user);

    // The address is wrapped in invisible bidi isolation marks, hence \W*.
    expect(await screen.findByText(/signed in as \W*reem@example\.com/i)).toBeInTheDocument();
    await waitFor(() => expect(screen.getAllByText('Qamar Health').length).toBeGreaterThan(0));
    expect(screen.queryByText('Only On This Device')).not.toBeInTheDocument();

    // The session is remembered; the browser's own data is untouched.
    expect(JSON.parse(window.localStorage.getItem(SESSION_KEY) ?? '{}').email).toBe('reem@example.com');
    expect(window.localStorage.getItem(STORAGE_KEY)).toContain('Only On This Device');
    expect(window.localStorage.getItem(STORAGE_KEY)).not.toContain('Qamar Health');
  });

  it('sends a change to the server and shows the server’s version of the record', async () => {
    const server = fakeServer([onServer]);
    vi.stubGlobal('fetch', server.fetchImpl);
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <SettingsPage />
        <Probe />
      </>,
    );
    await signIn(user);
    await screen.findByText(/signed in as/i);
    await waitFor(() => expect(context?.applications).toHaveLength(1));

    act(() => context?.setStatus(onServer.id, 'interview'));

    await waitFor(() => expect(screen.getByText(/all changes saved/i)).toBeInTheDocument());
    const patch = server.requests.find((request) => request.method === 'PATCH');
    expect(patch?.path).toBe(`/applications/${onServer.id}`);
    expect((patch?.body as Record<string, unknown>).status).toBe('interview');
    await waitFor(() =>
      expect(context?.applications[0]?.activity.at(-1)?.id).toMatch(/^server-/),
    );
    expect(server.state.applications[0]?.status).toBe('interview');
  });

  it('reloads the account’s data and says so when the server refuses a change', async () => {
    const server = fakeServer([onServer]);
    vi.stubGlobal('fetch', server.fetchImpl);
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <SettingsPage />
        <Probe />
      </>,
    );
    await signIn(user);
    await waitFor(() => expect(context?.applications).toHaveLength(1));

    server.failNextWith(400, 'validation_failed');
    act(() => context?.setStatus(onServer.id, 'offer'));
    expect(context?.applications[0]?.status).toBe('offer');

    // The refused change is not left on screen.
    await waitFor(() => expect(context?.applications[0]?.status).toBe('applied'));
    expect(context?.account.problem?.kind).toBe('save_failed');
  });

  it('goes back to this browser’s data when the session has ended', async () => {
    const server = fakeServer([onServer]);
    vi.stubGlobal('fetch', server.fetchImpl);
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <SettingsPage />
        <Probe />
      </>,
    );
    await signIn(user);
    await waitFor(() => expect(context?.applications).toHaveLength(1));

    server.failNextWith(401, 'unauthenticated');
    act(() => context?.setStatus(onServer.id, 'offer'));

    await waitFor(() => expect(context?.account.signedIn).toBe(false));
    expect(context?.account.problem?.kind).toBe('session_ended');
    expect(context?.applications.map((application) => application.company)).toEqual([
      'Only On This Device',
    ]);
    expect(window.localStorage.getItem(SESSION_KEY)).toBeNull();
  });

  it('offers to copy this browser’s data into an empty account', async () => {
    const server = fakeServer([]);
    vi.stubGlobal('fetch', server.fetchImpl);
    const user = userEvent.setup();
    renderWithProviders(<SettingsPage />);
    await signIn(user);

    expect(await screen.findByText(/your account is empty/i)).toBeInTheDocument();
    expect(screen.getByText(/copy the 1 application in this browser/i)).toBeInTheDocument();
  });

  it('explains a wrong password, and checks a new password before sending it', async () => {
    const server = fakeServer();
    vi.stubGlobal('fetch', server.fetchImpl);
    const user = userEvent.setup();
    renderWithProviders(<SettingsPage />);

    await user.type(screen.getByLabelText(/^email/i), 'reem@example.com');
    await user.type(screen.getByLabelText(/^password/i), 'not the right one at all');
    await user.click(screen.getByRole('button', { name: /^sign in$/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/email address or password is incorrect/i);

    const before = server.requests.length;
    await user.clear(screen.getByLabelText(/^password/i));
    await user.type(screen.getByLabelText(/^password/i), 'too short');
    await user.click(screen.getByRole('button', { name: /create account/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/at least 15 characters/i);
    expect(server.requests.length).toBe(before);
  });

  it('signs out back to this browser’s data', async () => {
    const server = fakeServer([onServer]);
    vi.stubGlobal('fetch', server.fetchImpl);
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <SettingsPage />
        <Probe />
      </>,
    );
    await signIn(user);
    await waitFor(() => expect(context?.applications).toHaveLength(1));
    expect(context?.applications[0]?.company).toBe('Qamar Health');

    await user.click(screen.getByRole('button', { name: /^sign out$/i }));

    await waitFor(() => expect(context?.account.signedIn).toBe(false));
    expect(context?.applications[0]?.company).toBe('Only On This Device');
    expect(server.requests.some((request) => request.path === '/auth/logout')).toBe(true);
    expect(screen.getByRole('button', { name: /^sign in$/i })).toBeInTheDocument();
  });
});

describe('working without a connection while signed in', () => {
  const session: Session = {
    serverUrl: 'http://api.test',
    token: 'A'.repeat(43),
    email: 'reem@example.com',
    expiresAt: '2099-01-01T00:00:00.000Z',
  };
  const emptyProfile = { qualifications: [], updatedAt: '2026-09-01T00:00:00.000Z' };

  it('keeps a change the server could not receive, and sends it when the connection returns', async () => {
    const server = fakeServer([onServer]);
    vi.stubGlobal('fetch', server.fetchImpl);
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <SettingsPage />
        <Probe />
      </>,
    );
    await signIn(user);
    await waitFor(() => expect(context?.applications).toHaveLength(1));

    server.setDown(true);
    act(() => context?.setStatus(onServer.id, 'interview'));

    expect(await screen.findByText(/offline: 1 change waiting/i)).toBeInTheDocument();
    expect(context?.account.offline).toBe(true);
    // Nothing is undone on screen, and the change would survive the tab closing.
    expect(context?.applications[0]?.status).toBe('interview');
    expect(readPendingOperations(session)).toHaveLength(1);
    expect(screen.getByText(/signing out now would discard them/i)).toBeInTheDocument();

    server.setDown(false);
    const before = server.requests.length;
    act(() => {
      window.dispatchEvent(new Event('online'));
    });

    await waitFor(() => expect(screen.getByText(/all changes saved/i)).toBeInTheDocument());
    expect(server.state.applications[0]?.status).toBe('interview');
    expect(readPendingOperations(session)).toEqual([]);
    // Once caught up, the account's data is read again from the server.
    await waitFor(() =>
      expect(
        server.requests.slice(before).some((r) => r.method === 'GET' && r.path === '/applications'),
      ).toBe(true),
    );
    expect(context?.account.offline).toBe(false);
  });

  it('opens with the account as last shown, and sends what was left unsent last time', async () => {
    const server = fakeServer([onServer]);
    vi.stubGlobal('fetch', server.fetchImpl);
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    const shown = { ...onServer, status: 'offer' as const };
    window.localStorage.setItem(
      'careerflow:account-cache:http://api.test|reem@example.com',
      JSON.stringify({ applications: [shown], profile: emptyProfile, companies: [] }),
    );
    window.localStorage.setItem(
      'careerflow:pending:http://api.test|reem@example.com',
      JSON.stringify([
        {
          method: 'PATCH',
          path: `/applications/${onServer.id}`,
          body: { status: 'offer' },
          result: 'application',
          target: `application:${onServer.id}`,
        },
      ]),
    );

    renderWithProviders(<Probe />);
    // At once, before any answer: the data as it was last shown.
    expect(context?.account.phase).toBe('ready');
    expect(context?.applications[0]?.status).toBe('offer');

    await waitFor(() => expect(server.state.applications[0]?.status).toBe('offer'));
    await waitFor(() => expect(readPendingOperations(session)).toEqual([]));
    await waitFor(() =>
      expect(server.requests.some((r) => r.method === 'GET' && r.path === '/applications')).toBe(true),
    );
    expect(context?.applications[0]?.status).toBe('offer');
  });

  it('opens with the last data even when the server cannot be reached', async () => {
    const server = fakeServer([onServer]);
    server.setDown(true);
    vi.stubGlobal('fetch', server.fetchImpl);
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    window.localStorage.setItem(
      'careerflow:account-cache:http://api.test|reem@example.com',
      JSON.stringify({ applications: [onServer], profile: emptyProfile, companies: [] }),
    );
    renderWithProviders(
      <>
        <ApplicationsPage />
        <Probe />
      </>,
    );
    expect(screen.getAllByText('Qamar Health').length).toBeGreaterThan(0);
    await waitFor(() => expect(context?.account.problem?.kind).toBe('unreachable'));
    expect(context?.account.phase).toBe('ready');
    expect(screen.getAllByText('Qamar Health').length).toBeGreaterThan(0);
  });

  it('forgets what it kept for the account on signing out', async () => {
    const server = fakeServer([onServer]);
    vi.stubGlobal('fetch', server.fetchImpl);
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <SettingsPage />
        <Probe />
      </>,
    );
    await signIn(user);
    await waitFor(() => expect(readAccountCache(session)?.applications).toHaveLength(1));

    await user.click(screen.getByRole('button', { name: /^sign out$/i }));
    await waitFor(() => expect(context?.account.signedIn).toBe(false));
    expect(readAccountCache(session)).toBeNull();
    expect(readPendingOperations(session)).toEqual([]);
  });
});
