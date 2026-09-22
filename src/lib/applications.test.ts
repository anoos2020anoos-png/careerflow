import { describe, expect, it } from 'vitest';
import {
  applyFormValues,
  createApplication,
  emptyFormValues,
  toFormValues,
  withNotes,
  withStatus,
  withTask,
  withTaskToggled,
} from '@/lib/applications';
import { applicationFormSchema } from '@/lib/schemas';
import { makeApplication } from '@/test/factories';

const validValues = {
  ...emptyFormValues('2026-03-04'),
  company: '  Northwind Analytics  ',
  jobTitle: 'Senior Frontend Engineer',
  jobUrl: 'https://example.com/jobs/1',
  location: 'Berlin',
  salaryMin: '70000',
  salaryMax: '90 000',
  salaryCurrency: 'eur',
  status: 'applied' as const,
  notes: '  Referred by a colleague  ',
};

describe('createApplication', () => {
  it('trims text, converts money fields and records a creation entry', () => {
    const application = createApplication(validValues);

    expect(application.company).toBe('Northwind Analytics');
    expect(application.notes).toBe('Referred by a colleague');
    expect(application.salaryMin).toBe(70000);
    expect(application.salaryMax).toBe(90000);
    expect(application.salaryCurrency).toBe('EUR');
    expect(application.id).toBeTruthy();
    expect(application.interviews).toEqual([]);
    expect(application.activity[0]?.kind).toBe('created');
  });

  it('omits optional fields that were left blank', () => {
    const application = createApplication(emptyFormValues('2026-03-04'));

    expect(application).not.toHaveProperty('jobUrl');
    expect(application).not.toHaveProperty('location');
    expect(application).not.toHaveProperty('salaryMin');
    expect(application).not.toHaveProperty('notes');
  });

  it('records the initial status move when it is not "saved"', () => {
    const application = createApplication({ ...validValues, status: 'interview' });
    const statusEntry = application.activity.find((entry) => entry.kind === 'status_changed');

    expect(statusEntry?.from).toBe('saved');
    expect(statusEntry?.to).toBe('interview');
  });

  it('gives every application a distinct id', () => {
    const first = createApplication(validValues);
    const second = createApplication(validValues);
    expect(first.id).not.toBe(second.id);
  });
});

describe('applyFormValues', () => {
  it('keeps the id, creation time, interviews and tasks', () => {
    const existing = makeApplication({ interviews: [], tasks: [] });
    const edited = applyFormValues(existing, { ...validValues, company: 'Lumen Health' });

    expect(edited.id).toBe(existing.id);
    expect(edited.createdAt).toBe(existing.createdAt);
    expect(edited.company).toBe('Lumen Health');
    expect(edited.interviews).toBe(existing.interviews);
  });

  it('clears an optional value when its field is submitted empty', () => {
    const existing = makeApplication({ location: 'Berlin', notes: 'Old note' });
    const edited = applyFormValues(existing, {
      ...toFormValues(existing),
      location: '',
      notes: '',
    });

    expect(edited).not.toHaveProperty('location');
    expect(edited).not.toHaveProperty('notes');
  });

  it('logs a status change rather than a generic edit when the status moves', () => {
    const existing = makeApplication({ status: 'applied' });
    const edited = applyFormValues(existing, { ...toFormValues(existing), status: 'offer' });
    const last = edited.activity[edited.activity.length - 1];

    expect(last?.kind).toBe('status_changed');
    expect(last?.from).toBe('applied');
    expect(last?.to).toBe('offer');
  });

  it('round-trips through toFormValues without changing the record', () => {
    const existing = makeApplication({
      location: 'Dublin',
      salaryMin: 60000,
      salaryMax: 75000,
      salaryCurrency: 'EUR',
      notes: 'Some notes',
      nextFollowUpDate: '2026-04-01',
    });
    const edited = applyFormValues(existing, toFormValues(existing));

    expect(edited.company).toBe(existing.company);
    expect(edited.salaryMin).toBe(existing.salaryMin);
    expect(edited.salaryMax).toBe(existing.salaryMax);
    expect(edited.nextFollowUpDate).toBe(existing.nextFollowUpDate);
  });
});

describe('withStatus / withNotes / tasks', () => {
  it('returns the same object when the status is unchanged', () => {
    const existing = makeApplication({ status: 'applied' });
    expect(withStatus(existing, 'applied')).toBe(existing);
  });

  it('appends an activity entry when the status changes', () => {
    const existing = makeApplication({ status: 'applied' });
    const moved = withStatus(existing, 'screening');

    expect(moved.status).toBe('screening');
    expect(moved.activity).toHaveLength(existing.activity.length + 1);
  });

  it('removes the notes field when notes are cleared', () => {
    const existing = makeApplication({ notes: 'Something' });
    expect(withNotes(existing, '   ')).not.toHaveProperty('notes');
  });

  it('toggles a task and stamps a completion time', () => {
    const withOne = withTask(makeApplication(), { title: 'Email recruiter', dueDate: '' });
    const taskId = withOne.tasks[0]!.id;

    const completed = withTaskToggled(withOne, taskId);
    expect(completed.tasks[0]?.completed).toBe(true);
    expect(completed.tasks[0]?.completedAt).toBeTruthy();

    const reopened = withTaskToggled(completed, taskId);
    expect(reopened.tasks[0]?.completed).toBe(false);
    expect(reopened.tasks[0]).not.toHaveProperty('completedAt');
  });
});

describe('applicationFormSchema', () => {
  it('requires a company and a job title', () => {
    const result = applicationFormSchema.safeParse({
      ...emptyFormValues('2026-03-04'),
      company: '',
      jobTitle: '',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((issue) => issue.path.join('.'));
      expect(paths).toContain('company');
      expect(paths).toContain('jobTitle');
    }
  });

  it.each([
    'notaurl',
    'ftp://example.com/job',
    'javascript:alert(1)',
    'example.com/jobs',
  ])('rejects the unusable job link %s', (jobUrl) => {
    const result = applicationFormSchema.safeParse({ ...validValues, jobUrl });
    expect(result.success).toBe(false);
  });

  it('accepts an https job link and an empty one', () => {
    expect(
      applicationFormSchema.safeParse({ ...validValues, jobUrl: 'https://example.com/a' }).success,
    ).toBe(true);
    expect(applicationFormSchema.safeParse({ ...validValues, jobUrl: '' }).success).toBe(true);
  });

  it('rejects a maximum salary below the minimum', () => {
    const result = applicationFormSchema.safeParse({
      ...validValues,
      salaryMin: '90000',
      salaryMax: '50000',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path.includes('salaryMax'))).toBe(true);
    }
  });

  it('accepts a maximum equal to the minimum', () => {
    const result = applicationFormSchema.safeParse({
      ...validValues,
      salaryMin: '70000',
      salaryMax: '70000',
    });
    expect(result.success).toBe(true);
  });

  it('requires a currency once a salary figure is present', () => {
    const result = applicationFormSchema.safeParse({
      ...validValues,
      salaryMin: '70000',
      salaryMax: '',
      salaryCurrency: '',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path.includes('salaryCurrency'))).toBe(true);
    }
  });

  it('rejects an impossible calendar date', () => {
    const result = applicationFormSchema.safeParse({ ...validValues, appliedDate: '2026-02-31' });
    expect(result.success).toBe(false);
  });
});
