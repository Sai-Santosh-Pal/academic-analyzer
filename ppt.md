# ARC — Student Tracker

## Slide 1: Title
- **ARC — Student Tracker**
- A multi-role school academic-management and early-intervention platform
- Built for Students, Teachers, Parents and Admins
- Track marks, attendance, assignments and interventions school-wide
- Flag at-risk students early and act before they fall behind
- Every AI output is computed from real app statistics and teacher-reviewed before publishing

---

## Slide 2: Problem
- Schools manage student data across scattered spreadsheets, registers and paper reports
- Marks, attendance, assignments and timetable live in separate, disconnected silos
- Teachers spend hours manually calculating averages, trends and percentages
- At-risk students are often noticed too late — after marks have already fallen
- Parents have little visibility into their child's daily academic life
- Students cannot see their own progress trends or know what to work on
- Timetable scheduling and teacher substitution are done by hand, causing double-bookings and chaos
- No single source of truth for the whole school — every role sees different, inconsistent data
- Early-intervention decisions rely on guesswork instead of measurable evidence

---

## Slide 3: Aim
- Build one unified, offline-first academic-management app for an entire school ecosystem
- Give every role — Admin, Teacher, Parent, Student — a tailored dashboard and workflow
- Detect at-risk students early through rule-based early-warning flags
- Turn raw school data into plain-language AI insights that anyone can understand
- Ensure every AI output is grounded in real statistics, never invented numbers
- Automate repetitive tasks: report cards, summaries, class analysis, timetable generation
- Enable real-time collaboration: attendance, marks and interventions reflect instantly across roles
- Make school data actionable with a Collect → Detect → Explain → Act → Measure cycle

---

## Slide 4: Solution
- **One app, four role-specific homes** — student, teacher, parent and admin, each routed to their own workspace after login
- **Offline-first architecture** — the full school dataset lives on-device, with optional live cloud sync via Firebase Realtime Database
- **Rule-based early-warning system** — flags subject decline, low overall percentage, low attendance and missing assignments, with urgency scoring and suggested actions
- **AI everywhere, with offline fallback** — AI surfaces switch to a built-in deterministic analytics engine when the AI backend is unreachable (shown as "Offline engine"); estimates are clearly labelled and drafts are always reviewed before publishing
- **On-device PDF report cards** — professional A4 report cards generated with zero dependencies, shareable and printable; bulk report cards packaged as one ZIP per class
- **Typed notification center** — auto-generated and event-driven notifications with unread counts, filters, "Read all" and tap-to-navigate deep links
- **School timeline / announcements** — a chronological feed of academic events, filtered per audience (everyone / teachers / parents / students)
- **Shared design system** — line, bar, donut and heatmap charts, sparklines, progress rings, "What changed" delta strips and tone-coded cards across every role
- **Self-service school registration** — an admin school account provisions the whole hierarchy: teachers, parents and students, each with their own login

---

## Slide 5: Features — Admin (1 of 4)
- **School dashboard** — school-wide KPIs: average performance %, average attendance %, flagged-students count, 8-week performance trend, subject health chart, homework-done ring, teacher workload and students needing attention
- **Early-warning system** — rule-based flags (subject decline, low overall %, low attendance, missing assignments) with urgency scoring and suggested actions
- **AI school intelligence report** — board / parents'-association style report generated from school-wide statistics, with previously generated reports saved
- **People directory** — searchable Students / Teachers / Parents tabs with class, roll number, subjects and teacher load % (warning above 80%)
- **Create and edit teachers** — name, sign-in email, temporary password, subjects taught (plus custom subjects) and class-teacher assignment
- **Class management** — create/edit classes (name, section, class teacher, subjects), enrolment-health monitor (amber above 90% full), class roster and per-class analytics
- **Manual timetable builder** — per-slot editor (subject → teacher → start/end time) with automatic double-booking conflict detection across the whole week and one-tap conflict removal
- **AI timetable generator** — constraint-aware weekly timetable from school days, periods per day, period duration, start time, breaks, optional zero period and free-text instructions; resolves conflicts with candidate suggestions and auto-fix; checks other classes' timetables so teachers are never double-booked
- **Substitution management** — review teacher leave requests (pending / substituted / approved / declined), assign a substitute manually or via auto-assign best teacher (free that day/period, subject-match first), decline, approve without substitute, edit/replace existing substitutions
- **Per-student deep dive** — AI investigation of any student, early-warning flags, overall trend, per-subject strength map with sparklines and linked parents
- **School timeline authoring** — create dated announcements targeted at Everyone / Teachers / Parents / Students
- **Settings** — school profile, cloud-sync toggle and "Reset demo data" danger zone

---

