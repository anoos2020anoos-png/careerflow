import type {
  ActivityEntry,
  Application,
  ApplicationStatus,
  EmploymentType,
  FollowUpTask,
  Interview,
  InterviewType,
  WorkArrangement,
} from '@/types';
import { addDays, parseDateOnly, todayDateOnly } from '@/lib/dates';
import { createId } from '@/lib/ids';

/**
 * Fictional sample data. Every company, person and figure here is invented.
 *
 * Offsets are expressed in days relative to "today" at seed time so a first
 * time visitor always sees a dashboard with recent activity and genuinely
 * upcoming interviews, no matter when they open the app.
 */

interface SeedInterview {
  inDays: number;
  time: string;
  type: InterviewType;
  notes?: string;
}

interface SeedTask {
  title: string;
  dueInDays?: number;
  completed?: boolean;
}

interface SeedApplication {
  company: string;
  jobTitle: string;
  jobUrl?: string;
  location: string;
  workArrangement: WorkArrangement;
  employmentType: EmploymentType;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  /** Days before today the application was submitted. */
  appliedDaysAgo: number;
  status: ApplicationStatus;
  notes?: string;
  followUpInDays?: number;
  interviews?: SeedInterview[];
  tasks?: SeedTask[];
  /** Days before today each status transition happened, oldest first. */
  transitions?: { to: ApplicationStatus; daysAgo: number }[];
}

