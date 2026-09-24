import type { Application, CompanyDetails, PersistedData, Profile } from '@/types';
import { emptyProfile } from '@/types';
import { DATA_VERSION, persistedDataSchema } from '@/lib/schemas';

export const STORAGE_KEY = 'careerflow:data';
export const THEME_KEY = 'careerflow:theme';
/** Where an unreadable payload is parked so the user can still recover it. */
export const CORRUPT_BACKUP_KEY = 'careerflow:data:unreadable-backup';

export type LoadOutcome =
  /** Nothing has ever been stored — the caller should seed demo data. */
  | { kind: 'empty' }
  /** A valid payload was read. */
  | { kind: 'loaded'; data: PersistedData }
  /** Something was stored but could not be understood. */
  | { kind: 'unreadable'; reason: string };

function getStorage(): Storage | null {
  try {
    const storage = globalThis.localStorage;
    // Touch the API: Safari in private mode throws only on write.
    const probe = '__careerflow_probe__';
    storage.setItem(probe, '1');
    storage.removeItem(probe);
    return storage;
  } catch {
    return null;
  }
}

export function isStorageAvailable(): boolean {
  return getStorage() !== null;
}

/**
 * Applies forward migrations before validation.
 *
 * Every change so far has been additive — version 2 added requirements and the
 * profile, version 3 salary periods, the salary expectation and company details
 * — so an older payload is valid newer data with those fields empty. The
 * migration is a version stamp rather than a rewrite, and the schema marks the
 * new fields optional so an un-migrated payload still parses.
 */
function migrate(raw: unknown): unknown {
  if (typeof raw !== 'object' || raw === null) return raw;
  const record = { ...(raw as Record<string, unknown>) };

  // Pre-versioned payloads: treat a bare list of applications as version 1.
  if (typeof record.version !== 'number' && Array.isArray(record.applications)) {
    record.version = 1;
  }

  // 1 -> 2 added requirements and the profile; 2 -> 3 added salary periods, the
  // salary expectation and company details. Every step is additive, so each is
  // a version stamp: the new fields stay absent until the user fills them in.
  if (record.version === 1) record.version = 2;
  if (record.version === 2) record.version = 3;

  return record;
}

/**
 * Fills in what the migration left absent, so the rest of the app never has to
 * ask whether a record predates version 2.
 */
function normalize(parsed: {
  version: number;
  applications: unknown[];
  profile?: Profile;
  companies?: CompanyDetails[];
}): PersistedData {
  return {
    version: parsed.version,
    applications: (parsed.applications as Application[]).map((application) => ({
      ...application,
      requirements: application.requirements ?? [],
    })),
    profile: parsed.profile ?? emptyProfile(new Date(0).toISOString()),
    companies: parsed.companies ?? [],
  };
}

export function loadData(): LoadOutcome {
  const storage = getStorage();
  if (!storage) return { kind: 'empty' };

  const raw = storage.getItem(STORAGE_KEY);
  if (raw === null) return { kind: 'empty' };

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    quarantine(storage, raw);
    return { kind: 'unreadable', reason: 'The saved data was not valid JSON.' };
  }

  const result = persistedDataSchema.safeParse(migrate(parsed));
  if (!result.success) {
    quarantine(storage, raw);
    const first = result.error.issues[0];
    const where = first?.path.join('.') ?? 'the saved data';
    return {
      kind: 'unreadable',
      reason: `The saved data did not match the expected format (${where}).`,
    };
  }

  if (result.data.version > DATA_VERSION) {
    quarantine(storage, raw);
    return {
      kind: 'unreadable',
      reason: `The saved data was written by a newer version of CareerFlow (format ${result.data.version}).`,
    };
  }

  return { kind: 'loaded', data: normalize(result.data) };
}

function quarantine(storage: Storage, raw: string) {
  try {
    storage.setItem(CORRUPT_BACKUP_KEY, raw);
  } catch {
    /* Backing up is best-effort; never block startup on it. */
  }
}

export function saveData(
  applications: Application[],
  profile?: Profile,
  companies: CompanyDetails[] = [],
): boolean {
  const storage = getStorage();
  if (!storage) return false;
  const payload: PersistedData = {
    version: DATA_VERSION,
    applications,
    profile: profile ?? emptyProfile(new Date(0).toISOString()),
    companies,
  };
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(payload));
    return true;
  } catch {
    // Most likely the 5 MB quota. The in-memory state stays correct.
    return false;
  }
}

/**
 * Removes the stored payload entirely, so the next visit is treated as a first
 * visit and demo data is seeded again. Used only by "Reset to demo data".
 */
export function removeStoredData(): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.removeItem(STORAGE_KEY);
    storage.removeItem(CORRUPT_BACKUP_KEY);
  } catch {
    /* ignore */
  }
}

export function readThemePreference(): string | null {
  const storage = getStorage();
  if (!storage) return null;
  try {
    return storage.getItem(THEME_KEY);
  } catch {
    return null;
  }
}

export function writeThemePreference(value: string): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(THEME_KEY, value);
  } catch {
    /* ignore */
  }
}
