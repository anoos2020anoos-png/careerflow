import type { MessageKey } from '@/i18n/messages';

/**
 * Builds the message a Zod rule reports. See `src/i18n/fieldError.ts` for why a
 * key travels through Zod rather than finished text.
 */
export function issue(key: MessageKey, max?: number): string {
  return max === undefined ? key : `${key}|${max}`;
}