const SEEDS: SeedApplication[] = [
  {
    company: 'Northwind Analytics',
    jobTitle: 'Senior Frontend Engineer',
    jobUrl: 'https://example.com/northwind/careers/senior-frontend-engineer',
    location: 'Berlin, Germany',
    workArrangement: 'hybrid',
    employmentType: 'full_time',
    salaryMin: 78000,
    salaryMax: 95000,
    salaryCurrency: 'EUR',
    appliedDaysAgo: 26,
    status: 'interview',
    notes:
      'Design-system heavy role. The team runs a two-week trial project instead of a take-home. Hiring manager: Lena Brandt.',
    followUpInDays: 3,
    transitions: [
      { to: 'applied', daysAgo: 26 },
      { to: 'screening', daysAgo: 19 },
      { to: 'interview', daysAgo: 8 },
    ],
    interviews: [
      {
        inDays: -8,
        time: '10:00',
        type: 'phone_screen',
        notes: 'Went well. Mostly team fit and past projects.',
      },
      {
        inDays: 2,
        time: '14:30',
        type: 'technical',
        notes: 'Live component build, 60 minutes. Bring questions about their monorepo.',
      },
    ],
    tasks: [
      { title: 'Review their public design-system docs', dueInDays: 1 },
      { title: 'Send thank-you note after the phone screen', dueInDays: -7, completed: true },
    ],
  },
  {
    company: 'Lumen Health',
    jobTitle: 'Product Engineer',
    jobUrl: 'https://example.com/lumenhealth/jobs/product-engineer',
    location: 'Remote (EU)',
    workArrangement: 'remote',
    employmentType: 'full_time',
    salaryMin: 70000,
    salaryMax: 88000,
    salaryCurrency: 'EUR',
    appliedDaysAgo: 12,
    status: 'screening',
    notes: 'Small team, strong emphasis on writing. Recruiter replied within two days.',
    followUpInDays: 5,
    transitions: [
      { to: 'applied', daysAgo: 12 },
      { to: 'screening', daysAgo: 4 },
    ],
    interviews: [
      { inDays: 5, time: '09:30', type: 'phone_screen', notes: 'Intro call with the recruiter.' },
    ],
    tasks: [{ title: 'Prepare a two-minute summary of the analytics rebuild', dueInDays: 4 }],
  },
  {
    company: 'Atlas Freight',
    jobTitle: 'Full Stack Developer',
    location: 'Rotterdam, Netherlands',
    workArrangement: 'onsite',
    employmentType: 'full_time',
    salaryMin: 65000,
    salaryMax: 80000,
    salaryCurrency: 'EUR',
    appliedDaysAgo: 41,
    status: 'rejected',
    notes: 'Rejected after the technical round — they wanted deeper Kubernetes experience.',
    transitions: [
      { to: 'applied', daysAgo: 41 },
      { to: 'screening', daysAgo: 34 },
      { to: 'interview', daysAgo: 25 },
      { to: 'rejected', daysAgo: 17 },
    ],
    interviews: [
      { inDays: -25, time: '11:00', type: 'technical', notes: 'Pairing session on a routing bug.' },
    ],
  },
  {
    company: 'Verdant Labs',
    jobTitle: 'React Engineer',
    jobUrl: 'https://example.com/verdantlabs/careers/react-engineer',
    location: 'Remote (worldwide)',
    workArrangement: 'remote',
    employmentType: 'contract',
    salaryMin: 420,
    salaryMax: 480,
    salaryCurrency: 'USD',
    appliedDaysAgo: 6,
    status: 'applied',
    notes: 'Six-month contract with an option to extend. Day rate quoted in USD.',
    followUpInDays: 4,
    transitions: [{ to: 'applied', daysAgo: 6 }],
    tasks: [{ title: 'Follow up if no reply by the end of the week', dueInDays: 4 }],
  },
  {
    company: 'Brightpath Learning',
    jobTitle: 'Frontend Developer',
    location: 'Manchester, United Kingdom',
    workArrangement: 'hybrid',
    employmentType: 'full_time',
    salaryMin: 52000,
    salaryMax: 62000,
    salaryCurrency: 'GBP',
    appliedDaysAgo: 33,
    status: 'offer',
    notes:
      'Offer received at the top of the advertised band. Asked for a week to decide. Strong mentoring culture.',
    followUpInDays: 2,
    transitions: [
      { to: 'applied', daysAgo: 33 },
      { to: 'screening', daysAgo: 27 },
      { to: 'interview', daysAgo: 16 },
      { to: 'offer', daysAgo: 3 },
    ],
    interviews: [
      { inDays: -16, time: '13:00', type: 'behavioral', notes: 'Panel of three. Relaxed.' },
      { inDays: -9, time: '15:00', type: 'final', notes: 'Met the CTO. Discussed the first 90 days.' },
    ],
    tasks: [
      { title: 'Compare the offer against the Northwind band', dueInDays: 1 },
      { title: 'Ask about the training budget', dueInDays: 2 },
    ],
  },
  {
    company: 'Cobalt Systems',
    jobTitle: 'UI Engineer',
    jobUrl: 'https://example.com/cobalt/roles/ui-engineer',
    location: 'Dublin, Ireland',
    workArrangement: 'hybrid',
    employmentType: 'full_time',
    salaryMin: 68000,
    salaryMax: 79000,
    salaryCurrency: 'EUR',
    appliedDaysAgo: 3,
    status: 'applied',
    notes: 'Referred by a former colleague. Mentioned the referral in the cover letter.',
    transitions: [{ to: 'applied', daysAgo: 3 }],
  },
  {
    company: 'Harborline Media',
    jobTitle: 'Web Developer',
    location: 'Lisbon, Portugal',
    workArrangement: 'onsite',
    employmentType: 'part_time',
    salaryMin: 28000,
    salaryMax: 34000,
    salaryCurrency: 'EUR',
    appliedDaysAgo: 54,
    status: 'withdrawn',
    notes: 'Withdrew — the role turned out to be mostly CMS maintenance.',
    transitions: [
      { to: 'applied', daysAgo: 54 },
      { to: 'screening', daysAgo: 47 },
      { to: 'withdrawn', daysAgo: 44 },
    ],
  },
  {
    company: 'Quanta Retail',
    jobTitle: 'Software Engineer, Checkout',
    location: 'Remote (EU)',
    workArrangement: 'remote',
    employmentType: 'full_time',
    salaryMin: 72000,
    salaryMax: 86000,
    salaryCurrency: 'EUR',
    appliedDaysAgo: 18,
    status: 'interview',
    notes: 'Payments domain. They asked for a short architecture write-up before the next round.',
    followUpInDays: 1,
    transitions: [
      { to: 'applied', daysAgo: 18 },
      { to: 'screening', daysAgo: 11 },
      { to: 'interview', daysAgo: 5 },
    ],
    interviews: [
      { inDays: 4, time: '16:00', type: 'system_design', notes: 'Design an idempotent checkout flow.' },
    ],
    tasks: [{ title: 'Write the one-page architecture summary', dueInDays: 1 }],
  },
  {
    company: 'Sable & Co',
    jobTitle: 'Junior Frontend Developer',
    location: 'Copenhagen, Denmark',
    workArrangement: 'hybrid',
    employmentType: 'internship',
    appliedDaysAgo: 61,
    status: 'rejected',
    notes: 'Internship cohort was already full. They suggested reapplying in the autumn.',
    transitions: [
      { to: 'applied', daysAgo: 61 },
      { to: 'rejected', daysAgo: 52 },
    ],
  },
  {
    company: 'Orbit Logistics',
    jobTitle: 'Frontend Platform Engineer',
    jobUrl: 'https://example.com/orbit/careers/frontend-platform',
    location: 'Remote (EU)',
    workArrangement: 'remote',
    employmentType: 'full_time',
    salaryMin: 80000,
    salaryMax: 98000,
    salaryCurrency: 'EUR',
    appliedDaysAgo: 0,
    status: 'saved',
    notes: 'Saved to apply this week. Needs a tailored cover letter about build tooling.',
    followUpInDays: 2,
    tasks: [{ title: 'Tailor the CV for platform work', dueInDays: 2 }],
  },
  {
    company: 'Mistral Bank',
    jobTitle: 'Frontend Engineer, Internal Tools',
    location: 'Paris, France',
    workArrangement: 'onsite',
    employmentType: 'full_time',
    salaryMin: 60000,
    salaryMax: 72000,
    salaryCurrency: 'EUR',
    appliedDaysAgo: 9,
    status: 'applied',
    notes: 'Long application form. Confirmation email said four weeks to first response.',
    transitions: [{ to: 'applied', daysAgo: 9 }],
  },
  {
    company: 'Fernwood Studio',
    jobTitle: 'Creative Developer',
    location: 'Remote (worldwide)',
    workArrangement: 'remote',
    employmentType: 'contract',
    salaryMin: 380,
    salaryMax: 420,
    salaryCurrency: 'USD',
    appliedDaysAgo: 22,
    status: 'screening',
    notes: 'Portfolio-led process. They liked the WebGL experiments.',
    followUpInDays: 6,
    transitions: [
      { to: 'applied', daysAgo: 22 },
      { to: 'screening', daysAgo: 10 },
    ],
    interviews: [
      { inDays: 9, time: '17:30', type: 'other', notes: 'Portfolio walkthrough, 45 minutes.' },
    ],
  },
  {
    company: 'Ironvale Energy',
    jobTitle: 'Software Engineer',
    location: 'Oslo, Norway',
    workArrangement: 'hybrid',
    employmentType: 'full_time',
    salaryMin: 720000,
    salaryMax: 840000,
    salaryCurrency: 'NOK',
    appliedDaysAgo: 47,
    status: 'rejected',
    notes: 'No response for six weeks, then a standard rejection email.',
    transitions: [
      { to: 'applied', daysAgo: 47 },
      { to: 'rejected', daysAgo: 5 },
    ],
  },
  {
    company: 'Petal Commerce',
    jobTitle: 'Frontend Engineer',
    jobUrl: 'https://example.com/petal/jobs/frontend-engineer',
    location: 'Remote (EU)',
    workArrangement: 'remote',
    employmentType: 'full_time',
    salaryMin: 66000,
    salaryMax: 78000,
    salaryCurrency: 'EUR',
    appliedDaysAgo: 15,
    status: 'screening',
    notes: 'Async-first company. First stage is a written exercise rather than a call.',
    transitions: [
      { to: 'applied', daysAgo: 15 },
      { to: 'screening', daysAgo: 6 },
    ],
    tasks: [{ title: 'Complete the written exercise', dueInDays: 3 }],
  },
  {
    company: 'Beacon Civic',
    jobTitle: 'Accessibility Engineer',
    location: 'Remote (EU)',
    workArrangement: 'remote',
    employmentType: 'full_time',
    salaryMin: 62000,
    salaryMax: 75000,
    salaryCurrency: 'EUR',
    appliedDaysAgo: 30,
    status: 'saved',
    notes:
      'Public-sector contract work. Saved while deciding whether the commute policy is workable.',
  },
];

