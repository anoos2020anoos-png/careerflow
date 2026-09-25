import { createContext, useContext } from 'react';
import type {
  Application,
  ApplicationStatus,
  CompanyDetails,
  Profile,
  SalaryExpectation,
} from '@/types';
import type { CompanyDetailsInput } from '@/lib/companies';
import type {
  ApplicationFormValues,
  InterviewFormValues,
  QualificationFormValues,
  RequirementFormValues,
  TaskFormValues,
} from '@/lib/schemas';

/** Why the account's data could not be loaded or saved. */
export interface SyncProblem {
  kind:
    /** The server refused a change; the account's data was reloaded. */
    | 'save_failed'
    /** The server could not be reached, or refused to load the data. */
    | 'unreachable'
    /** The session expired or was ended elsewhere; back to this browser's data. */
    | 'session_ended';
  /** The API's error code (`network_error`, `validation_failed`, …). */
  code: string;
  /** The server's own wording, in English; shown when the code is not known. */
  message: string;
}

export interface AccountState {
  signedIn: boolean;
  email?: string;
  serverUrl?: string;
  /**
   * `local`: signed out, data in this browser. Signed in: `loading` the
   * account's data, `ready`, or `unavailable` when it could not be loaded.
   */
  phase: 'local' | 'loading' | 'ready' | 'unavailable';
  /** Changes are on their way to the server. */
  saving: boolean;
  /**
   * The server cannot be reached; changes are kept and sent when it can be.
   * They are also kept if the tab is closed meanwhile.
   */
  offline: boolean;
  /** How many requests are still to reach the server. */
  unsent: number;
  problem: SyncProblem | null;
  /**
   * After signing in to an empty account: how many applications this browser
   * holds that could be copied into it. `null` when there is nothing to offer.
   */
  copyOffer: number | null;
}

export interface SignInInput {
  serverUrl: string;
  email: string;
  password: string;
  /** Create the account rather than sign in to an existing one. */
  createAccount: boolean;
}

export interface AppDataValue {
  applications: Application[];
  /** `false` when the browser refuses `localStorage` (private mode, blocked). */
  storageAvailable: boolean;
  /** Set when stored data could not be read, or a write failed. */
  storageNotice: string | null;
  dismissStorageNotice: () => void;

  getApplication: (id: string) => Application | undefined;
  addApplication: (values: ApplicationFormValues) => Application;
  editApplication: (id: string, values: ApplicationFormValues) => void;
  removeApplication: (id: string) => void;
  setStatus: (id: string, status: ApplicationStatus) => void;
  setNotes: (id: string, notes: string) => void;

  addInterview: (id: string, values: InterviewFormValues) => void;
  removeInterview: (id: string, interviewId: string) => void;
  addTask: (id: string, values: TaskFormValues) => void;
  toggleTask: (id: string, taskId: string) => void;
  removeTask: (id: string, taskId: string) => void;

  addRequirement: (id: string, values: RequirementFormValues) => void;
  toggleRequirement: (id: string, requirementId: string) => void;
  removeRequirement: (id: string, requirementId: string) => void;

  /** The applicant's own background, used to pre-tick matching requirements. */
  profile: Profile;
  setHeadline: (headline: string) => void;
  addQualification: (values: QualificationFormValues) => void;
  removeQualification: (qualificationId: string) => void;
  /** Sets the expected salary, or clears it with `undefined`. */
  setSalaryExpectation: (expectation: SalaryExpectation | undefined) => void;

  /** What the user has noted about each employer, keyed by normalised name. */
  companies: CompanyDetails[];
  /**
   * Saves a company's details; renames every application under it when the
   * name changed, merging into an existing company if the new name is taken.
   */
  saveCompanyDetails: (previousKey: string, input: CompanyDetailsInput) => void;
  removeCompanyDetails: (key: string) => void;

  replaceAll: (
    applications: Application[],
    profile?: Profile,
    companies?: CompanyDetails[],
  ) => void;
  clearAll: () => void;
  resetToDemo: () => void;

  /** Where the data is kept: this browser, or an account on a server. */
  account: AccountState;
  /** Rejects with an `ApiError` the sign-in form can explain. */
  signIn: (input: SignInInput) => Promise<void>;
  /** Waits briefly for unsaved changes, then returns to this browser's data. */
  signOut: (everywhere?: boolean) => Promise<void>;
  /** Reloads the account's data after a problem. */
  retrySync: () => void;
  dismissSyncProblem: () => void;
  /** Copies what this browser held into the (empty) account just signed in to. */
  copyDeviceDataToAccount: () => void;
  dismissCopyOffer: () => void;
  /** Leaves the account without contacting the server, e.g. when it is unreachable. */
  switchToDeviceData: () => void;
}

export const AppDataContext = createContext<AppDataValue | null>(null);

export function useAppData(): AppDataValue {
  const value = useContext(AppDataContext);
  if (!value) {
    throw new Error('useAppData must be used inside <AppDataProvider>');
  }
  return value;
}
