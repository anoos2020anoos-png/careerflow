import { beforeEach, describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsPage } from '@/pages/SettingsPage';
import { renderWithProviders } from '@/test/renderWithProviders';
import { makeApplication } from '@/test/factories';
import { STORAGE_KEY, loadData, saveData } from '@/lib/storage';
import { DEMO_APPLICATION_COUNT } from '@/lib/demoData';

beforeEach(() => {
  window.localStorage.clear();
  saveData([
    makeApplication({ id: 'one', company: 'Northwind Analytics' }),
    makeApplication({ id: 'two', company: 'Lumen Health' }),
  ]);
});

describe('SettingsPage — clearing data', () => {
  it('asks for confirmation and then empties the store', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SettingsPage />);

    expect(screen.getByText(/2 applications/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /clear all data/i }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: /clear everything/i }));

    await waitFor(() => {
      expect(screen.getByText(/0 applications/i)).toBeInTheDocument();
    });
  });

  it('does not put the demo data back after the user clears everything', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SettingsPage />);

    await user.click(screen.getByRole('button', { name: /clear all data/i }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: /clear everything/i }));

    await waitFor(() => {
      const outcome = loadData();
      // An empty *list* is stored, not an absent key — that is what stops the
      // next visit from being treated as a first visit and re-seeded.
      expect(outcome.kind).toBe('loaded');
      if (outcome.kind === 'loaded') {
        expect(outcome.data.applications).toEqual([]);
      }
    });

    expect(window.localStorage.getItem(STORAGE_KEY)).not.toBeNull();
  });

  it('can be cancelled without touching the data', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SettingsPage />);

    await user.click(screen.getByRole('button', { name: /clear all data/i }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: /cancel/i }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByText(/2 applications/i)).toBeInTheDocument();
  });
});

describe('SettingsPage — restoring the sample data', () => {
  it('replaces the current records with the demo set', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SettingsPage />);

    await user.click(screen.getByRole('button', { name: /reset to demo data/i }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: /restore sample data/i }));

    await waitFor(() => {
      expect(
        screen.getByText(new RegExp(`${DEMO_APPLICATION_COUNT} applications`, 'i')),
      ).toBeInTheDocument();
    });
  });
});

describe('SettingsPage — theme', () => {
  it('remembers the chosen theme', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SettingsPage />);

    await user.click(screen.getByRole('radio', { name: /dark/i }));

    await waitFor(() => {
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });
    expect(window.localStorage.getItem('careerflow:theme')).toBe('dark');

    await user.click(screen.getByRole('radio', { name: /light/i }));
    await waitFor(() => {
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
  });
});
