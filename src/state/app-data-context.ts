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
}

export const AppDataContext = createContext<AppDataValue | null>(null);

export function useAppData(): AppDataValue {
  const value = useContext(AppDataContext);
  if (!value) {
    throw new Error('useAppData must be used inside <AppDataProvider>');
  }
  return value;
}
