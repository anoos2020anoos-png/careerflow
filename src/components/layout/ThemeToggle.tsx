import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/state/theme-context';
import { useT } from '@/i18n/i18n-context';

/** Compact light/dark switch for the top bar. Settings holds the 3-way choice. */
export function ThemeToggle() {
  const { resolved, setMode } = useTheme();
  const t = useT();
  const next = resolved === 'dark' ? 'light' : 'dark';
  const label = t('shell.themeSwitch', {
    mode: next === 'dark' ? t('settings.dark') : t('settings.light'),
  });

  return (
    <button
      type="button"
      onClick={() => setMode(next)}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-surface text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
      aria-label={label}
      title={label}
    >
      {resolved === 'dark' ? (
        <Sun className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Moon className="h-4 w-4" aria-hidden="true" />
      )}
    </button>
  );
}
