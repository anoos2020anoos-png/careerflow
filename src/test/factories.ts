import type { Application, ApplicationStatus } from '@/types';

let counter = 0;

/** Builds a complete, valid application for tests. Override only what matters. */
export function makeApplication(overrides: Partial<Application> = {}): Application {
  counter += 1;
  const base: Application = {
    id: `app-${counter}`,
    company: `Company ${counter}`,
    jobTitle: `Engineer ${counter}`,
    workArrangement: 'remote',
    employmentType: 'full_time',
    appliedDate: '2026-03-01',
    status: 'applied' as ApplicationStatus,
    createdAt: '2026-03-01T09:00:00.000Z',
    updatedAt: '2026-03-01T09:00:00.000Z',
    interviews: [],
    tasks: [],
    activity: [
      {
        id: `act-${counter}`,
        kind: 'created',
        at: '2026-03-01T09:00:00.000Z',
      },
    ],
  };
  return { ...base, ...overrides };
}

export function resetFactoryCounter(): void {
  counter = 0;
}
