import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Application, ApplicationStatus, Profile, SalaryExpectation } from '@/types';
import { emptyProfile } from '@/types';
import type {
  ApplicationFormValues,
  InterviewFormValues,
  QualificationFormValues,
  RequirementFormValues,
  TaskFormValues,
} from '@/lib/schemas';
import {
  applyFormValues,
  createApplication,
  withHeadline,
  withInterview,
  withNotes,
  withQualification,
  withRequirement,
  withRequirementToggled,
  withSalaryExpectation,
  withStatus,
  withTask,
  withTaskToggled,
  withoutInterview,
  withoutQualification,
  withoutRequirement,
  withoutTask,
} from '@/lib/applications';
import { createDemoApplications, createDemoCompanies } from '@/lib/demoData';
import {
  withCompanyDetails,
  withoutCompanyDetails,
  type CompanyDetailsInput,
} from '@/lib/companies';
import { isStorageAvailable, loadData, removeStoredData, saveData } from '@/lib/storage';
import {
  ApiError,
  createApiClient,
  login,
  logout,
  normalizeServerUrl,
  register,
  type ApiClient,
} from '@/lib/api';
import {
  SyncQueue,
  dataOperations,
  fromServer,
  loadAccountData,
  readSession,
  removeCompanyOperation,
  replaceAllOperation,
  saveCompanyOperation,
  writeSession,
  type AppData,
  type Session,
  type SyncOperation,
} from '@/lib/sync';
import {
  AppDataContext,
  type AccountState,
  type AppDataValue,
  type SignInInput,
  type SyncProblem,
} from '@/state/app-data-context';

interface InitialState extends AppData {
  notice: string | null;
}

function readInitialState(): InitialState {
  const blank = emptyProfile(new Date().toISOString());
  const outcome = loadData();
  switch (outcome.kind) {
    case 'loaded':
      return {
        applications: outcome.data.applications,
        profile: outcome.data.profile,
        companies: outcome.data.companies,
        notice: null,
      };
    case 'unreadable':
      return {
        applications: [],
        profile: blank,
        companies: [],
        notice: `${outcome.reason} CareerFlow started with an empty list and kept a copy of the original data in your browser storage under "careerflow:data:unreadable-backup".`,
      };
    case 'empty':
    default:
      // First visit: seed fictional sample data so the app is explorable. The
      // profile stays empty on purpose — inventing someone's qualifications
      // would be putting words in their mouth, and the requirements panel
      // explains itself without it.
      return {
        applications: createDemoApplications(),
        profile: blank,
        companies: createDemoCompanies(),
        notice: null,
      };
  }
}

function emptyData(): AppData {
  return { applications: [], profile: emptyProfile(new Date().toISOString()), companies: [] };
}

function problemFrom(error: unknown, kind: SyncProblem['kind']): SyncProblem {
  return error instanceof ApiError
    ? { kind, code: error.code, message: error.message }
    : { kind, code: 'unknown', message: String(error) };
}

const isUnauthorized = (error: unknown) => error instanceof ApiError && error.status === 401;

/**
 * Holds everything the app shows, and decides where it is kept.
 *
 * **Signed out** (the default), data lives in this browser's local storage,
 * exactly as it always has.
 *
 * **Signed in** to a CareerFlow server from Settings, the same data belongs to
 * the account instead. Each change is still applied on screen at once, by the
 * same pure functions; it is then sent to the server in the background (see
 * `lib/sync.ts`), whose answer replaces the local copy. If the server refuses a
 * change, the account's data is reloaded, so the screen never keeps showing
 * something that was not saved. Local storage is left untouched while signed
 * in, and is what comes back on signing out.
 */
