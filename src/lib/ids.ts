/**
 * Stable, collision-resistant identifiers.
 *
 * `crypto.randomUUID` is used where available (all current browsers over
 * HTTPS). The fallback keeps the app working in older or non-secure contexts
 * and in test environments without the Web Crypto API.
 */
export function createId(): string {
  const cryptoApi = globalThis.crypto as Crypto | undefined;
  if (cryptoApi && typeof cryptoApi.randomUUID === 'function') {
    return cryptoApi.randomUUID();
  }
  if (cryptoApi && typeof cryptoApi.getRandomValues === 'function') {
    const bytes = cryptoApi.getRandomValues(new Uint8Array(16));
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
