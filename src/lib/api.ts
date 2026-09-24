/**
 * A small client for the CareerFlow API (the careerflow-api repository).
 *
 * The app works without it: this is only used once the user signs in to a
 * server from Settings. Everything goes through `request`, which adds the
 * session token, sends and reads JSON, and turns every kind of failure (the
 * server refusing, the network dropping, a timeout) into one `ApiError`, so
 * callers have a single thing to handle.
 */

export interface ApiUser {
  id: string;
  email: string;
  createdAt: string;
}

export interface AuthResult {
  user: ApiUser;
  token: string;
  expiresAt: string;
}

export interface ApiErrorDetail {
  path: string;
  message: string;
}

/**
 * `status` is the HTTP status, or 0 when no answer came back at all.
 * `code` is the API's stable error code (`invalid_credentials`,
 * `email_taken`, …), or `network_error` / `timeout` / `bad_response` for
 * failures on the way.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: ApiErrorDetail[];

  constructor(status: number, code: string, message: string, details: ApiErrorDetail[] = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

export interface ApiClientOptions {
  baseUrl: string;
  token?: string;
  /** Injected in tests. Defaults to the browser's own `fetch`. */
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

export interface ApiClient {
  readonly baseUrl: string;
  request<T>(method: HttpMethod, path: string, body?: unknown): Promise<T>;
}

/**
 * Tidies what the user typed as the server address: trims it, drops a
 * trailing slash, and insists on http(s). Returns null for anything else.
 * A path is kept, so an API served under /api still works.
 */
export function normalizeServerUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!/^https?:\/\//i.test(trimmed)) return null;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    if (url.search || url.hash || url.username || url.password) return null;
    return `${url.origin}${url.pathname.replace(/\/+$/, '')}`;
  } catch {
    return null;
  }
}

function readError(status: number, payload: unknown): ApiError {
  const error =
    payload && typeof payload === 'object' && 'error' in payload
      ? (payload as { error: unknown }).error
      : null;
  if (error && typeof error === 'object') {
    const { code, message, details } = error as {
      code?: unknown;
      message?: unknown;
      details?: unknown;
    };
    return new ApiError(
      status,
      typeof code === 'string' ? code : 'http_error',
      typeof message === 'string' ? message : `The server answered ${status}.`,
      Array.isArray(details)
        ? details.filter(
            (detail): detail is ApiErrorDetail =>
              typeof detail === 'object' &&
              detail !== null &&
              typeof (detail as ApiErrorDetail).path === 'string' &&
              typeof (detail as ApiErrorDetail).message === 'string',
          )
        : [],
    );
  }
  return new ApiError(status, 'http_error', `The server answered ${status}.`);
}

export function createApiClient({
  baseUrl,
  token,
  fetchImpl,
  timeoutMs = 15_000,
}: ApiClientOptions): ApiClient {
  const doFetch = fetchImpl ?? globalThis.fetch.bind(globalThis);

  return {
    baseUrl,
    async request<T>(method: HttpMethod, path: string, body?: unknown): Promise<T> {
      const headers: Record<string, string> = { Accept: 'application/json' };
      if (body !== undefined) headers['Content-Type'] = 'application/json';
      if (token) headers.Authorization = `Bearer ${token}`;

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      let response: Response;
      try {
        response = await doFetch(`${baseUrl}${path}`, {
          method,
          headers,
          body: body === undefined ? undefined : JSON.stringify(body),
          signal: controller.signal,
          // Tokens travel in the header; no cookies are needed or sent.
          credentials: 'omit',
        });
      } catch (cause) {
        const aborted = cause instanceof DOMException && cause.name === 'AbortError';
        throw aborted
          ? new ApiError(0, 'timeout', 'The server took too long to answer.')
          : new ApiError(0, 'network_error', 'The server could not be reached.');
      } finally {
        clearTimeout(timer);
      }

      if (response.status === 204) return undefined as T;

      let payload: unknown = undefined;
      const text = await response.text();
      if (text) {
        try {
          payload = JSON.parse(text);
        } catch {
          throw new ApiError(response.status, 'bad_response', 'The server sent something that is not JSON.');
        }
      }
      if (!response.ok) throw readError(response.status, payload);
      return payload as T;
    },
  };
}

/* ------------------------------------------------------------------ */
/* Account endpoints                                                   */
/* ------------------------------------------------------------------ */

export function register(client: ApiClient, email: string, password: string): Promise<AuthResult> {
  return client.request<AuthResult>('POST', '/auth/register', { email, password });
}

export function login(client: ApiClient, email: string, password: string): Promise<AuthResult> {
  return client.request<AuthResult>('POST', '/auth/login', { email, password });
}

export function logout(client: ApiClient, everywhere = false): Promise<void> {
  return client.request<void>('POST', everywhere ? '/auth/logout-all' : '/auth/logout');
}
