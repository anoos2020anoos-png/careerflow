import type { Translate } from '@/i18n/i18n-context';
import { isMessageKey } from '@/i18n/messages';

/**
 * Zod carries a validation failure as a plain string, which is the wrong shape
 * for a translated message that also needs a number in it ("120 characters or
 * fewer"). Rather than rebuild every schema per locale — they are also used
 * outside React, where no `t` exists — the schemas emit a message *key*, with
 * any numeric argument appended after a pipe, and this turns it back into text
 * at the point it is rendered.
 *
 *   'validation.required'        → "Required"
 *   'validation.maxLength|120'   → "Must be 120 characters or fewer"
 *
 * Anything that is not a known key is shown verbatim, so a message from Zod
 * itself still reaches the user rather than disappearing.
 */
export function fieldError(t: Translate, message: string | undefined): string | undefined {
  if (!message) return undefined;

  const separator = message.indexOf('|');
  const key = separator === -1 ? message : message.slice(0, separator);
  if (!isMessageKey(key)) return message;

  return separator === -1 ? t(key) : t(key, { max: message.slice(separator + 1) });
}