function instantFrom(dateOnly: string, hour = 10, minute = 0): string {
  const date = parseDateOnly(dateOnly);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

function buildInterviews(seed: SeedApplication, today: string): Interview[] {
  return (seed.interviews ?? []).map((entry) => {
    const date = addDays(today, entry.inDays);
    const interview: Interview = {
      id: createId(),
      date,
      time: entry.time,
      type: entry.type,
      createdAt: instantFrom(addDays(date, -3), 9),
    };
    if (entry.notes) interview.notes = entry.notes;
    return interview;
  });
}

function buildTasks(seed: SeedApplication, today: string): FollowUpTask[] {
  return (seed.tasks ?? []).map((entry) => {
    const createdAt = instantFrom(addDays(today, -Math.max(seed.appliedDaysAgo, 1)), 11);
    const task: FollowUpTask = {
      id: createId(),
      title: entry.title,
      completed: Boolean(entry.completed),
      createdAt,
    };
    if (entry.dueInDays !== undefined) task.dueDate = addDays(today, entry.dueInDays);
    if (entry.completed) task.completedAt = instantFrom(today, 12);
    return task;
  });
}

function buildActivity(seed: SeedApplication, today: string, appliedDate: string): ActivityEntry[] {
  const activity: ActivityEntry[] = [
    {
      id: createId(),
      kind: 'created',
      at: instantFrom(appliedDate, 9),
      detail: 'Application added',
    },
  ];

  let previous: ApplicationStatus = 'saved';
  for (const transition of seed.transitions ?? []) {
    activity.push({
      id: createId(),
      kind: 'status_changed',
      at: instantFrom(addDays(today, -transition.daysAgo), 12),
      from: previous,
      to: transition.to,
    });
    previous = transition.to;
  }

  return activity;
}

export function createDemoApplications(today = todayDateOnly()): Application[] {
  return SEEDS.map((seed) => {
    const appliedDate = addDays(today, -seed.appliedDaysAgo);
    const activity = buildActivity(seed, today, appliedDate);
    const lastActivity = activity[activity.length - 1];

    const application: Application = {
      id: createId(),
      company: seed.company,
      jobTitle: seed.jobTitle,
      location: seed.location,
      workArrangement: seed.workArrangement,
      employmentType: seed.employmentType,
      appliedDate,
      status: seed.status,
      createdAt: instantFrom(appliedDate, 9),
      updatedAt: lastActivity?.at ?? instantFrom(appliedDate, 9),
      interviews: buildInterviews(seed, today),
      tasks: buildTasks(seed, today),
      activity,
    };

    if (seed.jobUrl) application.jobUrl = seed.jobUrl;
    if (seed.notes) application.notes = seed.notes;
    if (seed.salaryMin !== undefined) application.salaryMin = seed.salaryMin;
    if (seed.salaryMax !== undefined) application.salaryMax = seed.salaryMax;
    if (seed.salaryCurrency) application.salaryCurrency = seed.salaryCurrency;
    if (seed.followUpInDays !== undefined) {
      application.nextFollowUpDate = addDays(today, seed.followUpInDays);
    }

    return application;
  });
}

export const DEMO_APPLICATION_COUNT = SEEDS.length;
