import type {
  Application,
  ApplicationStatus,
  Profile,
  Qualification,
  QualificationKind,
  Requirement,
  RequirementImportance,
} from '@/types';

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
    requirements: [],
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

/** Builds a requirement for tests. `met` defaults to false. */
export function makeRequirement(
  label: string,
  importance: RequirementImportance = 'essential',
  met = false,
): Requirement {
  counter += 1;
  return {
    id: `req-${counter}`,
    label,
    importance,
    met,
    createdAt: '2026-03-01T09:00:00.000Z',
  };
}

export function makeQualification(
  label: string,
  kind: QualificationKind = 'skill',
): Qualification {
  counter += 1;
  return {
    id: `qual-${counter}`,
    label,
    kind,
    createdAt: '2026-03-01T09:00:00.000Z',
  };
}

export function makeProfile(qualifications: Qualification[] = []): Profile {
  return { qualifications, updatedAt: '2026-03-01T09:00:00.000Z' };
}
