# CareerFlow — Job Application Tracker

CareerFlow is a browser-based tracker for a job search: every application in one
place, a board that shows where each one stands, interviews and follow-ups that
do not get forgotten, and a dashboard that answers "how is this actually going?"

It runs entirely in the browser: open it and start using it, with no account and
no API key. **Optionally**, it can sign in to a
[CareerFlow API](https://github.com/anoos2020anoos-png/careerflow-api) server
from Settings and keep your data in an account instead (see
[Optional account](#optional-account)).

- **Live demo:** <https://anoos2020anoos-png.github.io/careerflow/>
- **Repository:** <https://github.com/anoos2020anoos-png/careerflow>

The interface is available in **English and Arabic**, with the whole layout
mirroring to right-to-left for Arabic.

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
  employment type, salary range with its currency and pay period, application
  date, status, notes and a next follow-up date.
- Seven statuses: Saved, Applied, Screening, Interview, Offer, Rejected, Withdrawn.
- Search by company or role; filter by status, work arrangement, employment type,
  company sector, and whether the salary meets your expectation; sort by
  application date, company, last updated or salary.
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
- A track record built from your own history: how often an application got a
  reply, reached an interview, or reached an offer — each shown as a count over
  its denominator ("3 of 12"), with the definition beside it, the median wait for
  a first reply, and a warning while the sample is too small for the percentages
  to mean anything. It reports what has happened; it does not predict anything.

Every figure is derived from the stored records on each render, so the dashboard
updates the moment anything changes.

**Salary and currency**

- Each salary records its **pay period** — monthly, annual, daily or hourly —
  because a number without one is ambiguous: offers in Saudi Arabia are normally
  quoted monthly, elsewhere often annually, and a contract may be a day rate.
- Currency is picked from a list with the Gulf currencies first, each named by
  the browser in the interface language ("SAR — Saudi Riyal", "ريال سعودي"). A
  code from an imported file that is not on the list is kept, not replaced.
- An **expected salary** on the Background page. Every application with a salary
  in the same currency shows where it sits against it — above, within, below, or
  open-ended when only a minimum is stated — in the list and on the detail page.
- Only exact conversions are made: annual ÷ 12 = monthly, and the converted
  figure is shown. Nothing is converted between currencies, and a day or hour
  rate is only compared with another of the same kind. Anything that cannot be
  compared says so and why, instead of producing a guess.
- Sort by salary (the top of each range as a monthly amount; currencies grouped,
  never converted) and filter to the salaries that meet your expectation.
- New applications start in your expectation's currency and period, or SAR per
  month without one.

**Companies**

- A **Companies** page grouping your applications by employer: how many, at
  which stages, how many still in play, when you last applied — with a link to
  exactly those applications.
- Details per company: **sector** (government, semi-government, private,
  non-profit — a distinction that shapes hiring in Saudi Arabia), industry,
  website and notes. The applications list can be filtered by sector.
- **Rename** a company and every application under it follows. Renaming one
  spelling to another ("Sahab Cloud" → "Sahaab Cloud") merges them, and the form
  says so before you save.
- The application form suggests companies already in your list, so the same
  employer keeps one spelling.

**Requirements and your background**

- A **Background** page for what you can point to: degrees, languages, tools,
  certificates, experience. It stays in this browser like everything else.
- On each application, a panel for the requirements in the posting's own words,
  marked essential or preferred, and ticked when you have them.
- Adding a requirement pre-ticks it when your background plainly answers it —
  conservatively, and only as a starting point you can correct. A single word
  shared between two unrelated phrases is not treated as a match.
- The result is reported as **"4 of 6 essential"**, with its denominator beside
  it. It is a count of what the posting asked for, not a score and not a
  prediction: see [Engineering decisions](#engineering-decisions).
- A filter for applications where you meet every essential requirement. Ones
  with no requirements written down are excluded rather than included — an empty
  list has not claimed anything.

**Language**

- English and Arabic, switched from Settings or the top bar and remembered
  between visits.
- Arabic sets `lang` and `dir` on the document, and the layout mirrors from CSS
  logical properties rather than a second stylesheet: one set of styles serves
  both directions.
- Dates, times and currency follow the chosen language. Arabic uses Arabic month
  names with Western digits on the Gregorian calendar — not the Hijri calendar,
  which is what `ar-SA` would have given.
- The browser's own language is used on a first visit, so an Arabic-speaking
  visitor lands in Arabic; English is the fallback for everyone else.

**Data and appearance**

- Light, dark and "follow the system" themes, remembered between visits.
- JSON export, and import that validates the file before replacing anything.
- Reset to the sample data, or clear every record.
- Clear, in-app explanation of what browser-only storage means.
- An optional account: sign in to a CareerFlow API server from Settings to keep
  the same data there instead, with changes shown at once and saved in the
  background, and this browser's own data left untouched.
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
├── types/                    The domain model
├── i18n/                     Everything the interface says, in both languages
│   ├── messages.ts             The two dictionaries; English types the keys
│   ├── I18nProvider.tsx        Active locale, `lang`/`dir`, persistence
│   ├── i18n-context.ts         `useI18n` / `useT`
│   ├── labels.ts               Domain enum -> message key, checked by the compiler
│   └── fieldError.ts           Turns a Zod message key back into text
├── lib/                      Pure logic — no React imports anywhere in here
│   ├── schemas.ts              Zod: form validation + persisted/import validation
│   ├── applications.ts         Pure transformations over one application
│   ├── metrics.ts              Dashboard calculations
│   ├── match.ts                Requirements against the profile - counts, never a score
│   ├── salary.ts               Pay periods and the expectation check - exact arithmetic only
│   ├── companies.ts            Grouping by employer, rename and merge
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
{
  "version": 3,
  "applications": [ /* … */ ],
  "profile": { "qualifications": [], "salaryExpectation": { /* optional */ } },
  "companies": [ /* details the user saved about employers */ ]
}
```

Every change to that shape so far has been additive, so each migration is a
version stamp: an older payload is valid newer data with the new fields empty,
and they stay empty — a salary saved before pay periods existed is never assumed
to be monthly.

On startup `loadData()` returns one of three outcomes:

| Outcome | When | What the app does |
| --- | --- | --- |
| `empty` | No key stored — a first visit | Seeds the fictional sample data |
| `loaded` | Key present and valid | Uses it |
| `unreadable` | Not JSON, fails schema validation, or a newer `version` | Starts empty, copies the original to `careerflow:data:unreadable-backup`, and shows a notice |

The distinction between "no key" and "a key holding an empty list" is what makes
**Clear all data** stick: clearing writes an envelope with an empty
`applications` list rather than removing the key, so the next visit is not mistaken for a first visit
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
| `src/lib/filters.test.ts` | Search across company and title, case/accent insensitivity, OR within a filter and AND between filters, every sort key, and immutability; salary sorting that leaves unrankable records last in both directions and groups rather than converts currencies; the salary-expectation, company and sector filters. |
| `src/lib/salary.test.ts` | That annual ↔ monthly is the only conversion, that day rates, missing periods and other currencies are reported as "not compared" rather than guessed, every above / within / below / open-ended case, and the monthly value salaries are ranked by. |
| `src/lib/companies.test.ts` | What counts as the same company (case, accents, Arabic diacritics — and nothing looser), grouping and ordering, companies kept for their details after their last application goes, and rename, merge and clear. |
| `src/lib/format.test.ts` | Salary ranges with the currency written once, equal ends without an "approximately" sign, one-sided wording, and Arabic output with Western digits. |
| `src/lib/metrics.test.ts` | Every dashboard figure against a fixed "today", weekly bucketing, exclusion of closed applications from upcoming interviews and open tasks, and the empty-data case. |
| `src/lib/storage.test.ts` | Save/load round-trip, "cleared" vs "never visited", malformed JSON, schema violations, a newer format version, the quarantine backup, and migration from versions 1 and 2 without inventing a pay period. |
| `src/lib/transfer.test.ts` | Export shape, three accepted import shapes, and every rejection path — including that a rejected import never returns records, so it cannot cause data loss. |
| `src/lib/outcomes.test.ts` | The track-record figures: what counts as a reply, that an application which reached Interview and was later rejected still counts as interviewed, that Saved-only records stay out of the denominator, that withdrawing is not a reply, and the median wait including the even-count case. |
| `src/lib/match.test.ts` | The requirement counts, that an empty list reports "no requirements" rather than 0%, and the conservative matching rule — including that a degree in English does not pre-tick "English at business level". |
| `src/pages/ProfilePage.test.tsx` | Through the real provider: adding, removing and persisting a qualification, that the demo data seeds no invented background, that a matching requirement arrives pre-ticked and a non-matching one does not, and that unticking a suggestion sticks. |
| `src/pages/ApplicationsPage.test.tsx` | End-to-end through the real provider: adding an application, validation blocking a bad submit, Escape discarding a draft, search and status filtering, changing status, and the delete confirmation. |
| `src/pages/CompaniesPage.test.tsx` | Through the real provider: grouping, merging two spellings by renaming one (with the warning shown first and the result persisted), the link to one company's applications, the sector filter, and the company filter arriving from the URL. |
| `src/pages/SalaryExpectation.test.tsx` | Saving and reloading an expected salary, the meets / below markers in the list, no marker for a salary in another currency, and the salary filter. |
| `src/pages/SettingsPage.test.tsx` | Clearing data without re-seeding, restoring the sample data, and the theme being remembered. |
| `src/i18n/i18n.test.tsx` | That both dictionaries define the same keys with the same `{placeholders}` and no blank strings, that `fieldError` decodes a key with and without its argument and passes an unknown message through, and that switching language translates the interface, flips `dir` on the document and is remembered. |
| `src/lib/sync.test.ts` | The requests worked out for every kind of change (new, edited, deleted; interviews, tasks, requirements; profile and qualifications; companies; a full replace), `null` for cleared fields, ids passed through, and the queue: one request at a time, in order, only the latest answer per record applied, and a failure dropping what was waiting. |
| `src/lib/api.test.ts` | The API client: token and JSON handling, the error format read into codes and details, and an unreachable server, a timeout and a non-JSON answer told apart. |
| `src/pages/Account.test.tsx` | Through the real provider and a stand-in server: signing in shows the account's data and leaves this browser's alone; a change is sent and the server's version shown; a refused change is reloaded away; an ended session returns to this browser's data; the copy offer; a wrong password and a too-short new one explained; signing out. |

Beyond the suite, the account flow was run by hand in a real browser (Chromium,
through Playwright) against the real API: creating an account from Settings,
copying the sample data into it, reloading and staying signed in, a
qualification and a headline reaching the server, the server being stopped and
the app saying so, *Try again* after it restarted, the Arabic layout, and signing
out back to the browser's own data, with no errors in the browser console. That
script is not part of `npm test`.

## Deployment

The app is a static bundle. `.github/workflows/deploy.yml` runs the test suite,
builds it, and publishes it to GitHub Pages on every push to `main`. A push whose
tests fail is never published: the live demo only ever shows a build that passed.

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

## Optional account

Signed out (the default, and what the live demo does), everything stays in this
browser as described below. Signed in to a
[CareerFlow API](https://github.com/anoos2020anoos-png/careerflow-api) server
from **Settings → Account**, the same data belongs to your account instead, and
is there in any browser where you sign in.

On the live demo, the server address is already filled in: the hosted API at
`https://careerflow-api-yjwq.onrender.com`, running on Render's free plan with
its PostgreSQL database on Neon, both in Frankfurt. The free plan puts the
server to sleep when nobody has used it for a while, so the first sign-in after
that can take up to a minute; the app waits that long before giving up. To
keep that rare, a scheduled workflow (`.github/workflows/keep-api-awake.yml`)
asks the server for its health every ten minutes. A build
can suggest a different server with `VITE_API_URL`.

To try it on your own computer instead (`npm run dev` suggests this server):

1. Start the API: in the `careerflow-api` repository, `npm install` then
   `npm start`. It listens on `http://localhost:3000` and needs no database
   installed.
2. Start the app: here, `npm run dev`, and open `http://localhost:5173`.
3. In **Settings → Account**, leave the server address as
   `http://localhost:3000`, enter an email and a password of at least 15
   characters, and choose **Create account**. If this browser already holds
   applications, CareerFlow offers to copy them into the new account.

How it works:

- **Nothing about the screens changed.** Every change is applied on screen at
  once by the same functions as before. `lib/sync.ts` then compares the data
  before and after the change and works out the API requests that make the
  server agree (a `PATCH` of the fields, a `POST` of a new task, and so on).
- **Requests go one at a time, in order,** and each answer replaces the local
  copy of what it describes, so the server's version wins. New records are sent
  with the id the app already gave them, so they can be changed again before the
  server has answered, and the link to them stays valid.
- **If the server refuses a change, the account's data is reloaded,** so the
  screen never keeps showing something that was not saved. If the server cannot
  be reached, the app says so; *Try again* reloads what the server has.
- **No connection loses nothing.** If the server cannot be reached (or is
  still waking up), the change stays on screen, the status says how many are
  waiting, and they go out in order when it can be reached: tried again after
  a pause, and at once when the browser comes back online. The waiting changes
  and the account's data as last shown are kept in this browser, under keys of
  their own, so closing the tab loses nothing and the app opens with the data
  even offline. Signing out removes both.
- **This browser's own data is never touched while signed in.** Local storage
  is not written, and signing out brings it back exactly as it was.
- The session token is kept in `localStorage` (`careerflow:session`) and sent
  in the `Authorization` header, never as a cookie.

## Browser storage — what it means for you

Signed out, CareerFlow has no server. Everything you enter lives in **this
browser, on this device**, in `localStorage`.

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

**The requirements panel counts; it does not score.** The obvious feature here is
"your chance of getting this job: 72%". It is also the one thing this app cannot
honestly produce. Whether an application succeeds depends on the other
candidates, the hiring budget, the timing and the person reading the CV — none
of which is in this browser, so any percentage would be a number with a
confident shape and nothing behind it. What *is* knowable is how many of the
things a posting asked for the applicant can point to, because both lists are in
front of them. So the panel reports "4 of 6 essential", always with its
denominator, and `lib/match.ts` carries the reasoning at the top of the file so
the next person to open it does not quietly turn it into a score.

**The pre-tick is deliberately reluctant.** When a requirement is added, it
starts ticked if the profile plainly answers it — but the matching rule only
fires when one side's words are wholly contained in the other's. "React" matches
"React and TypeScript"; a degree in English does not match "English at business
level", because they share one word and nothing else. A false positive here is
worse than a false negative: a wrongly pre-ticked box is a claim the user never
made, sitting in their own records. Nothing re-ticks a box the user has cleared.

**The profile is not part of the demo data.** The fifteen sample applications are
fictional and say so. Seeding a background as well would mean inventing the
user's own degrees and languages, which is a different kind of fiction — so the
Background page starts empty, and the requirements panel explains itself without
it.

**Version 2 of the persisted format is additive, and the migration is a version
stamp.** `Application.requirements` and the top-level `profile` are both optional
in the schema, so a version 1 payload parses as-is; `migrate()` stamps the
version and `normalize()` fills the gaps before anything downstream sees the
data. Nothing is quarantined and nothing is lost, which is the whole reason the
envelope carried a `version` field from the first commit.

**Salaries are converted only where the arithmetic is exact.** A year is twelve
months, so annual and monthly figures are compared through ÷ 12, and the
converted figure is shown next to the verdict so the step is visible. Every
other conversion needs an assumption that would quietly become part of the
answer — how many working days in a month turns a day rate into a monthly
salary; an exchange rate turns SAR into AED, and a static site has nowhere to
fetch one and no business shipping a stale table. So `lib/salary.ts` refuses
them, and a comparison that cannot be made is reported with its reason instead of
as a result. "Not compared" and "does not meet" are different things, and the UI
never lets one pass for the other.

**A missing pay period is never assumed.** Records saved before periods existed
have none, and the form offers "Not specified" so opening and saving one of them
does not stamp "monthly" on it. It would be the likely answer — which is exactly
why it is dangerous: a wrong default looks like data.

**Companies are names, not records the user has to create first.** Typing a
company into an application is still all it takes; the Companies page groups by
a normalised form of the name. The normalisation is deliberately narrow — case,
accents, Arabic diacritics and spacing, nothing more — because a looser rule
would merge employers the user never said were the same. Two genuinely different
spellings are fixed by renaming one to the other, which the page offers and
explains before saving. Details the user writes about a company are keyed the
same way and kept even after its last application is deleted, so notes are never
silently hidden.

**The live site is only published from a passing build.** CI and deployment are
separate workflows that both run on every push, so on their own a failing test
would turn CI red while the broken build still went live. The deploy workflow
runs the suite itself before building.

**English is the source of truth for translations, and the compiler enforces the
rest.** `messages.ts` defines the English dictionary as a plain object; its keys
become `MessageKey`, and every other locale is typed `Record<MessageKey, string>`.
Adding a string to English and forgetting it in Arabic is a build failure rather
than a sentence that silently comes out in the wrong language. The same trick
covers the domain enums: `labels.ts` maps each status, work arrangement and
interview type through an explicit `Record<Enum, MessageKey>`, so a new status
cannot ship without a translation. A test also checks that both dictionaries use
the same `{placeholders}`, which types cannot catch.

**Validation messages travel through Zod as keys, not sentences.** The schemas in
`lib/schemas.ts` run outside React — in tests, and on import — where there is no
translate function to call, and Zod's `message` is a plain string. So a rule
reports `validation.maxLength|120`, and `fieldError` turns that back into text at
the point it is rendered. Anything that is not a known key passes through
untouched, so Zod's own built-in messages still reach the user instead of
vanishing. A side effect worth naming: these messages now sit under the field's
own label and no longer repeat its name — "Required", not "Company is required".

**Activity entries store a token, not a finished sentence.** An entry written
before the language switch would otherwise stay in the old language forever,
because it was persisted as English prose. `applyFormValues` now records
`'details'` and the timeline decides the wording at render time. Records from
earlier versions still carry their English text and are shown verbatim rather
than dropped.

**The charts stay left-to-right in both languages.** This one was tried the other
way first. Recharts positions tick and value labels with `text-anchor: start|end`,
which only means "left|right" in a left-to-right coordinate system; inside an RTL
document the anchors flip while the space the library reserved does not, and on
the deployed Arabic page the status chart's category labels ended up painted
underneath the bars. Setting `orientation="right"` and `reversed` moved the
geometry but not the anchors. `.cf-chart` is therefore pinned to `direction: ltr`
and both charts use the geometry that has rendered correctly in English since the
first commit; only the label text is translated. A left-to-right value axis is an
ordinary choice in Arabic interfaces, and the card, heading, description and
screen-reader table around the chart all still mirror.

**`Intl` is told the locale explicitly.** `Intl` does not read `<html lang>`, and
passing `undefined` follows the browser rather than the language the visitor
picked, so an Arabic interface would still print English month names. Rather than
thread a locale argument through every date and number helper and every component
that calls one, `lib/locale.ts` records the active choice and the helpers read it;
`I18nProvider` is the only writer. Arabic formats as `ar-u-nu-latn` — Arabic month
names, Western digits, Gregorian calendar. Plain `ar-SA` would have switched the
whole app to the Hijri calendar, which is not what a job tracker wants.

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

- **Changes made while the server is unreachable are not kept.** Signed in, a
  change the server never received is shown as not saved and replaced by the
  server's data on *Try again*. Queuing it and sending it later is the next step.
- **A hosted API.** The account feature works against a server you run; none is
  deployed, so the live demo stays local-only.
- **Drag and drop on the Kanban board**, as an enhancement layered over the
  existing select control.
- **CSV import**, to bring in an existing spreadsheet.
- **Contacts per application** — recruiters and interviewers, with their own
  follow-up history.
- **Documents per application** — which CV and cover letter version was sent.
- **Where applications came from** — a source per application (referral, job
  board, company site), so the track record could show which sources get replies.
  Reply rate and time to first reply exist already; what is missing is the source.
- **Calendar export** (`.ics`) for interviews.
- **Undo** for deletions, instead of a confirmation dialog.
- **End-to-end tests in CI.** The account flow was checked in a real browser
  against a running API (see [Testing](#testing)), but that check is a script
  run by hand, not part of the automated suite.
- **Translating the import diagnostics.** The messages in `lib/transfer.ts` that
  explain why a JSON file was rejected are still English only — they describe
  file-format problems and some come straight from Zod, so they need more than a
  lookup table.
- **Proper Arabic plural forms.** Arabic changes the noun by number (طلب،
  طلبان، طلبات، طلبًا), and the current one/many switch cannot express that, so
  new Arabic counts are written as "label: number" (الطلبات: ٣), which is correct
  for every number. `Intl.PluralRules` knows all six Arabic categories and is
  the right way to replace both the workaround and the older strings that still
  use a single plural form.
- **More languages.** The structure takes a third without changes: add a
  dictionary and a `LOCALES` entry, and the compiler lists every string still
  missing.

## Screenshots

None are committed to the repository. The
[live demo](https://anoos2020anoos-png.github.io/careerflow/) is the visual
reference in the meantime — it runs the same build, seeded with the sample data,
and needs nothing installed.

To add captures here: run `npm run dev`, then capture the dashboard, the
applications table, the Kanban board and an application's detail page. Worth
doing in both themes and both languages, since the right-to-left layout is one
of the things worth showing. Save them under `docs/screenshots/` and link them
from this section.

## Licence

[MIT](LICENSE).
