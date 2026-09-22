import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { readThemePreference, writeThemePreference } from '@/lib/storage';
import { ThemeContext, THEME_MODES, type ThemeMode, type ThemeValue } from '@/state/theme-context';

function readStoredMode(): ThemeMode {
  const raw = readThemePreference();
  if (!raw) return 'system';
  // Tolerates both the plain string and a JSON-encoded string.
  const candidate = raw.startsWith('"') ? raw.slice(1, -1) : raw;
  return (THEME_MODES as readonly string[]).includes(candidate)
    ? (candidate as ThemeMode)
    : 'system';
}

function prefersDark(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(readStoredMode);
  const [systemDark, setSystemDark] = useState<boolean>(prefersDark);

  // Track the OS preference so "system" stays live without a reload.
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = (event: MediaQueryListEvent) => setSystemDark(event.matches);
    query.addEventListener('change', listener);
    return () => query.removeEventListener('change', listener);
  }, []);

  const resolved: 'light' | 'dark' = mode === 'system' ? (systemDark ? 'dark' : 'light') : mode;

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', resolved === 'dark');
    // Tells the browser to render form controls and scrollbars to match.
    root.style.colorScheme = resolved;
  }, [resolved]);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    writeThemePreference(next);
  }, []);

  const value = useMemo<ThemeValue>(() => ({ mode, resolved, setMode }), [mode, resolved, setMode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
