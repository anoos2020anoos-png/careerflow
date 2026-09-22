import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Application, ApplicationStatus } from '@/types';
import type {
  ApplicationFormValues,
  InterviewFormValues,
  TaskFormValues,
} from '@/lib/schemas';
import {
  applyFormValues,
  createApplication,
  withInterview,
  withNotes,
  withStatus,
  withTask,
  withTaskToggled,
  withoutInterview,
  withoutTask,
} from '@/lib/applications';
import { createDemoApplications } from '@/lib/demoData';
import { isStorageAvailable, loadData, removeStoredData, saveData } from '@/lib/storage';
import { AppDataContext, type AppDataValue } from '@/state/app-data-context';

interface InitialState {
  applications: Application[];
  notice: string | null;
}

function readInitialState(): InitialState {
  const outcome = loadData();
  switch (outcome.kind) {
    case 'loaded':
      return { applications: outcome.data.applications, notice: null };
    case 'unreadable':
      return {
        applications: [],
        notice: `${outcome.reason} CareerFlow started with an empty list and kept a copy of the original data in your browser storage under "careerflow:data:unreadable-backup".`,
      };
    case 'empty':
    default:
      // First visit: seed fictional sample data so the app is explorable.
      return { applications: createDemoApplications(), notice: null };
  }
}

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(readInitialState);
  const [applications, setApplications] = useState<Application[]>(initial.applications);
  const [notice, setNotice] = useState<string | null>(initial.notice);
  const storageAvailable = useMemo(() => isStorageAvailable(), []);
  const quotaWarned = useRef(false);

  // Persist after every change. The seeded demo data is written on first paint,
  // so a refresh reads it back instead of generating a fresh set.
  useEffect(() => {
    if (!storageAvailable) return;
    const saved = saveData(applications);
    if (!saved && !quotaWarned.current) {
      quotaWarned.current = true;
      setNotice(
        'CareerFlow could not save to this browser (storage may be full or blocked). Your changes are held in memory and will be lost when you close the tab.',
      );
    }
  }, [applications, storageAvailable]);

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

      replaceAll: (next) => {
        setApplications(next);
        setNotice(null);
      },
      clearAll: () => {
        // Writes an empty list rather than removing the key, so the next visit
        // is not mistaken for a first visit and re-seeded.
        setApplications([]);
        setNotice(null);
      },
      resetToDemo: () => {
        removeStoredData();
        setApplications(createDemoApplications());
        setNotice(null);
      },
    };
  }, [applications, notice, storageAvailable, updateOne]);

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}