export function AppDataProvider({ children }: { children: ReactNode }) {
  const [initialSession] = useState(() => readSession());
  const [initial] = useState<InitialState>(() =>
    initialSession ? { ...emptyData(), notice: null } : readInitialState(),
  );

  const [data, setData] = useState<AppData>(initial);
  const dataRef = useRef<AppData>(initial);
  const [notice, setNotice] = useState<string | null>(initial.notice);
  const storageAvailable = useMemo(() => isStorageAvailable(), []);
  const quotaWarned = useRef(false);

  const [session, setSession] = useState<Session | null>(initialSession);
  const sessionRef = useRef<Session | null>(initialSession);
  const [phase, setPhase] = useState<AccountState['phase']>(initialSession ? 'loading' : 'local');
  const [pending, setPending] = useState(0);
  const [problem, setProblem] = useState<SyncProblem | null>(null);
  /** What was on this device when the user signed in to an empty account. */
  const [copyOffer, setCopyOffer] = useState<AppData | null>(null);

  const clientRef = useRef<ApiClient | null>(null);
  const queueRef = useRef<SyncQueue | null>(null);
  const loadGeneration = useRef(0);

  const show = useCallback((next: AppData) => {
    dataRef.current = next;
    setData(next);
  }, []);

  // Local storage is written only while signed out. The account's data never
  // overwrites what this browser holds on its own.
  useEffect(() => {
    if (session || !storageAvailable) return;
    const saved = saveData(data.applications, data.profile, data.companies);
    if (!saved && !quotaWarned.current) {
      quotaWarned.current = true;
      setNotice(
        'CareerFlow could not save to this browser (storage may be full or blocked). Your changes are held in memory and will be lost when you close the tab.',
      );
    }
  }, [data, session, storageAvailable]);

  /** Back to this browser's own data, optionally explaining why. */
  const leaveAccount = useCallback(
    (reason: SyncProblem | null) => {
      queueRef.current?.clear();
      queueRef.current = null;
      clientRef.current = null;
      loadGeneration.current += 1;
      sessionRef.current = null;
      writeSession(null);
      setSession(null);
      setPhase('local');
      setPending(0);
      setCopyOffer(null);
      setProblem(reason);
      const local = readInitialState();
      setNotice(local.notice);
      show(local);
    },
    [show],
  );

  /** Replaces what is on screen with the account's data as the server has it. */
  const reload = useCallback(async () => {
    const client = clientRef.current;
    if (!client) return;
    const generation = ++loadGeneration.current;
    try {
      const next = await loadAccountData(client);
      if (generation !== loadGeneration.current) return;
      // A change made while this was loading is on its way to the server;
      // its answer will bring the up-to-date record.
      if ((queueRef.current?.pending ?? 0) > 0) return;
      show(next);
      setPhase('ready');
    } catch (error) {
      if (generation !== loadGeneration.current) return;
      if (isUnauthorized(error)) {
        leaveAccount({ kind: 'session_ended', code: 'unauthenticated', message: '' });
        return;
      }
      setPhase((current) => (current === 'loading' ? 'unavailable' : current));
      setProblem(problemFrom(error, 'unreachable'));
    }
  }, [leaveAccount, show]);

  const applyResult = useCallback(
    (operation: SyncOperation, body: unknown, latest: boolean) => {
      if (!latest) return;
      if (operation.result === 'application') {
        const application = (body as { application?: Application } | undefined)?.application;
        if (!application) return;
        const current = dataRef.current;
        show({
          ...current,
          applications: current.applications.map((entry) =>
            entry.id === application.id ? fromServer(application) : entry,
          ),
        });
      } else if (operation.result === 'profile') {
        const profile = (body as { profile?: Profile } | undefined)?.profile;
        if (profile) show({ ...dataRef.current, profile });
      } else if (operation.result === 'reload') {
        void reload();
      }
    },
    [reload, show],
  );

  /** Starts working against an account: its client, queue, and data. */
  const enterAccount = useCallback(
    (next: Session) => {
      queueRef.current?.clear();
      const client = createApiClient({ baseUrl: next.serverUrl, token: next.token });
      clientRef.current = client;
      queueRef.current = new SyncQueue({
        send: async (operation) => {
          try {
            return await client.request(operation.method, operation.path, operation.body);
          } catch (error) {
            if (operation.allowNotFound && error instanceof ApiError && error.status === 404) {
              return undefined;
            }
            throw error;
          }
        },
        onResult: applyResult,
        onError: (_operation, error) => {
          if (isUnauthorized(error)) {
            leaveAccount({ kind: 'session_ended', code: 'unauthenticated', message: '' });
            return;
          }
          setProblem(problemFrom(error, 'save_failed'));
          void reload();
        },
        onPendingChange: setPending,
      });
      sessionRef.current = next;
      setSession(next);
    },
    [applyResult, leaveAccount, reload],
  );

  // A session remembered from last time: pick it up and load the account.
  useEffect(() => {
    if (initialSession && !clientRef.current) {
      enterAccount(initialSession);
      void reload();
    }
  }, [initialSession, enterAccount, reload]);

  /**
   * Applies a change on screen at once and, when signed in, sends it. By
   * default the requests are worked out by comparing before and after.
   */
  const commit = useCallback(
    (next: AppData, operations?: SyncOperation[]) => {
      const before = dataRef.current;
      if (next === before) return;
      show(next);
      if (sessionRef.current && queueRef.current) {
        queueRef.current.push(operations ?? dataOperations(before, next));
      }
    },
    [show],
  );

  const change = useCallback(
    (transform: (current: AppData) => AppData) => commit(transform(dataRef.current)),
    [commit],
  );

  const updateOne = useCallback(
    (id: string, transform: (application: Application) => Application) => {
      change((current) => ({
        ...current,
        applications: current.applications.map((application) =>
          application.id === id ? transform(application) : application,
        ),
      }));
    },
    [change],
  );

  const signIn = useCallback(
    async ({ serverUrl, email, password, createAccount }: SignInInput) => {
      const baseUrl = normalizeServerUrl(serverUrl);
      if (!baseUrl) throw new ApiError(0, 'invalid_url', 'Enter an http:// or https:// address.');
      const anonymous = createApiClient({ baseUrl });
      const result = createAccount
        ? await register(anonymous, email, password)
        : await login(anonymous, email, password);

      const next: Session = {
        serverUrl: baseUrl,
        token: result.token,
        email: result.user.email,
        expiresAt: result.expiresAt,
      };
      const onThisDevice = sessionRef.current ? null : dataRef.current;
      writeSession(next);
      enterAccount(next);
      setProblem(null);
      setNotice(null);
      setPhase('loading');
      show(emptyData());

      const client = clientRef.current;
      if (!client) return;
      try {
        const account = await loadAccountData(client);
        show(account);
        setPhase('ready');
        const accountIsEmpty = account.applications.length === 0 && account.companies.length === 0;
        if (accountIsEmpty && onThisDevice && onThisDevice.applications.length > 0) {
          setCopyOffer(onThisDevice);
        }
      } catch (error) {
        setPhase('unavailable');
        setProblem(problemFrom(error, 'unreachable'));
      }
    },
    [enterAccount, show],
  );

  const signOut = useCallback(
    async (everywhere = false) => {
      const client = clientRef.current;
      await queueRef.current?.idle();
      if (client) {
        try {
          await logout(client, everywhere);
        } catch {
          // Signing out here does not depend on the server answering: the
          // token is forgotten either way.
        }
      }
      leaveAccount(null);
    },
    [leaveAccount],
  );

  const account = useMemo<AccountState>(
    () =>
      session
        ? {
            signedIn: true,
            email: session.email,
            serverUrl: session.serverUrl,
            phase,
            saving: pending > 0,
            problem,
            copyOffer: copyOffer ? copyOffer.applications.length : null,
          }
        : {
            signedIn: false,
            phase: 'local',
            saving: false,
            problem,
            copyOffer: null,
          },
    [session, phase, pending, problem, copyOffer],
  );

  const value = useMemo<AppDataValue>(() => {
    const { applications, profile, companies } = data;
    return {
      applications,
      storageAvailable,
      storageNotice: notice,
      dismissStorageNotice: () => setNotice(null),

      getApplication: (id) => applications.find((application) => application.id === id),

      addApplication: (values: ApplicationFormValues) => {
        const application = createApplication(values);
        change((current) => ({ ...current, applications: [application, ...current.applications] }));
        return application;
      },

      editApplication: (id, values) => updateOne(id, (a) => applyFormValues(a, values)),
      removeApplication: (id) =>
        change((current) => ({
          ...current,
          applications: current.applications.filter((application) => application.id !== id),
        })),
      setStatus: (id, status: ApplicationStatus) => updateOne(id, (a) => withStatus(a, status)),
      setNotes: (id, notes) => updateOne(id, (a) => withNotes(a, notes)),

      addInterview: (id, values: InterviewFormValues) =>
        updateOne(id, (a) => withInterview(a, values)),
      removeInterview: (id, interviewId) =>
        updateOne(id, (a) => withoutInterview(a, interviewId)),
      addTask: (id, values: TaskFormValues) => updateOne(id, (a) => withTask(a, values)),
      toggleTask: (id, taskId) => updateOne(id, (a) => withTaskToggled(a, taskId)),
      removeTask: (id, taskId) => updateOne(id, (a) => withoutTask(a, taskId)),

      addRequirement: (id, values: RequirementFormValues) =>
        updateOne(id, (a) => withRequirement(a, values, dataRef.current.profile)),
      toggleRequirement: (id, requirementId) =>
        updateOne(id, (a) => withRequirementToggled(a, requirementId)),
      removeRequirement: (id, requirementId) =>
        updateOne(id, (a) => withoutRequirement(a, requirementId)),

      profile,
      setHeadline: (headline) =>
        change((current) => ({ ...current, profile: withHeadline(current.profile, headline) })),
      addQualification: (values: QualificationFormValues) =>
        change((current) => ({ ...current, profile: withQualification(current.profile, values) })),
      removeQualification: (qualificationId) =>
        change((current) => ({
          ...current,
          profile: withoutQualification(current.profile, qualificationId),
        })),
      setSalaryExpectation: (expectation: SalaryExpectation | undefined) =>
        change((current) => ({
          ...current,
          profile: withSalaryExpectation(current.profile, expectation),
        })),

      companies,
      saveCompanyDetails: (previousKey, input: CompanyDetailsInput) => {
        // One transformation over both lists, so a rename and its details can
        // never land half-applied. On the server one request does the same.
        const current = dataRef.current;
        const next = withCompanyDetails(
          current.applications,
          current.companies,
          previousKey,
          input,
          new Date().toISOString(),
        );
        commit({ ...current, applications: next.applications, companies: next.details }, [
          saveCompanyOperation(previousKey, input),
        ]);
      },
      removeCompanyDetails: (key) => {
        const current = dataRef.current;
        commit({ ...current, companies: withoutCompanyDetails(current.companies, key) }, [
          removeCompanyOperation(key),
        ]);
      },

      replaceAll: (next, nextProfile, nextCompanies) => {
        const current = dataRef.current;
        // A file with no profile or company section leaves the current one
        // alone rather than wiping it: the user did not ask to lose it.
        commit(
          {
            applications: next,
            profile: nextProfile ?? current.profile,
            companies: nextCompanies ?? current.companies,
          },
          [replaceAllOperation(next, nextProfile, nextCompanies)],
        );
        setNotice(null);
      },
      clearAll: () => {
        // Writes an empty list rather than removing the key, so the next visit
        // is not mistaken for a first visit and re-seeded. Company details are
        // records too, so they go; the profile is the user's own and stays.
        commit({ ...dataRef.current, applications: [], companies: [] }, [
          replaceAllOperation([], undefined, []),
        ]);
        setNotice(null);
      },
      resetToDemo: () => {
        // Signed in, only the account's data is replaced; this browser's own
        // storage is not touched.
        if (!sessionRef.current) removeStoredData();
        const demoApplications = createDemoApplications();
        const demoCompanies = createDemoCompanies();
        // The profile is the user's own, not part of the sample data, so
        // restoring the demo applications deliberately leaves it untouched.
        commit({ ...dataRef.current, applications: demoApplications, companies: demoCompanies }, [
          replaceAllOperation(demoApplications, undefined, demoCompanies),
        ]);
        setNotice(null);
      },

      account,
      signIn,
      signOut,
      retrySync: () => {
        setProblem(null);
        if (!sessionRef.current) return;
        setPhase((current) => (current === 'unavailable' ? 'loading' : current));
        void reload();
      },
      dismissSyncProblem: () => setProblem(null),
      copyDeviceDataToAccount: () => {
        if (!copyOffer || !sessionRef.current) return;
        const hasProfile = Boolean(
          copyOffer.profile.headline ||
            copyOffer.profile.qualifications.length > 0 ||
            copyOffer.profile.salaryExpectation,
        );
        const profileToCopy = hasProfile ? copyOffer.profile : undefined;
        commit(
          {
            applications: copyOffer.applications,
            profile: profileToCopy ?? dataRef.current.profile,
            companies: copyOffer.companies,
          },
          [replaceAllOperation(copyOffer.applications, profileToCopy, copyOffer.companies)],
        );
        setCopyOffer(null);
      },
      dismissCopyOffer: () => setCopyOffer(null),
      switchToDeviceData: () => leaveAccount(null),
    };
  }, [
    data,
    notice,
    storageAvailable,
    account,
    change,
    commit,
    updateOne,
    signIn,
    signOut,
    reload,
    copyOffer,
    leaveAccount,
  ]);

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}
