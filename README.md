# ARC — Student Tracker

A multi-role school academic-management and early-intervention app (student / teacher / parent / admin) built with Expo SDK 57, expo-router and TypeScript. The app tracks marks, attendance, assignments and interventions school-wide, flags at-risk students early, and turns school data into plain-language AI summaries — every AI output is computed from real app statistics and is teacher-reviewed before publishing.

## Common features (all users)

- **Email/password sign-in** with Firebase Auth and friendly error handling; after login each user is routed to their own role home
- **Self-service school registration** — a school account (admin) provisions the whole hierarchy: admin → teachers → parents → students, each with their own login
- **One-tap demo accounts** for all four roles (student, teacher, parent, admin) with a "Reset demo data" option
- **Offline-first data store** — full school dataset persisted on-device, with **optional live cloud sync** (Firebase Realtime Database) mirroring changes across devices in real time
- **Profile screen** — avatar (initials or uploaded photo hosted on imgbb), role-specific summary cards, account links, sign out
- **In-app notifications** — typed notification center (deadline, assessment, marks, attendance, timetable, intervention, warning, report, announcement, system) with unread count, All/Unread filters, "Read all", and tap-to-navigate deep links; notifications are auto-generated (due assignments, upcoming tests, attendance warnings) and event-driven (marks entered, leave resolved, interventions assigned)
- **School timeline / announcements** — chronological event feed (COLLECT → DETECT → EXPLAIN → ACT → MEASURE) merging school announcements with academic events, filtered per audience (everyone / teachers / parents / students)
- **PDF report card** — professional A4 PDF generated entirely on-device (zero dependencies) with overall %, grade, attendance and per-subject trends; shareable via the system share sheet and printable
- **Bulk report cards** — one PDF per student packaged into a single shareable ZIP (teacher/admin flow)
- **AI assistant everywhere, with offline fallback** — all AI surfaces call the Hack Club AI backend but silently switch to a built-in deterministic analytics engine if unreachable (shown as "Offline engine"); AI never invents numbers, estimates are clearly labelled, and drafts are always reviewed before publishing
- **Shared design system** — charts (line, bar, donut, heatmap, sparkline), progress rings, "What changed" delta strips, avatars, badges and tone-coded cards used across every role

## Admin features

- **School dashboard** — school-wide KPIs: average performance %, average attendance %, flagged students count, 8-week performance trend, subject health chart, HW-done ring, teacher workload, and students needing attention
- **Early-warning system** — rule-based flags (subject decline, low overall %, low attendance, missing assignments) with urgency scoring and suggested actions
- **AI school intelligence report** — generates a board/parents'-association style report from school-wide statistics; previously generated reports saved
- **People directory** — searchable Students / Teachers / Parents tabs with class, roll number, subjects and teacher load % (warning when > 80%)
- **Create and edit teachers** — name, sign-in email, temporary password, subjects taught (plus custom subjects), class-teacher assignment
- **Class management** — create/edit classes (name, section, class teacher, subjects), enrolment-health monitor (amber when > 90% full), class roster and per-class analytics
- **Manual timetable builder** — per-slot editor (subject → teacher → start/end time) with automatic **double-booking conflict detection** across the whole week and one-tap removal of conflicts
- **AI timetable generator** — constraint-aware weekly timetable from school days, periods per day, period duration, start time, breaks, optional zero period, and free-text instructions (e.g. "EVS every day first period"); resolves conflicts with candidate suggestions and auto-fix; checks other classes' timetables to never double-book teachers
- **Substitution management** — review teacher leave requests (pending / substituted / approved / declined), assign a substitute manually or via **auto-assign best teacher** (free that day/period, subject-match first), decline, approve without substitute, and edit/replace existing substitutions
- **Per-student deep dive** — AI investigation of any student, early-warning flags, overall trend, per-subject strength map with sparklines, and linked parents
- **School timeline authoring** — create dated announcements targeted at Everyone / Teachers / Parents / Students
- **Settings** — school profile, cloud-sync toggle, and "Reset demo data" danger zone

## Teacher features

- **Teacher dashboard** — what changed this week, classes taught with improving/declining chips, students requiring attention, today's timetable, marking-pending banner, upcoming assessments, AI class insight and school timeline
- **Class analytics** — class pulse (average + improving/stable/declining), subject comparison chart, per-subject assessment trends, attendance overview (students below 88%), and class report generation
- **Mark attendance** — flow of Class → Subject → Date → Period with bulk "Mark all present/late", per-student Present/Absent/Late toggles, live counts, and automatic updates to student and parent dashboards (class teachers only)
- **Assessments & marks** — create assessments (title, date, max marks) and enter marks per student by tapping to cycle scores, with color-coded pass/fail, progress tracking, and instant recalculation of percentages, class averages and trends
- **Assessment analysis** — class average, median, high/low, score-distribution chart, top-scores table with SUPPORT flags for students below 55%, and AI analysis of common weaknesses
- **AI lesson planner** — generates objectives, structure, activities and a quick assessment for any subject/topic; editable before saving
- **AI class analysis** — strongest/weakest subjects, patterns and recommended actions
- **Interventions** — "Plan → act → measure" flow: AI-generated intervention plans (whole class or selected students, topic + observed problem), published plans auto-notify the student and parents, and measured impact (before → after scores, positive outcome / no improvement)
- **Student management** — searchable, filterable roster (All / Attention / Improving / Declining), add student accounts, per-student profile with AI investigation, subject sparklines, assessment history, pending-work list and linking codes
- **Parent communication** — AI-drafted messages (with review checklist: numbers match, supportive tone), send notifications to a parent or to an entire class / selected students / parents with priority levels
- **On leave** — submit leave requests (full day or specific periods) with reason; the school arranges a substitute and the teacher is notified on approval
- **Reports** — AI-generated class / student / assessment reports (saved automatically) plus bulk PDF report cards for the whole class

