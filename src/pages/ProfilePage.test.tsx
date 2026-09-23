import { beforeEach, describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProfilePage } from '@/pages/ProfilePage';
import { RequirementsPanel } from '@/features/detail/RequirementsPanel';
import { useAppData } from '@/state/app-data-context';
import { renderWithProviders } from '@/test/renderWithProviders';
import { makeApplication } from '@/test/factories';
import { saveData } from '@/lib/storage';

/**
 * Driven through the real provider, so these cover the whole path the browser
 * takes: something added to the profile, a requirement added to an application,
 * and the count that comes out.
 */

/** The requirements panel wired to the first stored application. */
function RequirementsHarness() {
  const { applications, addRequirement, toggleRequirement, removeRequirement } = useAppData();
  const application = applications[0];
  if (!application) return null;
  return (
    <RequirementsPanel
      requirements={application.requirements}
      onAdd={(values) => addRequirement(application.id, values)}
      onToggle={(id) => toggleRequirement(application.id, id)}
      onRemove={(id) => removeRequirement(application.id, id)}
    />
  );
}

async function addToProfile(user: ReturnType<typeof userEvent.setup>, label: string) {
  const page = renderWithProviders(<ProfilePage />);
  await user.type(screen.getByLabelText(/add something you have/i), label);
  await user.click(screen.getByRole('button', { name: /^add$/i }));
  await waitFor(() => expect(screen.getByText(label)).toBeInTheDocument());
  page.unmount();
}

async function addRequirement(user: ReturnType<typeof userEvent.setup>, label: string) {
  await user.type(screen.getByLabelText(/requirement from the posting/i), label);
  await user.click(screen.getByRole('button', { name: /^add$/i }));
}

beforeEach(() => {
  window.localStorage.clear();
  saveData([makeApplication({ id: 'app-under-test', company: 'Sahaab Cloud' })]);
});

describe('ProfilePage', () => {
  it('adds and removes a qualification', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ProfilePage />);

    expect(screen.getByText(/nothing added yet/i)).toBeInTheDocument();

    await user.type(screen.getByLabelText(/add something you have/i), 'TypeScript');
    await user.click(screen.getByRole('button', { name: /^add$/i }));
    await waitFor(() => expect(screen.getByText('TypeScript')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /remove from your background/i }));
    await waitFor(() => expect(screen.queryByText('TypeScript')).not.toBeInTheDocument());
  });

  it('persists a qualification across a remount', async () => {
    const user = userEvent.setup();
    await addToProfile(user, 'Arabic');

    renderWithProviders(<ProfilePage />);
    expect(await screen.findByText('Arabic')).toBeInTheDocument();
  });

  it('is not seeded with invented qualifications alongside the demo data', () => {
    // The sample applications are fictional and labelled as such; inventing a
    // background for the person using the app would be a different thing.
    renderWithProviders(<ProfilePage />);
    expect(screen.getByText(/nothing added yet/i)).toBeInTheDocument();
  });
});

describe('requirements on an application', () => {
  it('shows an empty state rather than a score when nothing is listed', () => {
    renderWithProviders(<RequirementsHarness />);

    expect(screen.getByText(/no requirements listed yet/i)).toBeInTheDocument();
    // "0 of 0" would read as a result; there is no result to report yet.
    expect(screen.queryByText(/0 of 0/)).not.toBeInTheDocument();
  });

  it('pre-ticks what the profile answers, leaves the rest, and counts both', async () => {
    const user = userEvent.setup();
    await addToProfile(user, 'TypeScript');

    renderWithProviders(<RequirementsHarness />);

    await addRequirement(user, 'TypeScript');
    await waitFor(() =>
      expect(screen.getByRole('checkbox', { name: /i have this: TypeScript/i })).toBeChecked(),
    );

    await addRequirement(user, 'Kubernetes');
    await waitFor(() =>
      expect(screen.getByRole('checkbox', { name: /i have this: Kubernetes/i })).not.toBeChecked(),
    );

    // The denominator travels with the number, so "1" is never read alone.
    expect(screen.getByText('1 of 2 essential')).toBeInTheDocument();
    expect(screen.getByText(/1 essential requirement is not ticked/i)).toBeInTheDocument();

    await user.click(screen.getByRole('checkbox', { name: /i have this: Kubernetes/i }));
    await waitFor(() => expect(screen.getByText('2 of 2 essential')).toBeInTheDocument());
    expect(screen.getByText(/you meet every essential requirement/i)).toBeInTheDocument();
  });

  it('does not pre-tick on a single word shared with an unrelated qualification', async () => {
    const user = userEvent.setup();
    await addToProfile(user, "Bachelor's degree in English literature");

    renderWithProviders(<RequirementsHarness />);
    await addRequirement(user, 'English at business level');

    // Pre-ticking here would put a claim in the user's mouth they never made.
    await waitFor(() =>
      expect(
        screen.getByRole('checkbox', { name: /i have this: English at business level/i }),
      ).not.toBeChecked(),
    );
  });

  it('keeps a hand-made correction rather than re-ticking it', async () => {
    const user = userEvent.setup();
    await addToProfile(user, 'TypeScript');

    renderWithProviders(<RequirementsHarness />);
    await addRequirement(user, 'TypeScript');

    const box = await screen.findByRole('checkbox', { name: /i have this: TypeScript/i });
    await waitFor(() => expect(box).toBeChecked());

    await user.click(box);
    await waitFor(() => expect(box).not.toBeChecked());

    // Adding an unrelated requirement re-renders the panel; the correction holds.
    await addRequirement(user, 'Kubernetes');
    await waitFor(() =>
      expect(screen.getByRole('checkbox', { name: /i have this: Kubernetes/i })).toBeInTheDocument(),
    );
    expect(screen.getByRole('checkbox', { name: /i have this: TypeScript/i })).not.toBeChecked();
  });
});
