/**
 * Second line of defence against unsafe links. The application form already
 * rejects anything that is not `http(s)`, but imported JSON is user-supplied
 * data, so the protocol is checked again before any `href` is rendered.
 */
export function isSafeHttpUrl(value: string | undefined): value is string {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/** "example.com/jobs/123" — a compact label for a long job posting link. */
export function describeUrl(value: string): string {
  try {
    const url = new URL(value);
    const path = url.pathname === '/' ? '' : url.pathname;
    const label = `${url.host}${path}`;
    return label.length > 48 ? `${label.slice(0, 47)}…` : label;
  } catch {
    return value;
  }
}
