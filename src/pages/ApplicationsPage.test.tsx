import { beforeEach, describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApplicationsPage } from '@/pages/ApplicationsPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { renderWithProviders } from '@/test/renderWithProviders';
import { makeApplication } from '@/test/factories';
import { saveData } from '@/lib/storage';

/**
 * These tests drive the real provider, so they cover the same path the browser
 * takes: form -> validation -> store -> persistence -> rendered list.
 */
beforeEach(() => {
  window.localStorage.clear();
  // Pre-seed so the provider loads a known set instead of the 15 demo records.
  saveData([
    makeApplication({
      id: 'northwind',
      company: 'Northwind Analytics',
      jobTitle: 'Senior Frontend Engineer',
      status: 'interview',
      workArrangement: 'hybrid',
      appliedDate: '2026-03-01',
    }),
    makeApplication({
      id: 'lumen',
      company: 'Lumen Health',
      jobTitle: 'Product Engineer',
      status: 'applied',
      workArrangement: 'remote',
      appliedDate: '2026-02-10',
    }),
  ]);
});

async function openCreateDialog(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: /add application/i }));
  return screen.getByRole('dialog');
}

/**
 * The list renders twice — a table for wide screens and cards for narrow ones —
 * and CSS decides which is visible. jsdom applies no CSS, so both are in the
 * document and a job title matches twice. Scope row assertions to the table.
 */
function inTable() {
  return within(screen.getByRole('table'));
}

describe('ApplicationsPage — creating', () => {
  it('adds an application and shows it in the list', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ApplicationsPage />);

    expect(screen.getByText(/showing 2 of 2 applications/i)).toBeInTheDocument();

    const dialog = await openCreateDialog(user);
    await user.type(within(dialog).getByLabelText(/company/i), 'Verdant Labs');
    await user.type(within(dialog).getByLabelText(/job title/i), 'React Engineer');
    await user.click(within(dialog).getByRole('button', { name: /add application/i }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(inTable().getByText('React Engineer')).toBeInTheDocument();
    });
    expect(screen.getByText(/showing 3 of 3 applications/i)).toBeInTheDocument();
  });

  it('refuses to submit without a company and keeps the dialog open', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ApplicationsPage />);

    const dialog = await openCreateDialog(user);
    await user.type(within(dialog).getByLabelText(/job title/i), 'React Engineer');
    await user.click(within(dialog).getByRole('button', { name: /add application/i }));

    // The message sits directly under the Company label and is wired to the
    // input through aria-describedby, so it does not repeat the field name.
    const company = within(dialog).getByLabelText(/company/i);
    await waitFor(() => expect(company).toHaveAttribute('aria-invalid', 'true'));
    expect(within(dialog).getByText(/^required$/i)).toBeInTheDocument();

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/showing 2 of 2 applications/i)).toBeInTheDocument();
  });

  it('rejects an unusable job posting link', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ApplicationsPage />);

    const dialog = await openCreateDialog(user);
    await user.type(within(dialog).getByLabelText(/company/i), 'Verdant Labs');
    await user.type(within(dialog).getByLabelText(/job title/i), 'React Engineer');
    await user.type(within(dialog).getByLabelText(/job posting link/i), 'not-a-link');
    await user.click(within(dialog).getByRole('button', { name: /add application/i }));

    expect(await within(dialog).findByText(/starting with http/i)).toBeInTheDocument();
  });

  it('closes the dialog on Escape without saving', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ApplicationsPage />);

    const dialog = await openCreateDialog(user);
    await user.type(within(dialog).getByLabelText(/company/i), 'Abandoned Co');
    await user.keyboard('{Escape}');

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.queryByText('Abandoned Co')).not.toBeInTheDocument();
    expect(screen.getByText(/showing 2 of 2 applications/i)).toBeInTheDocument();
  });
});

describe('ApplicationsPage — search and filters', () => {
  it('narrows the list by company name', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ApplicationsPage />);

    await user.type(screen.getByLabelText(/search by company or role/i), 'lumen');

    await waitFor(() => {
      expect(screen.getByText(/showing 1 of 2 applications/i)).toBeInTheDocument();
    });
    expect(screen.queryByText('Senior Frontend Engineer')).not.toBeInTheDocument();
  });

  it('narrows the list by job title', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ApplicationsPage />);

    await user.type(screen.getByLabelText(/search by company or role/i), 'frontend');

    await waitFor(() => {
      expect(screen.getByText(/showing 1 of 2 applications/i)).toBeInTheDocument();
    });
  });

  it('shows an empty state and a way back when nothing matches', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ApplicationsPage />);

    await user.type(screen.getByLabelText(/search by company or role/i), 'zzzz');

    expect(await screen.findByText(/no applications match your filters/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /clear filters/i }));
    await waitFor(() => {
      expect(screen.getByText(/showing 2 of 2 applications/i)).toBeInTheDocument();
    });
  });

  it('filters by status', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ApplicationsPage />);

    await user.click(screen.getByRole('button', { name: /^filters/i }));
    await user.click(screen.getByRole('checkbox', { name: 'Applied' }));

    await waitFor(() => {
      expect(screen.getByText(/showing 1 of 2 applications/i)).toBeInTheDocument();
    });
    expect(inTable().getByText('Product Engineer')).toBeInTheDocument();
  });
});

describe('ApplicationsPage — status changes and deletion', () => {
  it('moves an application to another status from the list', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ApplicationsPage />);

    const select = screen.getAllByLabelText(/status for senior frontend engineer/i)[0]!;
    await user.selectOptions(select, 'offer');

    await waitFor(() => {
      expect((select as HTMLSelectElement).value).toBe('offer');
    });
  });

  it('asks for confirmation before deleting, and can be cancelled', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ApplicationsPage />);

    await user.click(screen.getAllByRole('button', { name: /delete product engineer/i })[0]!);

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/delete this application\?/i)).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: /cancel/i }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByText(/showing 2 of 2 applications/i)).toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: /delete product engineer/i })[0]!);
    const confirmDialog = await screen.findByRole('dialog');
    await user.click(within(confirmDialog).getByRole('button', { name: /^delete$/i }));

    await waitFor(() => {
      expect(screen.getByText(/showing 1 of 1 applications/i)).toBeInTheDocument();
    });
  });
});

describe('Dashboard reacts to the stored records', () => {
  it('counts the seeded applications', () => {
    renderWithProviders(<DashboardPage />);

    const total = screen.getByRole('figure', { name: 'Total applications' });
    expect(within(total).getByText('2')).toBeInTheDocument();

    const active = screen.getByRole('figure', { name: 'Active' });
    expect(within(active).getByText('2')).toBeInTheDocument();
  });

  it('shows the empty state when there are no records', () => {
    window.localStorage.clear();
    saveData([]);
    renderWithProviders(<DashboardPage />);

    expect(screen.getByText(/no applications yet/i)).toBeInTheDocument();
  });
});
