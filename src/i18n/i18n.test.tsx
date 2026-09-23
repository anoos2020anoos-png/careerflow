import { beforeEach, describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsPage } from '@/pages/SettingsPage';
import { ApplicationsPage } from '@/pages/ApplicationsPage';
import { renderWithProviders } from '@/test/renderWithProviders';
import { makeApplication } from '@/test/factories';
import { saveData } from '@/lib/storage';
import { MESSAGES, LOCALES, isMessageKey, type MessageKey } from '@/i18n/messages';
import { fieldError } from '@/i18n/fieldError';
import type { Translate } from '@/i18n/i18n-context';

const PLACEHOLDER = /\{(\w+)\}/g;

function placeholders(text: string): Set<string> {
  return new Set(Array.from(text.matchAll(PLACEHOLDER), (match) => match[1] as string));
}

describe('the message catalogue', () => {
  it('defines the same keys in every locale', () => {
    const english = Object.keys(MESSAGES.en).sort();
    for (const locale of LOCALES) {
      expect(Object.keys(MESSAGES[locale]).sort()).toEqual(english);
    }
  });

  it('never leaves a message blank', () => {
    for (const locale of LOCALES) {
      for (const [key, value] of Object.entries(MESSAGES[locale])) {
        expect(value.trim(), `${locale}/${key}`).not.toBe('');
      }
    }
  });

  it('uses the same placeholders in every translation', () => {
    for (const [key, english] of Object.entries(MESSAGES.en)) {
      const expected = placeholders(english);
      for (const locale of LOCALES) {
        const translated = MESSAGES[locale][key as MessageKey];
        expect(placeholders(translated), `${locale}/${key}`).toEqual(expected);
      }
    }
  });
});

describe('fieldError', () => {
  const t: Translate = (key, vars) =>
    MESSAGES.en[key].replace(PLACEHOLDER, (match, name: string) =>
      vars && name in vars ? String(vars[name]) : match,
    );

  it('translates a bare key', () => {
    expect(fieldError(t, 'validation.required')).toBe('Required');
  });

  it('fills in the numeric argument after the pipe', () => {
    expect(fieldError(t, 'validation.maxLength|120')).toBe('Must be 120 characters or fewer');
  });

  it('passes an unrecognised message straight through', () => {
    // Zod's own built-in messages have to survive rather than vanish.
    expect(fieldError(t, 'Expected string, received number')).toBe(
      'Expected string, received number',
    );
    expect(isMessageKey('Expected string, received number')).toBe(false);
  });

  it('returns undefined when there is no error', () => {
    expect(fieldError(t, undefined)).toBeUndefined();
  });
});

describe('switching language', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.dir = 'ltr';
    document.documentElement.lang = 'en';
    saveData([makeApplication({ id: 'one', company: 'Sahaab Cloud', status: 'applied' })]);
  });

  it('translates the interface and flips the document direction', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SettingsPage />);

    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
    expect(document.documentElement.dir).toBe('ltr');

    await user.click(screen.getByRole('radio', { name: 'العربية' }));

    await waitFor(() => {
      expect(document.documentElement.dir).toBe('rtl');
    });
    expect(document.documentElement.lang).toBe('ar');
    expect(screen.getByRole('heading', { name: MESSAGES.ar['settings.title'] })).toBeInTheDocument();
  });

  it('remembers the choice in local storage', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SettingsPage />);

    await user.click(screen.getByRole('radio', { name: 'العربية' }));

    await waitFor(() => {
      expect(window.localStorage.getItem('careerflow:locale')).toBe('ar');
    });
  });

  it('translates status names in the applications list', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ApplicationsPage />);

    expect(screen.getAllByRole('option', { name: 'Applied' }).length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: /^filters/i }));
    await user.click(screen.getByRole('checkbox', { name: 'Applied' }));

    await waitFor(() => {
      expect(screen.getByText(/showing 1 of 1 applications/i)).toBeInTheDocument();
    });
  });
});
