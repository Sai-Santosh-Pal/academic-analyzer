# Academic Analyzer

A multi-role (student / teacher / parent / admin) school academic-management and early-intervention app built with Expo SDK 57, expo-router and TypeScript.

- All statistics ("what changed", trends, early-warning flags) are computed on-device from a seeded demo dataset.
- Real accounts run on Firebase (email/password auth + per-school Realtime Database): the school creates the account, then adds teachers, who invite parents, who add their wards. The Firebase config is hard-coded in `src/services/firebase.ts`.
- Hack Club AI powers the assistant features — the app calls `https://ai.hackclub.com` directly with a key from `.env`. AI never invents numbers and its drafts are always teacher-reviewed.
- imgbb hosts avatar images (optional); report cards are real PDFs generated on-device (zero dependencies), single or bulk (ZIP) for a whole class.

## Run it

```bash
npm install
npx expo start          # app (Expo Go, simulator, or web)
```

### AI (Hack Club AI)

1. Create an account and API key at https://hackclub.com/ai/ (dashboard).
2. Put the key in `.env` as `EXPO_PUBLIC_HACK_CLUB_AI_KEY` (it is inlined into the app bundle, so treat it as public).

The app calls `https://ai.hackclub.com/proxy/v1/chat/completions` directly from every AI surface (investigations, study plans, lesson plans, interventions, weekly parent summaries, school intelligence, copilot, reports). If the call fails, the app silently switches to its built-in deterministic analytics engine. The `server/` proxy is now optional/legacy — only needed if you want to keep the key off the device.

## Optional integrations (all graceful)

Copy `.env.example` to `.env` and fill in values:

| Variable | Purpose |
| --- | --- |
| `EXPO_PUBLIC_HACK_CLUB_AI_KEY` | Hack Club AI key (https://hackclub.com/ai/) — powers all assistant features. |
| `EXPO_PUBLIC_IMGBB_KEY` | Hosts profile photos (https://api.imgbb.com) — used from the Profile screen. |

Firebase needs no configuration — the web-app config lives directly in `src/services/firebase.ts`. Data lives in the project's Realtime Database (`users/{uid}` profiles, `schools/{schoolId}`), and avatar images go through imgbb. For a production deployment, lock down the Realtime Database rules in the Firebase console (currently open for development).

## Real accounts (Firebase)

- Sign-in screen: email + password. "Create a school account" provisions the school (admin user + empty subject catalog).
- Admin → People → **Add teacher** creates a teacher login (subjects + classes).
- Teacher → Students → **Invite parent** creates a parent login.
- Parent → Manage children → **Create ward account** creates a student login, linked to the parent.
- Every account belongs to exactly one school; the school's data blob lives at `schools/{schoolId}/state/latest` and syncs live across devices.

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
- `src/ai/` — client with backend → offline-engine fallback, structured context builder.
- `src/components/` — design system (UI kit, icons, charts, AI result viewer, "what changed" strip).
- `src/app/` — expo-router routes; `(student)`, `(teacher)`, `(parent)`, `(admin)` role groups plus shared screens (profile, notifications, timeline, report-card).
- `src/services/` — PDF writer, ZIP writer, Firebase bridge, imgbb bridge.
- `server/` — zero-dependency AI proxy (Hack Club AI / OpenRouter compatible).

## Verification

```bash
npx tsc --noEmit
npx expo export --platform web   # full production bundle check
```