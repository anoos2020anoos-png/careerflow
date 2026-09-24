import { ApiError } from '@/lib/api';
import type { MessageKey } from '@/i18n/messages';
import type { Translate } from '@/i18n/i18n-context';

/**
 * Wraps an address or email in Unicode isolation marks before it goes into a
 * sentence. Inside Arabic text, an LTR run like http://localhost:3000 followed
 * by punctuation is otherwise reordered by the bidi algorithm ("3000.http…").
 * The marks are invisible and change nothing in English.
 */
export function isolate(text: string): string {
  return `\u2068${text}\u2069`;
}

/**
 * The same rules the API applies to a new password (its src/auth/passwords.ts),
 * checked here first so the reason can be given in the user's language. The
 * server still checks; this only saves a round trip and a message in English.
 */
export function passwordProblem(password: string, email: string): MessageKey | null {
  const normalized = password.normalize('NFC');
  if ([...normalized].length < 15) return 'account.errorPasswordShort';
  const lower = normalized.toLowerCase();
  const localPart = email.trim().toLowerCase().split('@')[0] ?? '';
  if (new Set(lower).size === 1) return 'account.errorPasswordRepeated';
  if (lower === email.trim().toLowerCase() || (localPart.length >= 4 && lower.includes(localPart))) {
    return 'account.errorPasswordEmail';
  }
  if (lower.includes('careerflow')) return 'account.errorPasswordApp';
  return null;
}

const BY_CODE: Record<string, MessageKey> = {
  invalid_url: 'account.errorUrl',
  invalid_credentials: 'account.errorCredentials',
  email_taken: 'account.errorTaken',
  rate_limited: 'account.errorRateLimited',
  network_error: 'account.errorUnreachable',
  timeout: 'account.errorTimeout',
};

/** Explains a failed sign-in or sign-up in the interface language. */
export function signInErrorText(t: Translate, error: unknown): string {
  if (error instanceof ApiError) {
    const key = BY_CODE[error.code];
    if (key) return t(key);
    // A rule this app does not know about: the server's own words, in English.
    const detail = error.details[0]?.message ?? error.message;
    return t('account.errorOther', { message: detail });
  }
  return t('account.errorOther', { message: String(error) });
}
