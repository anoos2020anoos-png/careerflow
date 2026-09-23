/**
 * The locale the `Intl` formatters should use.
 *
 * `Intl` does not read `<html lang>`, and passing `undefined` would follow the
 * browser rather than the language the visitor picked in the app — so an Arabic
 * interface would still print English month names. Rather than thread a locale
 * argument through every date and number helper (and every component that calls
 * one), the provider records the active choice here once and the helpers read
 * it. It is set in exactly one place: `I18nProvider`.
 */

/**
 * `ar-u-nu-latn` rather than plain `ar`: Arabic month and day names, but
 * Western digits and the Gregorian calendar, which is what a job tracker wants.
 * (`ar-SA` would switch to the Hijri calendar.)
 */
const INTL_LOCALES: Record<string, string> = {
  en: 'en-GB',
  ar: 'ar-u-nu-latn',
};

let active = 'en-GB';

export function setFormatLocale(locale: string): void {
  active = INTL_LOCALES[locale] ?? locale;
}

export function getFormatLocale(): string {
  return active;
}
