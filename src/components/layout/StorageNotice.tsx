import { AlertTriangle, X } from 'lucide-react';
import { useAppData } from '@/state/app-data-context';
import { useT } from '@/i18n/i18n-context';

/** Surfaces unreadable stored data or a failed write, without blocking the app. */
export function StorageNotice() {
  const { storageNotice, dismissStorageNotice, storageAvailable } = useAppData();
  const t = useT();

  const message = !storageAvailable ? t('storage.blocked') : storageNotice;

  if (!message) return null;

  return (
    <div
      role="status"
      className="mb-5 flex items-start gap-3 rounded-xl border border-warning/30 bg-warning-soft px-4 py-3"
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
      <p className="flex-1 text-sm text-ink">{message}</p>
      {storageNotice && storageAvailable ? (
        <button
          type="button"
          onClick={dismissStorageNotice}
          className="rounded-md p-1 text-ink-muted hover:bg-surface hover:text-ink"
        >
          <X className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">{t('storage.dismiss')}</span>
        </button>
      ) : null}
    </div>
  );
}
