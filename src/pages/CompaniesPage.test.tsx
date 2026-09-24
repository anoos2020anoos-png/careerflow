import { beforeEach, describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CompaniesPage } from '@/pages/CompaniesPage';
import { ApplicationsPage } from '@/pages/ApplicationsPage';
import { renderWithProviders } from '@/test/renderWithProviders';
import { makeApplication, makeProfile } from '@/test/factories';
import { companyKey } from '@/lib/companies';
import { loadData, saveData } from '@/lib/storage';

beforeEach(() => {
  window.localStorage.clear();
  saveData(
    [
      makeApplication({ id: 'a', company: 'Sahab Cloud', jobTitle: 'Frontend Engineer', status: 'interview' }),
      makeApplication({ id: 'b', company: 'Sahaab Cloud', jobTitle: 'Platform Engineer', status: 'rejected' }),
      makeApplication({ id: 'c', company: 'Barq Delivery', jobTitle: 'Data Analyst', status: 'applied' }),
    ],
    makeProfile(),
    [{ key: companyKey('Sahaab Cloud'), name: 'Sahaab Cloud', sector: 'private', updatedAt: '2026-01-01T00:00:00.000Z' }],
  );
});

function card(name: string) {
  return screen.getByRole('heading', { name }).closest('li') as HTMLElement;
}

describe('CompaniesPage', () => {
  it('lists each company once, with its applications counted', () => {
    renderWithProviders(<CompaniesPage />);

    expect(screen.getByRole('heading', { name: 'Barq Delivery' })).toBeInTheDocument();
    expect(within(card('Sahaab Cloud')).getByText('Private sector')).toBeInTheDocument();
    // "Sahab Cloud" is a different spelling, so until it is renamed it is its own company.
    expect(within(card('Sahab Cloud')).getByText('1 application')).toBeInTheDocument();
  });

  it('merges two spellings when one is renamed to the other', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CompaniesPage />);

    await user.click(within(card('Sahab Cloud')).getByRole('button', { name: /edit details for sahab cloud/i }));
    const dialog = await screen.findByRole('dialog');
    const name = within(dialog).getByLabelText(/^name/i);
    await user.clear(name);
    await user.type(name, 'Sahaab Cloud');

    // The consequence is spelled out before anything is saved.
    expect(within(dialog).getByText(/already in your list/i)).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: /save changes/i }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    expect(screen.queryByRole('heading', { name: 'Sahab Cloud' })).not.toBeInTheDocument();
    const merged = card('Sahaab Cloud');
    expect(within(merged).getByText('2 applications')).toBeInTheDocument();
    // The details the target already had survive the merge.
    expect(within(merged).getByText('Private sector')).toBeInTheDocument();

    const stored = loadData();
    expect(stored.kind).toBe('loaded');
    if (stored.kind === 'loaded') {
      expect(stored.data.applications.map((entry) => entry.company)).toEqual([
        'Sahaab Cloud',
        'Sahaab Cloud',
        'Barq Delivery',
      ]);
    }
  });

  it('links to the applications for one company', () => {
    renderWithProviders(<CompaniesPage />);
    const link = within(card('Barq Delivery')).getByRole('link', { name: /view applications/i });
    expect(link).toHaveAttribute('href', `/applications?company=${encodeURIComponent(companyKey('Barq Delivery'))}`);
  });

  it('filters companies by sector', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CompaniesPage />);

    await user.selectOptions(screen.getByLabelText(/^sector$/i), 'private');
    expect(screen.getByRole('heading', { name: 'Sahaab Cloud' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Barq Delivery' })).not.toBeInTheDocument();
  });
});

describe('the company filter on the applications page', () => {
  it('shows only that company, and can be cleared', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ApplicationsPage />, {
      route: `/applications?company=${encodeURIComponent(companyKey('Barq Delivery'))}`,
    });

    expect(screen.getByText(/showing 1 of 3 applications/i)).toBeInTheDocument();
    expect(screen.getByText('Company: Barq Delivery')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /show all companies/i }));
    await waitFor(() => expect(screen.getByText(/showing 3 of 3 applications/i)).toBeInTheDocument());
  });
});
