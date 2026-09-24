import { beforeEach, describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProfilePage } from '@/pages/ProfilePage';
import { ApplicationsPage } from '@/pages/ApplicationsPage';
import { renderWithProviders } from '@/test/renderWithProviders';
import { makeApplication, makeProfile } from '@/test/factories';
import { saveData } from '@/lib/storage';

beforeEach(() => {
  window.localStorage.clear();
  saveData(
    [
      makeApplication({
        id: 'good',
        company: 'Sahaab Cloud',
        jobTitle: 'Senior Frontend Engineer',
        salaryMin: 21000,
        salaryMax: 25000,
        salaryCurrency: 'SAR',
        salaryPeriod: 'monthly',
      }),
      makeApplication({
        id: 'low',
        company: 'Barq Delivery',
        jobTitle: 'Data Analyst',
        salaryMin: 12000,
        salaryMax: 15000,
        salaryCurrency: 'SAR',
        salaryPeriod: 'monthly',
      }),
      makeApplication({
        id: 'aed',
        company: 'Dubai Example',
        jobTitle: 'Product Engineer',
        salaryMin: 30000,
        salaryMax: 35000,
        salaryCurrency: 'AED',
        salaryPeriod: 'monthly',
      }),
    ],
    makeProfile(),
  );
});

/** The expected-salary card: the Background page has other Save buttons too. */
function expectationCard(): HTMLElement {
  const card = screen.getByRole('heading', { name: 'Expected salary' }).closest('.cf-card');
  if (!(card instanceof HTMLElement)) throw new Error('Expected salary card not found');
  return card;
}

describe('the expected salary', () => {
  it('is saved from the Background page and remembered', async () => {
    const user = userEvent.setup();
    const page = renderWithProviders(<ProfilePage />);

    const card = expectationCard();
    await user.type(within(card).getByLabelText(/^amount/i), '20000');
    await user.click(within(card).getByRole('button', { name: /save changes/i }));

    await waitFor(() => expect(within(card).getByText(/currently/i)).toBeInTheDocument());
    expect(within(card).getByText(/20,000/)).toBeInTheDocument();

    page.unmount();
    renderWithProviders(<ProfilePage />);
    expect(within(expectationCard()).getByLabelText(/^amount/i)).toHaveValue('20000');
  });

  it('marks each salary against it in the list, and never compares another currency', () => {
    saveData(
      JSON.parse(window.localStorage.getItem('careerflow:data') as string).applications,
      { ...makeProfile(), salaryExpectation: { amount: 20000, currency: 'SAR', period: 'monthly' } },
    );
    renderWithProviders(<ApplicationsPage />);

    const table = within(screen.getByRole('table'));
    const row = (title: string) => within(table.getByText(title).closest('tr') as HTMLElement);

    expect(row('Senior Frontend Engineer').getByText('Meets expected salary')).toBeInTheDocument();
    expect(row('Data Analyst').getByText('Below expected salary')).toBeInTheDocument();
    // AED against a SAR expectation: no marker either way, because no
    // exchange rate is assumed.
    expect(row('Product Engineer').queryByText(/expected salary/i)).not.toBeInTheDocument();
  });

  it('filters to the salaries that meet it', async () => {
    const user = userEvent.setup();
    saveData(
      JSON.parse(window.localStorage.getItem('careerflow:data') as string).applications,
      { ...makeProfile(), salaryExpectation: { amount: 20000, currency: 'SAR', period: 'monthly' } },
    );
    renderWithProviders(<ApplicationsPage />);

    await user.click(screen.getByRole('button', { name: /^filters/i }));
    await user.click(screen.getByRole('checkbox', { name: /salary meets my expectation/i }));

    await waitFor(() => expect(screen.getByText(/showing 1 of 3 applications/i)).toBeInTheDocument());
    expect(within(screen.getByRole('table')).getByText('Senior Frontend Engineer')).toBeInTheDocument();
  });
});
