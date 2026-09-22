# CareerFlow — Job Application Tracker

CareerFlow is a browser-based tracker for a job search: every application in one
place, a board that shows where each one stands, interviews and follow-ups that
do not get forgotten, and a dashboard that answers "how is this actually going?"

It runs entirely in the browser. There is no account, no backend and no API key —
open it and start using it.

- **Live demo:** _not published yet — see [Deployment](#deployment)._
- **Repository:** _not published yet — see [Publishing to GitHub](#publishing-to-github)._

---

## The problem it solves

A job search turns into a bookkeeping problem faster than people expect. After
three weeks you have thirty tabs, a spreadsheet, a notes file and a calendar, and
you can no longer answer simple questions: Which applications are still alive?
What did the recruiter at Northwind say? Did I ever follow up with Lumen? Is my
application rate going up or down?

Spreadsheets handle the list but not the workflow — no stages, no interview
schedule, no reminders, no sense of momentum. Dedicated trackers handle the
workflow but want an account before you can see whether they are any good.

CareerFlow is the middle ground: a real tracker with a real data model, that a
visitor can try in ten seconds and that keeps their data on their own machine.

## Features

**Applications**

- Create, view, edit and delete applications, with confirmation before anything
  destructive.
- Fields for company, job title, posting link, location, work arrangement,
  employment type, salary range and currency, application date, status, notes and
  a next follow-up date.
- Seven statuses: Saved, Applied, Screening, Interview, Offer, Rejected, Withdrawn.
- Search by company or role; filter by status, work arrangement and employment
  type; sort by application date, company or last updated.
- Two views of the same data: a table on wide screens (readable cards on narrow
  ones) and a Kanban board grouped by status.

**Application detail**

- Full role and company information, with the job posting opened safely in a new
  tab.
- Editable notes, rendered strictly as plain text.
- Interview entries with date, time, type and notes.
- Follow-up tasks that can be ticked off, with optional due dates and an overdue
  accent.
- An activity timeline recording creation, status changes, edits, and interview
  and task changes.

**Dashboard**

- Four headline figures — total applications, active, upcoming interviews, offers
  — each with its definition printed underneath, so no number is ambiguous.
- Application activity by week over the last 12 weeks.
- Applications grouped by status.
- Upcoming interviews and open follow-ups, linked straight to their application.

Every figure is derived from the stored records on each render, so the dashboard
updates the moment anything changes.

**Data and appearance**

- Light, dark and "follow the system" themes, remembered between visits.
- JSON export, and import that validates the file before replacing anything.
- Reset to the sample data, or clear every record.
- Clear, in-app explanation of what browser-only storage means.
- About 15 fictional sample applications seeded on the first visit, with a spread
  of statuses and dates so the dashboard is meaningful immediately.

## Technology choices

| Choice | Why it fits this project |
| --- | --- |
| **React 18 + TypeScript (strict)** | The UI is a set of derived views over one collection of records — exactly what a component tree with a single store is good at. Strict TypeScript is what makes the domain model (seven statuses, optional salary, two flavours of date) enforceable rather than aspirational. |
| **Vite** | Fast dev server, and a static `dist/` that drops straight onto GitHub Pages with no server. |
| **Tailwind CSS** | The design system here is a small set of tokens and a handful of repeated shapes. Tailwind keeps those decisions in the markup where they are reviewable, and the tokens live in CSS variables so one set of class names serves both themes. |
| **React Hook Form + Zod** | One schema per form is the single source of truth for validation, and the same Zod vocabulary validates data read back from storage or an imported file. React Hook Form keeps re-renders local to the field being typed in. |
| **Recharts** | Composable React chart primitives — enough control to theme axes, tooltips and per-bar colours without hand-rolling SVG. |
| **Lucide** | Consistent, tree-shakeable icon set. |
| **Vitest + React Testing Library** | Vitest shares Vite's transform pipeline, so there is no second build configuration to maintain. Testing Library pushes tests towards what a user does, which is what makes them worth keeping. |
| **`localStorage`** | The requirement was "try it immediately, no account". A versioned envelope in `localStorage` gives persistence without any of the cost of authentication. |
| **`HashRouter`** | GitHub Pages serves static files, so `/applications/abc` would 404 on refresh. Hash routes resolve in the browser and need no rewrite rules. |

Dependencies were kept deliberately short: no state-management library (React
context plus pure reducer functions is enough at this size), no component
library, no drag-and-drop library, no date library.

## Getting started

Requires Node.js 18.18 or newer.

```bash
git clone <your-repository-url>
cd careerflow
npm install
npm run dev
```

Then open the URL Vite prints (usually `http://localhost:5173`).

> The first `npm install` generates `package-lock.json`. **Commit it** — CI uses
> `npm ci` when it is present, which makes every build reproducible.

### Available commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server with hot module replacement. |
| `npm run build` | Type check the project, then produce a static `dist/`. |
| `npm run preview` | Serve the built `dist/` locally to check the production bundle. |
| `npm test` | Run the unit and component tests once. |
| `npm run test:watch` | Run the tests in watch mode. |
| `npm run typecheck` | Type check without emitting. |
| `npm run lint` | Run ESLint over the project. |

## Architecture

```
src/
├── main.tsx                  Entry point: mounts <App> into #root
├── App.tsx                   Providers + hash routes
├── index.css                 Design tokens (CSS variables) and base styles
├── types/                    The domain model and its display labels
├── lib/                      Pure logic — no React imports anywhere in here
│   ├── schemas.ts              Zod: form validation + persisted/import validation
│   ├── applications.ts         Pure transformations over one application
│   ├── metrics.ts              Dashboard calculations
│   ├── filters.ts              Search, filtering and sorting
│   ├── storage.ts              Versioned localStorage read/write, corruption handling
│   ├── transfer.ts             JSON export and validated import
│   ├── dates.ts                Calendar-date handling (see "Dates" below)
│   ├── demoData.ts             The fictional sample records
│   ├── urls.ts, format.ts, ids.ts, cn.ts
├── state/                    React context: the store and the theme
├── components/ui/            Reusable primitives (Button, Dialog, Field, Badge…)
├── components/layout/        App shell, navigation, page header
├── features/                 Feature-specific components
│   ├── applications/           Form, table/cards, filters, Kanban, status control
│   ├── detail/                 Notes, interviews, tasks, timeline
│   └── dashboard/              Stat cards, charts, upcoming panels
├── pages/                    One component per route
└── test/                     Test factories and a provider-aware render helper
```

### Data flow

```
User action
   └─> page component calls a method on AppDataContext
          └─> provider applies a PURE function from lib/applications.ts
                 └─> setState with a new Application[]
                        ├─> every derived view recomputes (metrics, filters)
                        └─> an effect writes the whole collection to localStorage
```

There is one piece of application state — `Application[]` — held in
`AppDataProvider`. Everything else on screen is derived from it during render:
the dashboard figures via `computeDashboardMetrics`, the visible list via
`filterAndSortApplications`, the Kanban columns by grouping. Nothing is cached in
a second place, so nothing can drift out of step.

All the mutation rules live in `lib/applications.ts` as pure functions
(`createApplication`, `applyFormValues`, `withStatus`, `withTaskToggled`, …).
They take an application and return a new one, appending activity entries and
updating `updatedAt`. The provider is a thin mapping layer over them, and the
rules can be tested without rendering anything.

### Persistence

The whole collection is written to `localStorage` under `careerflow:data` as a
versioned envelope:

```json
{ "version": 1, "applications": [ /* … */ ] }
```

On startup `loadData()` returns one of three outcomes:

| Outcome | When | What the app does |
| --- | --- | --- |
| `empty` | No key stored — a first visit | Seeds the fictional sample data |
| `loaded` | Key present and valid | Uses it |
| `unreadable` | Not JSON, fails schema validation, or a newer `version` | Starts empty, copies the original to `careerflow:data:unreadable-backup`, and shows a notice |

The distinction between "no key" and "a key holding an empty list" is what makes
**Clear all data** stick: clearing writes `{"version":1,"applications":[]}`
rather than removing the key, so the next visit is not mistaken for a first visit
and re-seeded. Only *Reset to demo data* removes the key.

Reading back is validated with the same Zod vocabulary used for imports, so a
hand-edited or truncated payload cannot put an invalid record into the app.

### Dates

Two different things are called "a date", and mixing them up is the classic
source of off-by-one-day bugs:

- **Calendar dates** (application date, follow-up date, interview date, task due
  date) are stored as `YYYY-MM-DD` and always parsed by splitting the string and
  constructing a **local**-midnight `Date`. `new Date('2026-03-12')` is parsed as
  *UTC* midnight and renders as 11 March for anyone west of Greenwich, so it is
  never used.
- **Instants** (`createdAt`, `updatedAt`, activity timestamps) are ISO-8601 in
  UTC and formatted in the visitor's locale.

Interview times are a local wall-clock `HH:mm`. The interview form and the
interview list both name the browser's timezone explicitly, so there is no
ambiguity about what "14:30" means.

### Accessibility

- Semantic landmarks (`<main>`, `<nav aria-label>`, `<aside>`), a skip link, and
  a heading per page.
- Every input has a real `<label>`; errors are wired with `aria-describedby` and
  `aria-invalid`.
- The dialog is hand-built so its behaviour is explicit and reviewable: labelled
  by its heading, focus moved in on open, Tab kept inside, Escape to dismiss,
  focus returned to whatever opened it, and the page behind it locked from
  scrolling.
- Status changes use a native `<select>` everywhere, including on the Kanban
  board — so moving a card between columns is a keyboard operation, not a drag.
- One consistent, visible focus ring; `prefers-reduced-motion` respected.
- Both charts have a visually hidden data table carrying the same numbers, and
  neither relies on colour alone to convey identity.

## Testing

```bash
npm test
```

The suite covers the logic most likely to break silently:

| File | What it pins down |
| --- | --- |
| `src/lib/applications.test.ts` | Creating and editing: trimming, money parsing, clearing optional fields, activity entries, form round-trips, and the validation rules (required fields, unusable links, salary ranges, impossible dates). |
| `src/lib/filters.test.ts` | Search across company and title, case/accent insensitivity, OR within a filter and AND between filters, all three sort keys, and immutability. |
| `src/lib/metrics.test.ts` | Every dashboard figure against a fixed "today", weekly bucketing, exclusion of closed applications from upcoming interviews and open tasks, and the empty-data case. |
| `src/lib/storage.test.ts` | Save/load round-trip, "cleared" vs "never visited", malformed JSON, schema violations, a newer format version, and the quarantine backup. |
| `src/lib/transfer.test.ts` | Export shape, three accepted import shapes, and every rejection path — including that a rejected import never returns records, so it cannot cause data loss. |
| `src/pages/ApplicationsPage.test.tsx` | End-to-end through the real provider: adding an application, validation blocking a bad submit, Escape discarding a draft, search and status filtering, changing status, and the delete confirmation. |
| `src/pages/SettingsPage.test.tsx` | Clearing data without re-seeding, restoring the sample data, and the theme being remembered. |

## Deployment

The app is a static bundle. `.github/workflows/deploy.yml` builds it and
publishes it to GitHub Pages on every push to `main`.

Two details make it work on a project page:

- **Base path.** A project page is served from
  `https://<user>.github.io/<repo>/`, so the bundle needs that prefix. The
  workflow passes `VITE_BASE=/${{ github.event.repository.name }}/`, which
  `vite.config.ts` reads. Taking it from the repository name means renaming or
  forking the repository does not break the build. Locally it defaults to `/`.
- **Routing.** `HashRouter` puts the route after `#`
  (`/careerflow/#/applications/abc`), so refreshing or opening a deep link never
  reaches the server as an unknown path. No 404 fallback file is needed.

### Publishing to GitHub

Run these from the project folder.

1. **Create the repository.** On <https://github.com/new>, give it a name (for
   example `careerflow`), choose **Public**, and do **not** add a README,
   `.gitignore` or licence — this project already has them.

2. **Push the project.**

   ```bash
   git init
   git add .
   git commit -m "Add CareerFlow job application tracker"
   git branch -M main
   git remote add origin https://github.com/<your-username>/careerflow.git
   git push -u origin main
   ```

   Make sure `package-lock.json` is committed — run `npm install` first if you
   have not already.

3. **Enable GitHub Pages.** In the repository, go to **Settings → Pages**, and
   under **Build and deployment → Source** choose **GitHub Actions**. Do not
   choose "Deploy from a branch".

4. **Run the deployment.** The push in step 2 already triggered it. Open the
   **Actions** tab and watch **Deploy to GitHub Pages**. If you enabled Pages
   after pushing, re-run it: open the workflow, then **Run workflow** on the
   `main` branch.

5. **Find and verify the URL.** When the `deploy` job finishes, its summary shows
   the page URL; it also appears under **Settings → Pages**. It will be
   `https://<your-username>.github.io/careerflow/`. Open it in a private window
   (so you are certain no login is involved), confirm the sample data appears,
   add an application, refresh, and check it is still there.

Keep the two links distinct when you share the project:

- **Repository (source code):** `https://github.com/<your-username>/careerflow`
- **Live application:** `https://<your-username>.github.io/careerflow/`

### Deploying somewhere else

Any static host works. Build with the right base path and upload `dist/`:

```bash
VITE_BASE=/ npm run build   # for a host serving from the domain root
```

## Browser storage — what it means for you

CareerFlow has no server. Everything you enter lives in **this browser, on this
device**, in `localStorage`.

- Your data is **not synced** between devices, browsers or profiles.
- Clearing site data, "clear browsing history" with site data selected, or
  uninstalling the browser will delete it.
- Private/incognito windows usually discard it when the window closes. If the
  browser blocks storage entirely, CareerFlow says so and keeps working in
  memory for that session.
- `localStorage` is limited to roughly 5 MB per site. That is thousands of
  applications, but if a write ever fails the app tells you rather than losing
  changes silently.
- Anyone with access to your browser profile can read it. It is not encrypted.

**Export a JSON file before changing machines or clearing your browser.** Settings
→ Export JSON.

## Engineering decisions

Things that went one way rather than another, and why.

**A `localStorage` envelope with a `version` field, not a bare array.** Costs one
extra field today and buys the ability to migrate later without guessing at what
an old payload looked like. `migrate()` already exists as the seam; it is a
no-op for version 1.

**Clearing writes an empty list instead of removing the key.** The requirement
"do not repopulate data after the user intentionally clears it" is only
satisfiable if "no data" and "no key" are different states. This is the single
design decision that makes that behaviour correct rather than accidental, and it
has a test of its own.

**Form schemas do not use Zod transforms.** It is tempting to have Zod parse
`"65000"` into `65000`. Doing so makes a schema's input and output types differ,
which React Hook Form's generics then have to thread through
`useForm<TFieldValues, TContext, TTransformedValues>` — a common source of
type errors that get silenced with `any`. Instead every form field stays a
string, Zod validates it, and the one string-to-number conversion happens
explicitly in `fieldsFromForm`. Input and output types are identical, the
generics collapse to one, and the conversion is unit-tested.

**Editing rebuilds the record from the form rather than spreading over it.**
`{...application, ...fields}` looks natural but means clearing an optional input
leaves the old value behind, because the key is simply absent from the update.
`applyFormValues` builds the new record from the form values plus the fields the
form does not own (`id`, `createdAt`, interviews, tasks, activity), so clearing a
field actually clears it. There is a test for exactly this.

**No drag and drop on the Kanban board.** Drag and drop needs a keyboard
equivalent to be accessible, and the requirement was explicit that it must not be
the only way to change status. Building the accessible control first — a labelled
native `<select>` on every card — gets the whole feature working on touch,
keyboard and screen readers with no library. Drag and drop would be a
progressive enhancement on top; it is listed under future improvements rather
than half-built.

**The dialog is hand-built rather than pulled from a library.** The behaviours
that matter (focus trap, focus restoration, Escape, scroll lock, labelling) are
about 60 lines and are the part an interviewer is most likely to ask about.
A library would hide them. For a larger product, Radix would be the right call.

**Dashboard figures carry their definitions on screen.** "Active: 4" is a number
someone has to trust. Printing "Still in play: Applied, Screening, Interview or
Offer" underneath costs one line and removes the ambiguity. The same definitions
are the assertions in `metrics.test.ts`.

**Chart colours are explicit hex per theme, not CSS variables.** Recharts writes
colours into SVG presentation attributes, where `var(--token)` is not resolved.
Each theme therefore gets a hand-picked palette validated against its own
surface, rather than a mechanical inversion of the other.

The status palette was run through a contrast and colour-vision check. Two pairs
sit below the usual separation target: Offer/Rejected (inherently green versus
red) and Saved/Applied. Both are accepted deliberately, because identity in that
chart comes from the category label on every bar plus the screen-reader table —
no reader has to distinguish the bars by hue. This is the kind of trade-off worth
making explicitly rather than discovering later.

**`HashRouter` over `BrowserRouter`.** Uglier URLs, but deep links and refreshes
work on GitHub Pages with no server configuration and no 404-redirect trick. For
a portfolio project whose whole point is being openable by a stranger, reliability
beats tidy URLs.

**Notes are rendered as text, and links are checked twice.** Notes go through
`whitespace-pre-wrap` text nodes, never `dangerouslySetInnerHTML`. Job links are
validated as `http(s)` in the form *and* again in `ExternalLink` before an `href`
is set, because imported JSON is user-supplied data that never passed through the
form. Anything else renders as inert text.

## Future improvements

Not implemented. Listed to show where the project would go next, not to imply it
already goes there.

- **Optional cloud sync**, behind an account, with the local-only mode kept as
  the default.
- **Drag and drop on the Kanban board**, as an enhancement layered over the
  existing select control.
- **CSV import**, to bring in an existing spreadsheet.
- **Contacts per application** — recruiters and interviewers, with their own
  follow-up history.
- **Documents per application** — which CV and cover letter version was sent.
- **Richer analytics** — response rate, time-to-first-response, conversion
  between stages, and how those vary by source.
- **Calendar export** (`.ics`) for interviews.
- **Undo** for deletions, instead of a confirmation dialog.
- **End-to-end tests** with Playwright, covering the flows the component tests
  approximate.
- **Internationalisation** — the interface is English-only today.

## Screenshots

None are included. They would have to be genuine captures of the running app,
and the environment this project was assembled in had no browser available. To
add your own: run `npm run dev`, capture the dashboard, the applications table,
the Kanban board and an application's detail page in both themes, save them under
`docs/screenshots/`, and link them here.

## Licence

[MIT](LICENSE).