## Parent features

- **Child dashboard** — overall performance ring with grade, attendance ring (90% benchmark), recent marks per subject with trends, what-changed strip, upcoming assessments, today's timetable, "to discuss" alerts (missing assignments, low attendance), and weekly AI summary
- **Manage children** — link children via linking codes provided by the school, create new ward accounts (with their own login), switch between wards anywhere in the app, and unlink children at any time
- **Progress tracking** — overall trend line chart, per-subject charts, attendance donut with below-90% warnings, and assignment status (submitted / pending / missing)
- **Calendar** — upcoming assessments, week-by-week timetable, and the next 8 assignment deadlines
- **AI insights** — plain-language weekly summaries and full progress reports for the active child, auto-saved with history
- **Child reports** — library of school-generated reports with a full-screen reader, quick profile summary per child, and one-tap PDF report card
- **Notifications & timeline** — inbox for teacher and school updates with deep links, plus the school activity timeline for their child

## Student features

- **Student dashboard** — "why did this change?" button, what-changed strip, overall performance and attendance rings, per-subject performance with sparklines, today's timetable, next-deadline card with "Mark done", upcoming assessments, and academic-status meters
- **Calendar** — day/week/month views merging personal study tasks, homework, exams, deadlines and class schedule; create/edit/complete tasks with type, time, duration, priority and daily/weekly repeat
- **Performance analytics** — overall trend vs 4 weeks ago, subject comparison and per-subject trends, attendance trend, strengths vs weak areas, and full assessment history with deltas
- **AI Study Coach** — performance investigator, study-plan generator (hours per day, days, optional exam prep), what-if scenarios ("clearly labelled estimates"), and an academic copilot with six contextual actions (analyse last test, explain weakest topic, recovery plan, what to study today, prepare for next assessment, compare progress)
- **AI reports** — generate a formal student report (period + optional focus instructions), saved to a reports library
- **Attendance analytics** — overall ring, 90% benchmark meter, monthly trend, subject-wise bars, and a daily heatmap of absent-heavy periods
- **Assessments & assignments** — upcoming tests, completed history with scores, homework tracker with completed/pending counters, priorities, due/overdue states and "Mark complete"
- **Timetable & subjects** — weekly schedule (Mon–Fri, today highlighted) and per-subject deep dives with score-history charts
- **Notifications, timeline, report card & profile** — shared screens customized for the student role

## Run it

```bash
npm install
npx expo start          # app (Expo Go, simulator, or web)
```

### AI (Hack Club AI)

1. Create an account and API key at https://hackclub.com/ai/ (dashboard).
2. Put the key in `.env` as `EXPO_PUBLIC_HACK_CLUB_AI_KEY` (it is inlined into the app bundle, so treat it as public).

The app calls `https://ai.hackclub.com/proxy/v1/chat/completions` directly from every AI surface. If the call fails, the app silently switches to its built-in deterministic analytics engine. The `server/` proxy is now optional/legacy — only needed if you want to keep the key off the device.

### Optional integrations (all graceful)

Copy `.env.example` to `.env` and fill in values:

| Variable | Purpose |
| --- | --- |
| `EXPO_PUBLIC_HACK_CLUB_AI_KEY` | Hack Club AI key (https://hackclub.com/ai/) — powers all assistant features. |
| `EXPO_PUBLIC_IMGBB_KEY` | Hosts profile photos (https://api.imgbb.com) — used from the Profile screen. |

Firebase needs no configuration — the web-app config lives directly in `src/services/firebase.ts`. Data lives in the project's Realtime Database (`users/{uid}` profiles, `schools/{schoolId}`), and avatar images go through imgbb. For a production deployment, lock down the Realtime Database rules in the Firebase console (currently open for development).

## Demo accounts

| Role | User | Home |
| --- | --- | --- |
| Student | Aarav Sharma (`usr_student_demo`) | `/student` |
| Teacher | Kavita Verma, Physics, class teacher of XI-A (`usr_teacher_demo`) | `/teacher` |
| Parent | Rahul Sharma, two children (`usr_parent_demo`) | `/parent` |
| Admin | Priya Deshmukh (`usr_admin_demo`) | `/admin` |

The login screen lists all four; a "Reset demo" option restores the seeded dataset at any time.

## Code map

- `src/data/` — typed schema, deterministic seed (120 students, 5 classes), stats engine, observable store (local + cloud persistence).
- `src/ai/` — client with backend → offline-engine fallback, structured context builder, AI timetable generator.
- `src/components/` — design system (UI kit, icons, charts, AI result viewer, "what changed" strip).
- `src/app/` — expo-router routes; `(student)`, `(teacher)`, `(parent)`, `(admin)` role groups plus shared screens (profile, notifications, timeline, report-card).
- `src/services/` — PDF writer, ZIP writer, Firebase bridge, imgbb bridge.
- `server/` — zero-dependency AI proxy (Hack Club AI / OpenRouter compatible).

## Verification

```bash
npx tsc --noEmit
npx expo export --platform web   # full production bundle check
```