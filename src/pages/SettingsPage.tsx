import { useRef, useState } from 'react';
import {
  AlertTriangle,
  Check,
  Download,
  Monitor,
  Moon,
  RotateCcw,
  Sun,
  Trash2,
  Upload,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useAppData } from '@/state/app-data-context';
import { useTheme } from '@/state/theme-context';
import type { ThemeMode } from '@/state/theme-context';
import { downloadJson, exportFileName, parseImport, serializeExport } from '@/lib/transfer';
import { DEMO_APPLICATION_COUNT } from '@/lib/demoData';
import { DATA_VERSION } from '@/lib/schemas';
import { STORAGE_KEY } from '@/lib/storage';
import { pluralize } from '@/lib/format';
import type { Application } from '@/types';
import { cn } from '@/lib/cn';

type ImportFeedback =
  | { kind: 'idle' }
  | { kind: 'error'; message: string; details: string[] }
  | { kind: 'success'; message: string };

const THEME_OPTIONS: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
];

export function SettingsPage() {
  const { applications, replaceAll, clearAll, resetToDemo } = useAppData();
  const { mode, setMode } = useTheme();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [feedback, setFeedback] = useState<ImportFeedback>({ kind: 'idle' });
  const [pendingImport, setPendingImport] = useState<Application[] | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const handleExport = () => {
    downloadJson(exportFileName(), serializeExport(applications));
  };

  const handleFile = async (file: File) => {
    setFeedback({ kind: 'idle' });
    let text: string;
    try {
      text = await file.text();
    } catch {
      setFeedback({
        kind: 'error',
        message: 'That file could not be read.',
        details: ['Try exporting again, or choose a different file.'],
      });
      return;
    }

    const result = parseImport(text);
    if (!result.ok) {
      // Existing data is untouched: nothing is replaced unless parsing succeeds.
      setFeedback({ kind: 'error', message: result.message, details: result.details });
      return;
    }
    setPendingImport(result.applications);
  };

  const confirmImport = () => {
    if (!pendingImport) return;
    const count = pendingImport.length;
    replaceAll(pendingImport);
    setPendingImport(null);
    setFeedback({
      kind: 'success',
      message: `Imported ${count} ${pluralize(count, 'application')}. Your previous data has been replaced.`,
    });
  };

  return (
    <>
      <PageHeader
        title="Settings"
        description="Appearance, and everything to do with the data CareerFlow keeps in this browser."
      />

      <div className="flex max-w-3xl flex-col gap-5">
        <Card>
          <CardHeader title="Theme" description="Remembered in this browser." />
          <CardBody>
            <div
              className="inline-flex flex-wrap gap-2"
              role="radiogroup"
              aria-label="Colour theme"
            >
              {THEME_OPTIONS.map((option) => {
                const selected = mode === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setMode(option.value)}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors',
                      selected
                        ? 'border-brand/30 bg-brand-soft text-brand'
                        : 'border-line bg-surface text-ink-muted hover:bg-surface-muted hover:text-ink',
                    )}
                  >
                    <option.icon className="h-4 w-4" aria-hidden="true" />
                    {option.label}
                    {selected ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : null}
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-sm text-ink-muted">
              “System” follows your operating system’s light or dark setting and updates when it
              changes.
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Where your data lives"
            description="CareerFlow has no account, no server and no sync."
          />
          <CardBody className="flex flex-col gap-3 text-sm text-ink-muted">
            <p>
              Everything you enter is stored in this browser’s local storage under the key{' '}
              <code className="rounded bg-surface-muted px-1.5 py-0.5 text-xs text-ink">
                {STORAGE_KEY}
              </code>{' '}
              (data format version {DATA_VERSION}). Nothing is uploaded anywhere.
            </p>
            <p>
              That means your applications are <strong className="text-ink">not shared</strong>{' '}
              between devices or browsers, and clearing your browser’s site data — or using private
              browsing — will remove them. Export a JSON file before switching machines or clearing
              your browser.
            </p>
            <p>
              You are currently tracking{' '}
              <strong className="text-ink">
                {applications.length} {pluralize(applications.length, 'application')}
              </strong>
              .
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Export and import"
            description="A plain JSON file you can back up, move to another browser, or keep in version control."
          />
          <CardBody className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              <Button variant="primary" onClick={handleExport} disabled={applications.length === 0}>
                <Download className="h-4 w-4" aria-hidden="true" />
                Export JSON
              </Button>

              <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4" aria-hidden="true" />
                Import JSON
              </Button>

              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                className="sr-only"
                aria-label="Choose a CareerFlow JSON file to import"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void handleFile(file);
                  // Reset so choosing the same file twice fires a change event.
                  event.target.value = '';
                }}
              />
            </div>

            <p className="text-sm text-ink-muted">
              Importing <strong className="text-ink">replaces</strong> everything currently stored.
              You will be asked to confirm first, and an invalid file is rejected without touching
              your existing data.
            </p>

            {feedback.kind === 'error' ? (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-xl border border-danger/30 bg-danger-soft px-4 py-3"
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-danger" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">{feedback.message}</p>
                  <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-ink-muted">
                    {feedback.details.map((detail) => (
                      <li key={detail} className="break-words">
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : null}

            {feedback.kind === 'success' ? (
              <div
                role="status"
                className="flex items-start gap-3 rounded-xl border border-success/30 bg-success-soft px-4 py-3"
              >
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
                <p className="text-sm text-ink">{feedback.message}</p>
              </div>
            ) : null}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Reset"
            description="Both actions are immediate and cannot be undone."
          />
          <CardBody className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink">Restore the sample data</p>
                <p className="text-sm text-ink-muted">
                  Replaces everything with the {DEMO_APPLICATION_COUNT} fictional applications shown
                  on a first visit.
                </p>
              </div>
              <Button variant="secondary" onClick={() => setConfirmReset(true)}>
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Reset to demo data
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink">Clear all records</p>
                <p className="text-sm text-ink-muted">
                  Removes every application and leaves CareerFlow empty. The sample data is{' '}
                  <strong className="text-ink">not</strong> restored afterwards.
                </p>
              </div>
              <Button
                variant="secondary"
                onClick={() => setConfirmClear(true)}
                disabled={applications.length === 0}
                className="text-danger hover:bg-danger-soft"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Clear all data
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>

      <ConfirmDialog
        open={pendingImport !== null}
        title="Replace your data with this file?"
        description={
          pendingImport
            ? `The file contains ${pendingImport.length} ${pluralize(pendingImport.length, 'application')}. Importing replaces the ${applications.length} currently stored in this browser.`
            : ''
        }
        confirmLabel="Replace data"
        destructive
        onConfirm={confirmImport}
        onCancel={() => setPendingImport(null)}
      />

      <ConfirmDialog
        open={confirmClear}
        title="Clear all records?"
        description={`All ${applications.length} ${pluralize(applications.length, 'application')}, with their interviews, follow-ups and timelines, will be removed from this browser.`}
        confirmLabel="Clear everything"
        destructive
        onConfirm={() => {
          clearAll();
          setConfirmClear(false);
          setFeedback({ kind: 'idle' });
        }}
        onCancel={() => setConfirmClear(false)}
      />

      <ConfirmDialog
        open={confirmReset}
        title="Restore the sample data?"
        description={`Your ${applications.length} current ${pluralize(applications.length, 'application')} will be replaced by ${DEMO_APPLICATION_COUNT} fictional examples.`}
        confirmLabel="Restore sample data"
        destructive
        onConfirm={() => {
          resetToDemo();
          setConfirmReset(false);
          setFeedback({ kind: 'idle' });
        }}
        onCancel={() => setConfirmReset(false)}
      />
    </>
  );
}
