import { z } from 'zod';
import type { Application } from '@/types';
import { applicationSchema, DATA_VERSION } from '@/lib/schemas';

export const EXPORT_APP_ID = 'careerflow';

export interface ExportEnvelope {
  app: typeof EXPORT_APP_ID;
  version: number;
  exportedAt: string;
  applications: Application[];
}

export function buildExport(applications: Application[]): ExportEnvelope {
  return {
    app: EXPORT_APP_ID,
    version: DATA_VERSION,
    exportedAt: new Date().toISOString(),
    applications,
  };
}

export function serializeExport(applications: Application[]): string {
  return JSON.stringify(buildExport(applications), null, 2);
}

export function exportFileName(now = new Date()): string {
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-');
  return `careerflow-export-${stamp}.json`;
}

/**
 * Accepts three shapes so a file exported by any version of the app, or hand
 * assembled, still imports:
 *   1. `{ app, version, exportedAt, applications }` — what we export.
 *   2. `{ version, applications }` — the raw persisted envelope.
 *   3. `[ ...applications ]` — a bare array.
 */
const importSchema = z.union([
  z.object({
    app: z.literal(EXPORT_APP_ID).optional(),
    version: z.number().int().positive(),
    exportedAt: z.string().optional(),
    applications: z.array(applicationSchema),
  }),
  z.object({ applications: z.array(applicationSchema) }),
  z.array(applicationSchema),
]);

export type ImportResult =
  | { ok: true; applications: Application[] }
  | { ok: false; message: string; details: string[] };

function describeIssue(issue: z.ZodIssue): string {
  const path = issue.path.length ? issue.path.join('.') : 'file';
  return `${path}: ${issue.message}`;
}

/**
 * Parses and validates an import file. The caller only ever replaces existing
 * data when `ok` is `true`, so a rejected import can never cause data loss.
 */
export function parseImport(text: string): ImportResult {
  const trimmed = text.trim();
  if (!trimmed) {
    return {
      ok: false,
      message: 'That file is empty.',
      details: ['Choose a CareerFlow JSON export.'],
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return {
      ok: false,
      message: 'That file is not valid JSON.',
      details: ['Check that you selected a CareerFlow export and that it is complete.'],
    };
  }

  const result = importSchema.safeParse(parsed);
  if (!result.success) {
    // `z.union` reports every branch; the richest branch is the most useful.
    const issues = result.error.issues;
    const unionIssue = issues.find((issue) => issue.code === 'invalid_union');
    const candidates =
      unionIssue && 'unionErrors' in unionIssue
        ? (unionIssue.unionErrors as z.ZodError[]).flatMap((error) => error.issues)
        : issues;

    const details = candidates.slice(0, 6).map(describeIssue);
    return {
      ok: false,
      message: 'That file does not look like a CareerFlow export.',
      details: details.length
        ? details
        : ['The records did not match the expected format.'],
    };
  }

  const applications = Array.isArray(result.data) ? result.data : result.data.applications;

  const version =
    !Array.isArray(result.data) && 'version' in result.data ? result.data.version : DATA_VERSION;
  if (version > DATA_VERSION) {
    return {
      ok: false,
      message: `This file uses data format ${version}, which this version of CareerFlow cannot read.`,
      details: ['Update CareerFlow, or export again from an older version.'],
    };
  }

  const seen = new Set<string>();
  for (const application of applications) {
    if (seen.has(application.id)) {
      return {
        ok: false,
        message: 'That file contains duplicate application IDs.',
        details: [`Application ID "${application.id}" appears more than once.`],
      };
    }
    seen.add(application.id);
  }

  return { ok: true, applications: applications as Application[] };
}

/** Triggers a client-side download without any server round trip. */
export function downloadJson(fileName: string, contents: string): void {
  const blob = new Blob([contents], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
