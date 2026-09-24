import { describe, expect, it } from 'vitest';
import { ApiError, createApiClient, normalizeServerUrl } from '@/lib/api';

interface Call {
  url: string;
  init: RequestInit;
}

function fakeFetch(respond: (call: Call) => Response | Promise<Response>) {
  const calls: Call[] = [];
  const fetchImpl = (async (url: string, init: RequestInit) => {
    const call = { url, init };
    calls.push(call);
    return respond(call);
  }) as unknown as typeof fetch;
  return { calls, fetchImpl };
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

async function failure(promise: Promise<unknown>): Promise<ApiError> {
  const outcome = await promise.then(
    () => null,
    (error: unknown) => error,
  );
  expect(outcome instanceof ApiError).toBe(true);
  return outcome as ApiError;
}

describe('normalizeServerUrl', () => {
  it('accepts http and https addresses and drops a trailing slash', () => {
    expect(normalizeServerUrl(' http://localhost:3000/ ')).toBe('http://localhost:3000');
    expect(normalizeServerUrl('https://api.example.com/careerflow/')).toBe(
      'https://api.example.com/careerflow',
    );
  });

  it('refuses anything else', () => {
    for (const value of ['', 'localhost:3000', 'ftp://example.com', 'javascript:alert(1)', 'http://x.com/?a=1']) {
      expect(normalizeServerUrl(value), value).toBeNull();
    }
  });
});

describe('the API client', () => {
  it('sends JSON with the session token and reads JSON back', async () => {
    const { calls, fetchImpl } = fakeFetch(() => json(201, { ok: true }));
    const client = createApiClient({ baseUrl: 'http://api.test', token: 'secret-token', fetchImpl });
    const body = await client.request('POST', '/applications', { company: 'Sahaab Cloud' });

    expect(body).toEqual({ ok: true });
    expect(calls).toHaveLength(1);
    const [call] = calls;
    expect(call?.url).toBe('http://api.test/applications');
    expect(call?.init.method).toBe('POST');
    expect(call?.init.body).toBe('{"company":"Sahaab Cloud"}');
    expect(call?.init.credentials).toBe('omit');
    const headers = call?.init.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer secret-token');
    expect(headers['Content-Type']).toBe('application/json');
  });

  it('sends no token or body when there is none', async () => {
    const { calls, fetchImpl } = fakeFetch(() => new Response(null, { status: 204 }));
    const client = createApiClient({ baseUrl: 'http://api.test', fetchImpl });
    expect(await client.request('DELETE', '/companies/x')).toBeUndefined();
    const headers = calls[0]?.init.headers as Record<string, string>;
    expect('Authorization' in headers).toBe(false);
    expect('Content-Type' in headers).toBe(false);
    expect(calls[0]?.init.body).toBeUndefined();
  });

  it('turns an API error into an ApiError with its code and details', async () => {
    const { fetchImpl } = fakeFetch(() =>
      json(400, {
        error: {
          code: 'validation_failed',
          message: 'The request contains invalid values.',
          details: [{ path: 'password', message: 'Use at least 15 characters.' }, { nonsense: true }],
        },
      }),
    );
    const client = createApiClient({ baseUrl: 'http://api.test', fetchImpl });
    const error = await failure(client.request('POST', '/auth/register', {}));
    expect(error).toMatchObject({ status: 400, code: 'validation_failed' });
    expect(error.details).toEqual([{ path: 'password', message: 'Use at least 15 characters.' }]);
  });

  it('reports an unreachable server, a timeout and a non-JSON answer distinctly', async () => {
    const down = createApiClient({
      baseUrl: 'http://api.test',
      fetchImpl: fakeFetch(() => {
        throw new TypeError('Failed to fetch');
      }).fetchImpl,
    });
    expect(await failure(down.request('GET', '/me'))).toMatchObject({ status: 0, code: 'network_error' });

    const slow = createApiClient({
      baseUrl: 'http://api.test',
      timeoutMs: 20,
      fetchImpl: fakeFetch(
        ({ init }) =>
          new Promise<Response>((_resolve, reject) => {
            init.signal?.addEventListener('abort', () =>
              reject(new DOMException('The operation was aborted.', 'AbortError')),
            );
          }),
      ).fetchImpl,
    });
    expect(await failure(slow.request('GET', '/me'))).toMatchObject({ status: 0, code: 'timeout' });

    const html = createApiClient({
      baseUrl: 'http://api.test',
      fetchImpl: fakeFetch(() => new Response('<html>502</html>', { status: 502 })).fetchImpl,
    });
    expect(await failure(html.request('GET', '/me'))).toMatchObject({ status: 502, code: 'bad_response' });
  });
});
