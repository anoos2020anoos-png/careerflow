import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type {
  Application,
  ApplicationStatus,
  CompanyDetails,
  Profile,
  SalaryExpectation,
} from '@/types';
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
import { AppDataContext, type AppDataValue } from '@/state/app-data-context';

interface InitialState {
  applications: Application[];
  profile: Profile;
  companies: CompanyDetails[];
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

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(readInitialState);
  const [applications, setApplications] = useState<Application[]>(initial.applications);
  const [profile, setProfile] = useState<Profile>(initial.profile);
  const [companies, setCompanies] = useState<CompanyDetails[]>(initial.companies);
  const [notice, setNotice] = useState<string | null>(initial.notice);
  const storageAvailable = useMemo(() => isStorageAvailable(), []);
  const quotaWarned = useRef(false);

  // Persist after every change. The seeded demo data is written on first paint,
  // so a refresh reads it back instead of generating a fresh set.
  useEffect(() => {
    if (!storageAvailable) return;
    const saved = saveData(applications, profile, companies);
    if (!saved && !quotaWarned.current) {
      quotaWarned.current = true;
      setNotice(
        'CareerFlow could not save to this browser (storage may be full or blocked). Your changes are held in memory and will be lost when you close the tab.',
      );
    }
  }, [applications, profile, companies, storageAvailable]);

  const updateOne = useCallback(
    (id: string, transform: (application: Application) => Application) => {
      setApplications((current) =>
        current.map((application) =>
          application.id === id ? transform(application) : application,
        ),
      );
    },
    [],
  );

  const value = useMemo<AppDataValue>(() => {
    return {
      applications,
      storageAvailable,
      storageNotice: notice,
      dismissStorageNotice: () => setNotice(null),

      getApplication: (id) => applications.find((application) => application.id === id),

      addApplication: (values: ApplicationFormValues) => {
        const application = createApplication(values);
        setApplications((current) => [application, ...current]);
        return application;
      },

      editApplication: (id, values) => updateOne(id, (a) => applyFormValues(a, values)),
      removeApplication: (id) =>
        setApplications((current) => current.filter((application) => application.id !== id)),
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
        updateOne(id, (a) => withRequirement(a, values, profile)),
      toggleRequirement: (id, requirementId) =>
        updateOne(id, (a) => withRequirementToggled(a, requirementId)),
      removeRequirement: (id, requirementId) =>
        updateOne(id, (a) => withoutRequirement(a, requirementId)),

      profile,
      setHeadline: (headline) => setProfile((current) => withHeadline(current, headline)),
      addQualification: (values: QualificationFormValues) =>
        setProfile((current) => withQualification(current, values)),
      removeQualification: (qualificationId) =>
        setProfile((current) => withoutQualification(current, qualificationId)),
      setSalaryExpectation: (expectation: SalaryExpectation | undefined) =>
        setProfile((current) => withSalaryExpectation(current, expectation)),

      companies,
      saveCompanyDetails: (previousKey, input: CompanyDetailsInput) => {
        // One transformation over both lists, so a rename and its details can
        // never land half-applied.
        const next = withCompanyDetails(
          applications,
          companies,
          previousKey,
          input,
          new Date().toISOString(),
        );
        setApplications(next.applications);
        setCompanies(next.details);
      },
      removeCompanyDetails: (key) => setCompanies((current) => withoutCompanyDetails(current, key)),

      replaceAll: (next, nextProfile, nextCompanies) => {
        setApplications(next);
        // A file with no profile or company section leaves the current one
        // alone rather than wiping it: the user did not ask to lose it.
        if (nextProfile) setProfile(nextProfile);
        if (nextCompanies) setCompanies(nextCompanies);
        setNotice(null);
      },
      clearAll: () => {
        // Writes an empty list rather than removing the key, so the next visit
        // is not mistaken for a first visit and re-seeded. Company details are
        // records too, so they go; the profile is the user's own and stays.
        setApplications([]);
        setCompanies([]);
        setNotice(null);
      },
      resetToDemo: () => {
        removeStoredData();
        setApplications(createDemoApplications());
        setCompanies(createDemoCompanies());
        // The profile is the user's own, not part of the sample data, so
        // restoring the demo applications deliberately leaves it untouched.
        setNotice(null);
      },
    };
  }, [applications, profile, companies, notice, storageAvailable, updateOne]);

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}
