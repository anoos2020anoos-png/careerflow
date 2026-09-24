import { Check, Loader2 } from 'lucide-react';
import { useAppData } from '@/state/app-data-context';
import { useT } from '@/i18n/i18n-context';
import { cn } from '@/lib/cn';

/**
 * "Saving…" / "All changes saved", while signed in. Announced politely to
 * screen readers, since it changes after nearly every edit. Nothing at all when
 * signed out: then there is nowhere else the data could be.
 */
export function SyncStatus({ className }: { className?: string }) {
  const { account } = useAppData();
  const t = useT();
  if (!account.signedIn || account.phase !== 'ready') return null;

  return (
    <p
      role="status"
      aria-live="polite"
      className={cn('inline-flex items-center gap-1.5 text-xs text-ink-muted', className)}
    >
      {account.saving ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
          {t('account.statusSaving')}
        </>
      ) : (
        <>
          <Check className="h-3.5 w-3.5 text-success" aria-hidden="true" />
          {t('account.statusSaved')}
        </>
      )}
    </p>
  );
}
