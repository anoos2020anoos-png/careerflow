import { createContext, useContext } from 'react';
import type { Application, ApplicationStatus } from '@/types';
import type {
  ApplicationFormValues,
  InterviewFormValues,
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

  replaceAll: (applications: Application[]) => void;
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
