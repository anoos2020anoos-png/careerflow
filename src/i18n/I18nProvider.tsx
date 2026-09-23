import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  LOCALES,
  LOCALE_DIRECTION,
  MESSAGES,
  type Locale,
  type MessageKey,
} from '@/i18n/messages';
import { I18nContext, type I18nValue } from '@/i18n/i18n-context';
import { setFormatLocale } from '@/lib/locale';

const LOCALE_KEY = 'careerflow:locale';

function isLocale(value: string | null): value is Locale {
  return value !== null && (LOCALES as readonly string[]).includes(value);
}

/**
 * Stored choice first, then the browser's own language, then English.
 *
 * English is the fallback rather than the browser default on purpose: it keeps
 * the test environment (jsdom reports `en-US`) deterministic, and a visitor
 * whose browser is Arabic still lands in Arabic through the second branch.
 */
function readInitialLocale(): Locale {
  try {
    const stored = globalThis.localStorage?.getItem(LOCALE_KEY) ?? null;
    if (isLocale(stored)) return stored;
  } catch {
    /* storage unavailable — fall through to the browser language */
  }

  const browser = typeof navigator === 'undefined' ? '' : navigator.language;
  return browser.toLowerCase().startsWith('ar') ? 'ar' : 'en';
}

/** Replaces every `{name}` in `template` with the matching value. */
function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(readInitialLocale);
  const dir = LOCALE_DIRECTION[locale];

  // Set during render, not in an effect: `Intl` output has to be correct on the
  // very first paint, before effects run.
  setFormatLocale(locale);

  // The whole layout mirrors off these two attributes: `dir` flips every
  // logical CSS property, and `lang` is what Intl and screen readers read.
  useEffect(() => {
    const root = document.documentElement;
    root.lang = locale;
    root.dir = dir;
  }, [locale, dir]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      globalThis.localStorage?.setItem(LOCALE_KEY, next);
    } catch {
      /* preference simply is not remembered */
    }
  }, []);

  const value = useMemo<I18nValue>(() => {
    const table = MESSAGES[locale];
    return {
      locale,
      dir,
      setLocale,
      t: (key: MessageKey, vars?: Record<string, string | number>) =>
        interpolate(table[key], vars),
    };
  }, [locale, dir, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
