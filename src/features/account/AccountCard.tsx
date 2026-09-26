import { useState, type FormEvent } from 'react';
import { AlertTriangle, CloudUpload, LogIn, LogOut, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Field, Input } from '@/components/ui/Field';
import { useAppData } from '@/state/app-data-context';
import { useT } from '@/i18n/i18n-context';
import { plural } from '@/i18n/labels';
import { lastServerUrl } from '@/lib/sync';
import { isolate, passwordProblem, signInErrorText } from '@/features/account/accountMessages';
import { SyncStatus } from '@/features/account/SyncStatus';

/**
 * Signing in to a CareerFlow server, or out of it.
 *
 * Optional by design: without an account the app keeps everything in this
 * browser, as it always has. With one, the same data lives on the server.
 */
export function AccountCard() {
  const { account } = useAppData();
  const t = useT();

  return (
    <Card>
      <CardHeader
        title={t('account.title')}
        description={account.signedIn ? undefined : t('account.localDesc')}
      />
      <CardBody>{account.signedIn ? <SignedIn /> : <SignInForm />}</CardBody>
    </Card>
  );
}

function SignInForm() {
  const { signIn } = useAppData();
  const t = useT();
  const [serverUrl, setServerUrl] = useState(lastServerUrl);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (createAccount: boolean) => {
    setError(null);
    if (!email.trim() || !password) {
      setError(t('account.errorFields'));
      return;
    }
    if (createAccount) {
      const problem = passwordProblem(password, email);
      if (problem) {
        setError(t(problem));
        return;
      }
    }
    setBusy(true);
    try {
      await signIn({ serverUrl, email: email.trim(), password, createAccount });
    } catch (caught) {
      setError(signInErrorText(t, caught));
      setBusy(false);
    }
    // On success this form unmounts; there is no state left to reset.
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void submit(false);
  };

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4" aria-busy={busy}>
      <Field label={t('account.server')} hint={t('account.serverHint')}>
        {(aria) => (
          <Input
            {...aria}
            value={serverUrl}
            onChange={(event) => setServerUrl(event.target.value)}
            type="url"
            inputMode="url"
            dir="ltr"
            autoComplete="url"
          />
        )}
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('account.email')}>
          {(aria) => (
            <Input
              {...aria}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              dir="ltr"
              autoComplete="email"
            />
          )}
        </Field>
        <Field label={t('account.password')} hint={t('account.passwordHint')}>
          {(aria) => (
            <Input
              {...aria}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              autoComplete="current-password"
            />
          )}
        </Field>
      </div>

      {error ? (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-danger/30 bg-danger-soft px-4 py-3"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-danger" aria-hidden="true" />
          <p className="text-sm text-ink">{error}</p>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" variant="primary" disabled={busy}>
          <LogIn className="h-4 w-4" aria-hidden="true" />
          {t('account.signIn')}
        </Button>
        <Button variant="secondary" disabled={busy} onClick={() => void submit(true)}>
          <UserPlus className="h-4 w-4" aria-hidden="true" />
          {t('account.createAccount')}
        </Button>
        {busy ? (
          <span role="status" className="text-sm text-ink-muted">
            {t('account.working')}
          </span>
        ) : null}
      </div>
    </form>
  );
}

function SignedIn() {
  const { account, signOut, copyDeviceDataToAccount, dismissCopyOffer } = useAppData();
  const t = useT();
  const [busy, setBusy] = useState(false);

  const leave = async (everywhere: boolean) => {
    setBusy(true);
    await signOut(everywhere);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-ink">
          {t('account.signedInAs', { email: isolate(account.email ?? '') })}
        </p>
        <p className="text-sm text-ink-muted">
          {t('account.signedInDesc', { server: isolate(account.serverUrl ?? '') })}
        </p>
        <SyncStatus className="mt-1" />
      </div>

      {account.offline && account.unsent > 0 ? (
        <p className="flex items-start gap-2 text-sm text-ink-muted">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
          {t('account.offlineSignOutWarning')}
        </p>
      ) : null}

      {account.copyOffer !== null ? (
        <div className="flex flex-col gap-3 rounded-xl border border-brand/30 bg-brand-soft px-4 py-3">
          <div>
            <p className="text-sm font-medium text-ink">{t('account.copyTitle')}</p>
            <p className="text-sm text-ink-muted">
              {plural(t, account.copyOffer, 'account.copyDescOne', 'account.copyDesc')}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" size="sm" onClick={copyDeviceDataToAccount}>
              <CloudUpload className="h-4 w-4" aria-hidden="true" />
              {t('account.copy')}
            </Button>
            <Button variant="ghost" size="sm" onClick={dismissCopyOffer}>
              {t('account.copyDismiss')}
            </Button>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" disabled={busy} onClick={() => void leave(false)}>
          <LogOut className="h-4 w-4" aria-hidden="true" />
          {t('account.signOut')}
        </Button>
        <Button variant="ghost" disabled={busy} onClick={() => void leave(true)}>
          {t('account.signOutEverywhere')}
        </Button>
      </div>
    </div>
  );
}
