import { Languages } from 'lucide-react';
import { useI18n } from '@/i18n/i18n-context';
import { LOCALE_NAMES } from '@/i18n/messages';

/**
 * One-tap switch between the two locales. Settings holds the same choice as a
 * labelled radio group; this is the shortcut in the top bar.
 */
export function LocaleToggle() {
  const { locale, setLocale, t } = useI18n();
  const next = locale === 'ar' ? 'en' : 'ar';
  const label = t('settings.language') + ': ' + LOCALE_NAMES[next];

  return (
    <button
      type="button"
      onClick={() => setLocale(next)}
      className="flex h-9 items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 text-sm font-medium text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
      aria-label={label}
      title={label}
      lang={next}
    >
      <Languages className="h-4 w-4" aria-hidden="true" />
      {LOCALE_NAMES[next]}
    </button>
  );
}
