import { describe, expect, it } from 'vitest';
import {
  buildExport,
  exportFileName,
  parseImport,
  serializeExport,
  type ImportResult,
} from '@/lib/transfer';
import { DATA_VERSION } from '@/lib/schemas';
import { makeApplication } from '@/test/factories';

/** Asserts the import was rejected and hands back the failure for inspection. */
function rejection(result: ImportResult): Extract<ImportResult, { ok: false }> {
  if (result.ok) {
    throw new Error('Expected the import to be rejected, but it succeeded.');
  }
  return result;
}

/** Asserts the import succeeded and hands back the parsed records. */
function accepted(result: ImportResult): Extract<ImportResult, { ok: true }> {
  if (!result.ok) {
    throw new Error(`Expected the import to succeed, but it failed: ${result.message}`);
  }
  return result;
}

const applications = [
  makeApplication({ company: 'Northwind Analytics', status: 'interview' }),
  makeApplication({ company: 'Lumen Health', status: 'applied' }),
];

describe('export', () => {
  it('wraps the records in an identifiable, versioned envelope', () => {
    const envelope = buildExport(applications);

    expect(envelope.app).toBe('careerflow');
    expect(envelope.version).toBe(DATA_VERSION);
    expect(envelope.applications).toHaveLength(2);
    expect(Number.isNaN(new Date(envelope.exportedAt).getTime())).toBe(false);
  });

  it('names the file with the current date', () => {
    expect(exportFileName(new Date(2026, 2, 4))).toBe('careerflow-export-2026-03-04.json');
  });
});

describe('parseImport — round trip', () => {
  it('accepts a file produced by export and returns the same records', () => {
    const result = accepted(parseImport(serializeExport(applications)));

    expect(result.applications).toHaveLength(2);
    expect(result.applications[0]?.company).toBe('Northwind Analytics');
  });

  it('accepts a bare persisted envelope', () => {
    const result = accepted(parseImport(JSON.stringify({ version: DATA_VERSION, applications })));
    expect(result.applications).toHaveLength(2);
  });

  it('accepts a bare array of applications', () => {
    const result = accepted(parseImport(JSON.stringify(applications)));
    expect(result.applications).toHaveLength(2);
  });

  it('accepts an export with no applications', () => {
    expect(accepted(parseImport(serializeExport([]))).applications).toEqual([]);
  });
});

describe('parseImport — rejection', () => {
  it('rejects an empty file', () => {
    expect(rejection(parseImport('   ')).message).toMatch(/empty/i);
  });

  it('rejects malformed JSON with an explanation', () => {
    expect(rejection(parseImport('{ "applications": [')).message).toMatch(/not valid JSON/i);
  });

  it('rejects JSON that is not a CareerFlow export', () => {
    const failure = rejection(parseImport(JSON.stringify({ hello: 'world' })));
    expect(failure.message).toMatch(/does not look like/i);
    expect(failure.details.length).toBeGreaterThan(0);
  });

  it('rejects a record that is missing required fields, and says which', () => {
    const failure = rejection(
      parseImport(JSON.stringify({ version: DATA_VERSION, applications: [{ id: 'x' }] })),
    );
    expect(failure.details.join(' ')).toMatch(/company|jobTitle|status/);
  });

  it('rejects an unknown status rather than silently dropping the record', () => {
    const broken = [{ ...makeApplication(), status: 'ghosted' }];
    expect(
      rejection(parseImport(JSON.stringify({ version: DATA_VERSION, applications: broken }))),
    ).toBeTruthy();
  });

  it('rejects an invalid calendar date', () => {
    const broken = [{ ...makeApplication(), appliedDate: '2026-02-31' }];
    expect(
      rejection(parseImport(JSON.stringify({ version: DATA_VERSION, applications: broken }))),
    ).toBeTruthy();
  });

  it('rejects a file written by a newer data format', () => {
    const failure = rejection(
      parseImport(JSON.stringify({ app: 'careerflow', version: DATA_VERSION + 1, applications: [] })),
    );
    expect(failure.message).toMatch(/data format/i);
  });

  it('rejects duplicate application ids', () => {
    const duplicate = makeApplication({ id: 'same' });
    const failure = rejection(
      parseImport(JSON.stringify({ version: DATA_VERSION, applications: [duplicate, { ...duplicate }] })),
    );
    expect(failure.message).toMatch(/duplicate/i);
  });

  it('never returns records alongside a failure, so callers cannot lose data', () => {
    expect(rejection(parseImport('not json at all'))).not.toHaveProperty('applications');
  });
});
