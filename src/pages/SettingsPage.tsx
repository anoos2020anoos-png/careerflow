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
import { useI18n } from '@/i18n/i18n-context';
import { plural } from '@/i18n/labels';
import { LOCALES, LOCALE_NAMES, type Locale } from '@/i18n/messages';
import type { MessageKey } from '@/i18n/messages';
import { downloadJson, exportFileName, parseImport, serializeExport } from '@/lib/transfer';
import { DEMO_APPLICATION_COUNT } from '@/lib/demoData';
import { DATA_VERSION } from '@/lib/schemas';
import { STORAGE_KEY } from '@/lib/storage';

import type { Application, CompanyDetails, Profile } from '@/types';
import { cn } from '@/lib/cn';
import { AccountCard } from '@/features/account/AccountCard';
import { isolate } from '@/features/account/accountMessages';

/** What a validated file carries: the records, and a profile if it had one. */
interface PendingImport {
  applications: Application[];
  profile?: Profile;
  companies?: CompanyDetails[];
}

type ImportFeedback =
  | { kind: 'idle' }
  | { kind: 'error'; message: string; details: string[] }
  | { kind: 'success'; message: string };

const THEME_OPTIONS: { value: ThemeMode; labelKey: MessageKey; icon: typeof Sun }[] = [
  { value: 'light', labelKey: 'settings.light', icon: Sun },
  { value: 'dark', labelKey: 'settings.dark', icon: Moon },
  { value: 'system', labelKey: 'settings.system', icon: Monitor },
];

/** The shared look of the theme and language choosers. */
function ChoiceButton({
  selected,
  onClick,
  children,
  lang,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  lang?: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      lang={lang}
      className={cn(
        'inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors',
        selected
          ? 'border-brand/30 bg-brand-soft text-brand'
          : 'border-line bg-surface text-ink-muted hover:bg-surface-muted hover:text-ink',
      )}
    >
      {children}
      {selected ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : null}
    </button>
  );
}

