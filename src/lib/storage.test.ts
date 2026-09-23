import { beforeEach, describe, expect, it } from 'vitest';
import {
  CORRUPT_BACKUP_KEY,
  STORAGE_KEY,
  loadData,
  removeStoredData,
  saveData,
} from '@/lib/storage';
import { DATA_VERSION } from '@/lib/schemas';
import { makeApplication, makeProfile, makeQualification } from '@/test/factories';

beforeEach(() => {
  window.localStorage.clear();
});

describe('loadData', () => {
  it('reports "empty" on a first visit so the caller can seed demo data', () => {
    expect(loadData()).toEqual({ kind: 'empty' });
  });

  it('reads back exactly what was saved', () => {
    const applications = [makeApplication({ company: 'Northwind' })];
    expect(saveData(applications)).toBe(true);

    const outcome = loadData();
    expect(outcome.kind).toBe('loaded');
    if (outcome.kind === 'loaded') {
      expect(outcome.data.version).toBe(DATA_VERSION);
      expect(outcome.data.applications).toHaveLength(1);
      expect(outcome.data.applications[0]?.company).toBe('Northwind');
    }
  });

  it('distinguishes "cleared by the user" from "never visited"', () => {
    saveData([]);
    const outcome = loadData();

    // An empty *list* must not be reported as an empty *store*, otherwise the
    // demo data would reappear every time the user cleared it.
    expect(outcome.kind).toBe('loaded');
    if (outcome.kind === 'loaded') {
      expect(outcome.data.applications).toEqual([]);
    }
  });

  it('reports unreadable data when the payload is not JSON', () => {
    window.localStorage.setItem(STORAGE_KEY, '{ not json');
    const outcome = loadData();

    expect(outcome.kind).toBe('unreadable');
    if (outcome.kind === 'unreadable') {
      expect(outcome.reason).toMatch(/JSON/i);
    }
  });

  it('reports unreadable data when a record fails validation', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: DATA_VERSION,
        applications: [{ id: 'x', company: 'Acme' }],
      }),
    );

    expect(loadData().kind).toBe('unreadable');
  });

  it('rejects a status value it does not recognise', () => {
    const application = { ...makeApplication(), status: 'ghosted' };
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: DATA_VERSION, applications: [application] }),
    );

    expect(loadData().kind).toBe('unreadable');
  });

  it('refuses data written by a newer format version', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: DATA_VERSION + 1, applications: [] }),
    );

    const outcome = loadData();
    expect(outcome.kind).toBe('unreadable');
    if (outcome.kind === 'unreadable') {
      expect(outcome.reason).toMatch(/newer version/i);
    }
  });

  it('keeps a backup copy of anything it could not read', () => {
    window.localStorage.setItem(STORAGE_KEY, 'totally broken');
    loadData();

    expect(window.localStorage.getItem(CORRUPT_BACKUP_KEY)).toBe('totally broken');
  });

  it('migrates a version 1 payload without losing anything', () => {
    const application = makeApplication({ id: 'kept' });
    // Version 1 records have no `requirements`, and the envelope has no profile.
    const legacy = { ...application } as Record<string, unknown>;
    delete legacy.requirements;
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 1, applications: [legacy] }),
    );

    const outcome = loadData();
    expect(outcome.kind).toBe('loaded');
    if (outcome.kind === 'loaded') {
      expect(outcome.data.version).toBe(DATA_VERSION);
      expect(outcome.data.applications[0]?.id).toBe('kept');
      // Filled in rather than left undefined, so nothing downstream has to ask.
      expect(outcome.data.applications[0]?.requirements).toEqual([]);
      expect(outcome.data.profile.qualifications).toEqual([]);
      // Nothing is quarantined: this is a normal upgrade, not corruption.
      expect(window.localStorage.getItem(CORRUPT_BACKUP_KEY)).toBeNull();
    }
  });

  it('round-trips a profile', () => {
    saveData([], makeProfile([makeQualification('TypeScript')]));
    const outcome = loadData();
    expect(outcome.kind).toBe('loaded');
    if (outcome.kind === 'loaded') {
      expect(outcome.data.profile.qualifications[0]?.label).toBe('TypeScript');
    }
  });

  it('accepts a pre-versioned payload that only has an applications array', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ applications: [makeApplication()] }),
    );

    const outcome = loadData();
    expect(outcome.kind).toBe('loaded');
    if (outcome.kind === 'loaded') {
      expect(outcome.data.applications).toHaveLength(1);
    }
  });
});

describe('saveData and removeStoredData', () => {
  it('writes a versioned envelope', () => {
    saveData([makeApplication()]);
    const raw = window.localStorage.getItem(STORAGE_KEY);

    expect(raw).toBeTruthy();
    expect(JSON.parse(raw as string)).toMatchObject({ version: DATA_VERSION });
  });

  it('removes the key entirely, so the next load looks like a first visit', () => {
    saveData([makeApplication()]);
    removeStoredData();

    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(loadData()).toEqual({ kind: 'empty' });
  });
});