## Slide 6: Features — Teacher (2 of 4)
- **Teacher dashboard** — what changed this week, classes taught with improving/declining chips, students requiring attention, today's timetable, marking-pending banner, upcoming assessments, AI class insight and school timeline
- **Class analytics** — class pulse (average + improving/stable/declining), subject comparison chart, per-subject assessment trends, attendance overview (students below 88%) and class report generation
- **Mark attendance** — flow of Class → Subject → Date → Period with bulk "Mark all present/late", per-student Present/Absent/Late toggles, live counts and automatic updates to student and parent dashboards (class teachers only)
- **Assessments & marks** — create assessments (title, date, max marks) and enter marks per student by tapping to cycle scores, with color-coded pass/fail, progress tracking and instant recalculation of percentages, class averages and trends
- **Assessment analysis** — class average, median, high/low, score-distribution chart, top-scores table with SUPPORT flags for students below 55%, and AI analysis of common weaknesses
- **AI lesson planner** — generates objectives, structure, activities and a quick assessment for any subject/topic, editable before saving
- **AI class analysis** — strongest/weakest subjects, patterns and recommended actions
- **Interventions** — "Plan → act → measure" flow: AI-generated intervention plans (whole class or selected students, topic + observed problem), published plans auto-notify the student and parents, and measured impact (before → after scores, positive outcome / no improvement)
- **Student management** — searchable, filterable roster (All / Attention / Improving / Declining), add student accounts, per-student profile with AI investigation, subject sparklines, assessment history, pending-work list and linking codes
- **Parent communication** — AI-drafted messages (with review checklist: numbers match, supportive tone), send notifications to a parent or to an entire class / selected students / parents with priority levels
- **On leave** — submit leave requests (full day or specific periods) with reason; the school arranges a substitute and the teacher is notified on approval
- **Reports** — AI-generated class / student / assessment reports (saved automatically) plus bulk PDF report cards for the whole class

---

## Slide 7: Features — Parent (3 of 4)
- **Child dashboard** — overall performance ring with grade, attendance ring (90% benchmark), recent marks per subject with trends, what-changed strip, upcoming assessments, today's timetable, "to discuss" alerts (missing assignments, low attendance) and weekly AI summary
- **Manage children** — link children via linking codes provided by the school, create new ward accounts (with their own login), switch between wards anywhere in the app and unlink children at any time
- **Progress tracking** — overall trend line chart, per-subject charts, attendance donut with below-90% warnings and assignment status (submitted / pending / missing)
- **Calendar** — upcoming assessments, week-by-week timetable and the next 8 assignment deadlines
- **AI insights** — plain-language weekly summaries and full progress reports for the active child, auto-saved with history
- **Child reports** — library of school-generated reports with a full-screen reader, quick profile summary per child and one-tap PDF report card
- **Notifications & timeline** — inbox for teacher and school updates with deep links, plus the school activity timeline for their child

---

## Slide 8: Features — Student (4 of 4)
- **Student dashboard** — "why did this change?" button, what-changed strip, overall performance and attendance rings, per-subject performance with sparklines, today's timetable, next-deadline card with "Mark done", upcoming assessments and academic-status meters
- **Calendar** — day/week/month views merging personal study tasks, homework, exams, deadlines and class schedule; create/edit/complete tasks with type, time, duration, priority and daily/weekly repeat
- **Performance analytics** — overall trend vs 4 weeks ago, subject comparison and per-subject trends, attendance trend, strengths vs weak areas and full assessment history with deltas
- **AI Study Coach** — performance investigator, study-plan generator (hours per day, days, optional exam prep), what-if scenarios ("clearly labelled estimates") and an academic copilot with six contextual actions (analyse last test, explain weakest topic, recovery plan, what to study today, prepare for next assessment, compare progress)
- **AI reports** — generate a formal student report (period + optional focus instructions), saved to a reports library
- **Attendance analytics** — overall ring, 90% benchmark meter, monthly trend, subject-wise bars and a daily heatmap of absent-heavy periods
- **Assessments & assignments** — upcoming tests, completed history with scores, homework tracker with completed/pending counters, priorities, due/overdue states and "Mark complete"
- **Timetable & subjects** — weekly schedule (Mon–Fri, today highlighted) and per-subject deep dives with score-history charts
- **Notifications, timeline, report card & profile** — shared screens customized for the student role

---

## Slide 9: Technologies Used
- **Frontend framework** — React Native with Expo SDK 57, TypeScript, React 19
- **Navigation** — expo-router (file-based routing with role-based route groups)
- **State & persistence** — observable offline-first store with AsyncStorage on-device persistence
- **Backend / cloud** — Firebase (Authentication + Realtime Database) for optional live cloud sync
- **AI** — Hack Club AI backend with a built-in deterministic offline analytics engine as automatic fallback
- **Charts & data viz** — react-native-svg powered line, bar, donut, heatmap and sparkline charts
- **Report generation** — custom zero-dependency PDF writer (expo-print) and ZIP writer for bulk report cards
- **Media** — expo-image-picker for profile photos, hosted via the imgbb API
- **Animations & gestures** — react-native-reanimated, react-native-gesture-handler
- **Web support** — react-native-web, runs in Expo Go, simulators and the browser
- **Code quality** — ESLint (expo config), TypeScript strict type checking, automated QA test script (qa-test.mjs)

---

## Slide 10: Future Scope
- **Production-grade security** — lock down Firebase Realtime Database rules and add role-based access control
- **Multi-school cloud backend** — replace the optional/legacy proxy with a full server so AI keys never leave the server
- **SMS / email / push notification delivery** — take typed notifications beyond the in-app center
- **Curriculum & syllabus mapping** — attach outcomes to assessments and report against learning objectives
- **Advanced analytics** — long-term longitudinal trends, cohort comparisons and predictive at-risk modelling
- **Parent-teacher meeting scheduling** — book slots directly from the app
- **Fee management & school administration modules** — expand beyond academics
- **Multi-language support** — localize the interface for diverse school communities
- **Offline sync conflict resolution** — smarter merge strategies for devices offline for long periods
- **Web admin console** — a full desktop experience for admins alongside the mobile app
- **Exam management & result publishing** — term exams, mark sheets and official transcript generation
- **Accessibility & WCAG AA audit** — screen-reader support and contrast hardening across every screen

---

## Slide 11: Thank You
- **Thank You!**
- ARC — Student Tracker
- One app. Four roles. Every student accounted for.
- Questions welcome