export function SettingsPage() {
  const { applications, profile, companies, replaceAll, clearAll, resetToDemo, account } =
    useAppData();
  const { mode, setMode } = useTheme();
  const { locale, setLocale, t } = useI18n();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [feedback, setFeedback] = useState<ImportFeedback>({ kind: 'idle' });
  const [pendingImport, setPendingImport] = useState<PendingImport | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const handleExport = () => {
    downloadJson(exportFileName(), serializeExport(applications, profile, companies));
  };

  const handleFile = async (file: File) => {
    setFeedback({ kind: 'idle' });
    let text: string;
    try {
      text = await file.text();
    } catch {
      setFeedback({
        kind: 'error',
        message: t('settings.importUnreadable'),
        details: [t('settings.importUnreadableHint')],
      });
      return;
    }

    const result = parseImport(text);
    if (!result.ok) {
      // Existing data is untouched: nothing is replaced unless parsing succeeds.
      setFeedback({ kind: 'error', message: result.message, details: result.details });
      return;
    }
    setPendingImport({
      applications: result.applications,
      profile: result.profile,
      companies: result.companies,
    });
  };

  const confirmImport = () => {
    if (!pendingImport) return;
    const count = pendingImport.applications.length;
    replaceAll(pendingImport.applications, pendingImport.profile, pendingImport.companies);
    setPendingImport(null);
    setFeedback({
      kind: 'success',
      message: plural(t, count, 'settings.importSuccessOne', 'settings.importSuccess'),
    });
  };

  return (
    <>
      <PageHeader title={t('settings.title')} description={t('settings.description')} />

      <div className="flex max-w-3xl flex-col gap-5">
        <AccountCard />

        <Card>
          <CardHeader title={t('settings.language')} description={t('settings.languageDesc')} />
          <CardBody>
            <div
              className="inline-flex flex-wrap gap-2"
              role="radiogroup"
              aria-label={t('settings.languageGroup')}
            >
              {LOCALES.map((option: Locale) => (
                <ChoiceButton
                  key={option}
                  selected={locale === option}
                  onClick={() => setLocale(option)}
                  lang={option}
                >
                  {LOCALE_NAMES[option]}
                </ChoiceButton>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title={t('settings.theme')} description={t('settings.themeDesc')} />
          <CardBody>
            <div
              className="inline-flex flex-wrap gap-2"
              role="radiogroup"
              aria-label={t('settings.themeGroup')}
            >
              {THEME_OPTIONS.map((option) => (
                <ChoiceButton
                  key={option.value}
                  selected={mode === option.value}
                  onClick={() => setMode(option.value)}
                >
                  <option.icon className="h-4 w-4" aria-hidden="true" />
                  {t(option.labelKey)}
                </ChoiceButton>
              ))}
            </div>
            <p className="mt-3 text-sm text-ink-muted">{t('settings.themeNote')}</p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title={t('settings.storage')}
            description={
              account.signedIn ? t('settings.storageAccountDesc') : t('settings.storageDesc')
            }
          />
          <CardBody className="flex flex-col gap-3 text-sm text-ink-muted">
            {account.signedIn ? (
              <p>
                {t('settings.storageAccountBody', { server: isolate(account.serverUrl ?? '') })}
              </p>
            ) : (
              <>
                <p>
                  {t('settings.storageBody1', {
                    key: STORAGE_KEY,
                    version: DATA_VERSION,
                  })}
                </p>
                <p>{t('settings.storageBody2')}</p>
              </>
            )}
            <p className="font-medium text-ink">
              {plural(
                t,
                applications.length,
                'settings.storageCountOne',
                'settings.storageCount',
              )}
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title={t('settings.transfer')} description={t('settings.transferDesc')} />
          <CardBody className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              <Button variant="primary" onClick={handleExport} disabled={applications.length === 0}>
                <Download className="h-4 w-4" aria-hidden="true" />
                {t('settings.export')}
              </Button>

              <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4" aria-hidden="true" />
                {t('settings.import')}
              </Button>

              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                className="sr-only"
                aria-label={t('settings.importAria')}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void handleFile(file);
                  // Reset so choosing the same file twice fires a change event.
                  event.target.value = '';
                }}
              />
            </div>

            <p className="text-sm text-ink-muted">{t('settings.importNote')}</p>

            {feedback.kind === 'error' ? (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-xl border border-danger/30 bg-danger-soft px-4 py-3"
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-danger" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">{feedback.message}</p>
                  <ul className="mt-1 list-disc space-y-0.5 ps-4 text-xs text-ink-muted">
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
          <CardHeader title={t('settings.reset')} description={t('settings.resetDesc')} />
          <CardBody className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink">{t('settings.restore')}</p>
                <p className="text-sm text-ink-muted">
                  {t('settings.restoreDesc', { count: DEMO_APPLICATION_COUNT })}
                </p>
              </div>
              <Button variant="secondary" onClick={() => setConfirmReset(true)}>
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                {t('settings.restoreButton')}
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink">{t('settings.clear')}</p>
                <p className="text-sm text-ink-muted">{t('settings.clearDesc')}</p>
              </div>
              <Button
                variant="secondary"
                onClick={() => setConfirmClear(true)}
                disabled={applications.length === 0}
                className="text-danger hover:bg-danger-soft"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                {t('settings.clearButton')}
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>

      <ConfirmDialog
        open={pendingImport !== null}
        title={t('settings.importConfirmTitle')}
        description={
          pendingImport
            ? t('settings.importConfirmDesc', {
                incoming: pendingImport.applications.length,
                current: applications.length,
              })
            : ''
        }
        confirmLabel={t('settings.importConfirm')}
        destructive
        onConfirm={confirmImport}
        onCancel={() => setPendingImport(null)}
      />

      <ConfirmDialog
        open={confirmClear}
        title={t('settings.clearConfirmTitle')}
        description={plural(
          t,
          applications.length,
          'settings.clearConfirmDescOne',
          'settings.clearConfirmDesc',
        )}
        confirmLabel={t('settings.clearConfirm')}
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
        title={t('settings.restoreConfirmTitle')}
        description={t('settings.restoreConfirmDesc', {
          count: applications.length,
          demo: DEMO_APPLICATION_COUNT,
        })}
        confirmLabel={t('settings.restoreConfirm')}
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
