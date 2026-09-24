import type { ReactNode } from 'react';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';
import { useAppData } from '@/state/app-data-context';
import { useT } from '@/i18n/i18n-context';
import type { MessageKey } from '@/i18n/messages';
import { Button } from '@/components/ui/Button';
import { isolate } from '@/features/account/accountMessages';

const MESSAGE: Record<'save_failed' | 'unreachable' | 'session_ended', MessageKey> = {
  save_failed: 'sync.saveFailed',
  unreachable: 'sync.unreachable',
  session_ended: 'sync.sessionEnded',
};

/**
 * Says so when a change could not be saved to the account, or the session
 * ended. Never blocks the app: the data on screen is always usable.
 */
export function SyncNotice() {
  const { account, retrySync, dismissSyncProblem } = useAppData();
  const t = useT();
  const problem = account.problem;
  // While the account is loading or cannot be loaded, the full-page message
  // in the shell says it instead.
  if (!problem || account.phase === 'loading' || account.phase === 'unavailable') return null;

  return (
    <div
      role="alert"
      className="mb-5 flex flex-wrap items-start gap-3 rounded-xl border border-warning/30 bg-warning-soft px-4 py-3"
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
      <p className="min-w-0 flex-1 text-sm text-ink">{t(MESSAGE[problem.kind])}</p>
      <div className="flex items-center gap-1">
        {problem.kind === 'unreachable' ? (
          <Button size="sm" variant="secondary" onClick={retrySync}>
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            {t('sync.retry')}
          </Button>
        ) : null}
        <button
          type="button"
          onClick={dismissSyncProblem}
          className="rounded-md p-1 text-ink-muted hover:bg-surface hover:text-ink"
        >
          <X className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">{t('sync.dismiss')}</span>
        </button>
      </div>
    </div>
  );
}

/** Takes the place of the page while the account's data loads, or cannot. */
export function AccountGate({ children }: { children: ReactNode }) {
  const { account, retrySync, switchToDeviceData } = useAppData();
  const t = useT();
  const server = isolate(account.serverUrl ?? '');

  if (account.phase === 'loading') {
    return (
      <p role="status" className="py-16 text-center text-sm text-ink-muted">
        {t('sync.loading', { server })}
      </p>
    );
  }

  if (account.phase === 'unavailable') {
    return (
      <div role="alert" className="mx-auto flex max-w-lg flex-col items-center gap-4 py-16 text-center">
        <AlertTriangle className="h-8 w-8 text-warning" aria-hidden="true" />
        <div>
          <h1 className="text-lg font-semibold text-ink">{t('sync.unavailableTitle')}</h1>
          <p className="mt-1 text-sm text-ink-muted">{t('sync.unavailableDesc', { server })}</p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Button variant="primary" onClick={retrySync}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            {t('sync.retry')}
          </Button>
          <Button variant="secondary" onClick={switchToDeviceData}>
            {t('sync.useDevice')}
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
