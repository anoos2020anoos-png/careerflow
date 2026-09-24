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
    // `randomUUID` exists only in secure contexts (HTTPS, localhost). Over
    // plain HTTP, build the same kind of id from random bytes: a version 4
    // UUID, which is also what the CareerFlow API accepts as a client id.
    const bytes = cryptoApi.getRandomValues(new Uint8Array(16));
    bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40;
    bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
