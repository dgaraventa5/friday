# Friday: Low-Stress Task Focus PRD (Current MVP)

### TL;DR
Friday is a focused personal productivity app that now ships as a working
Firebase-backed web experience. Authenticated users sign in with Google,
complete a short onboarding primer, and manage a tightly curated "Today" list
of up to four tasks that are automatically scheduled across a six-week horizon.
The product balances work and life via category hour limits, supports recurring
tasks, tracks daily streaks, and keeps data in sync between Firestore and local
storage so progress is resilient even when offline.

---

## Goals

### Business Goals
- Grow a reference-quality MVP that demonstrates Friday's prioritization model
  end to end (auth → onboarding → daily focus → schedule).
- Capture qualitative feedback from 10–15 real users on the value of the daily
  focus flow and category guardrails.
- Validate the Firebase + local-first architecture as a sustainable foundation
  for future mobile clients.
- Maintain a solo-friendly delivery cadence by keeping scope intentionally
  narrow and shipping observable improvements weekly.

### User Goals
- Land in the app and understand "what to do today" without being overwhelmed by
  a long list.
- Record tasks (including recurring work) with the right level of detail in
  under a minute.
- Trust that Friday will reshuffle upcoming work intelligently when capacity is
  tight or limits are exceeded.
- Keep work, home, and health in balance by configuring gentle hour caps per
  category.
- See momentum through progress feedback (streaks, completion celebration) and
  feel safe knowing data is synced across devices.

### Non-Goals
- Multi-user collaboration, shared lists, or delegated tasks.
- Deep analytics dashboards, burndown charts, or advanced reporting.
- Calendar sync, reminders, or push/email notifications (tracked for later).
- Native mobile apps—current focus is responsive web.

---

## Personas & Key Stories

### Busy Professional "Lisa"
- Needs to enter tasks quickly with due dates, importance, urgency, and expected
  effort so nothing falls through the cracks.
- Expects Friday to surface a manageable set of focus items and provide a full
  schedule when she wants to see further ahead.
- Appreciates being able to edit, reschedule, or delete tasks as priorities
  change without losing history.

### Neurodivergent / ADHD User "Alex"
- Benefits from seeing only a few high-value tasks at once and gentle visual
  cues when the day is complete.
- Relies on category limits and estimated hours to avoid over-booking work and
  under-investing in personal care.
- Counts on recurring tasks (daily habits, weekly chores) to regenerate without
  manual effort while still being editable if the routine shifts.

### Ambitious Self-Improver "Jordan"
- Wants to build streaks of daily progress and celebrate milestone days.
- Uses the schedule view to preview the next couple of weeks and confirm that
  long-term goals have space on the calendar.

---

## Current Product Experience

### Access & Authentication
- Google Sign-In is required to enter the app. Auth state is monitored and the
  marketing-style landing page doubles as the login experience.
- Protected routes ensure unauthenticated visitors never reach task data. A
  loading spinner covers the gap while Firebase resolves session state.

### Onboarding
- First-time users progress through a five-step narrative that explains the
  Friday philosophy before capturing the initial task through the live Task
  Input component.
- Completing the first task toggles the onboarding flag (stored in both
  Firestore and localStorage) and drops the user into "Today".

### Today View
- Shows up to four tasks at any time, blending completed and incomplete work so
  the list stays short while acknowledging progress.
- Task cards highlight category color, due date urgency (including overdue
  warnings), estimated time, and a recurring badge when relevant.
- A progress circle and daily streak indicator in the header reinforce momentum.
- Clearing every task presents a celebratory empty state; arriving with no tasks
  shows a welcome explainer instead of a blank screen.

### Task Creation & Editing
- Users create tasks via a bottom-sheet style modal: name, category, due date,
  estimated hours, importance, urgency, and optional recurrence settings.
- Recurrence supports daily, weekly (with weekday selection), and monthly
  cadences, with "never" or "after N occurrences" end conditions.
- Validation enforces required fields and reasonable numeric inputs. Category
  limits are checked before saving and users receive inline feedback if a limit
  would be breached.
- Tasks can be reopened for editing or deletion. Recurring series maintain a
  stable `recurringSeriesId`, and completing one occurrence schedules the next
  instance automatically.

### Scheduling & Prioritization
- Tasks are normalized each day and scored via an Eisenhower-inspired algorithm
  that accounts for importance, urgency, due date, age, and overdue status.
- The scheduler distributes work across a 42-day horizon, respecting:
  - A four-task-per-day cap (inclusive of completed and recurring work).
  - Category-specific weekday/weekend hour caps configurable in Settings.
  - Daily maximum hours (weekday vs. weekend) to prevent overload.
- A separate "Full Schedule" page lists every upcoming day using virtualization
  for smooth scrolling, skipping past dates except for the current day.

### Completion & Feedback
- Task completion toggles update the UI instantly and adjust the streak counter
  if a task is finished on a new day.
- When all focus tasks are complete, users see a motivational quote and visual
  celebration. Overdue states are surfaced via warning styling.

### Settings & Support Tools
- The user profile flyout displays account info, manual "Force Sync" controls,
  and logout. Category limits and daily hour caps can be tuned from the Settings
  sheet without leaving the Today view.
- Developer tools (test mode toggle, data reset, debugging panel) are hidden in
  a floating menu for internal use.

### Data Sync & Offline Resilience
- Tasks, categories, preferences, onboarding status, and streak state persist to
  Firestore per user while mirroring into localStorage for offline access.
- Writes queue and retry with exponential backoff. When Firestore is unavailable
  the app reports a queued state and later flushes pending updates.
- Firestore initialization chooses the optimal persistence mode (persistent
  cache vs. memory fallback) based on device capabilities.

### Analytics & Observability
- A lightweight `trackEvent` helper currently logs structured events to the
  console, keeping the integration surface ready for a future analytics vendor.
- Rich logger outputs (controlled by `utils/logger`) aid debugging in both
  development and production builds.

---

## Functional Scope Summary
| Area | Status | Notes |
| --- | --- | --- |
| Google authentication & protected routing | ✅ Shipped | Login page, loading states, logout. |
| Guided onboarding flow | ✅ Shipped | Narrative walkthrough + first-task capture. |
| Task CRUD & validation | ✅ Shipped | Includes recurrence, editing, deletion. |
| Prioritization & scheduling engine | ✅ Shipped | 4-task focus set, 42-day horizon, category/hour caps. |
| Today view & progress feedback | ✅ Shipped | Progress circle, streak counter, celebrations. |
| Full schedule view | ✅ Shipped | Virtualized list of upcoming days. |
| Category limit management | ✅ Shipped | Weekday/weekend hour configuration UI. |
| Streak tracking & milestones | ✅ Shipped | Stored locally and synced to Firestore. |
| Offline/local resilience | ✅ Shipped | LocalStorage mirror, queued writes, manual force sync. |
| Notifications & reminders | ⏳ Not yet | Placeholder for future iteration. |
| Mobile app clients | ⏳ Not yet | Responsive web only today. |
| Monetization | ⏳ Not yet | No paywall or subscription hooks. |

---

## UX Principles
- **Calm focus:** Limit surface area to the current day's priorities while still
  offering a schedule for planners.
- **Fast capture:** Keep task entry accessible from the bottom nav on every
  screen with keyboard-friendly forms.
- **Balanced life:** Reinforce cross-category balance visually and through
  guardrails instead of punitive warnings.
- **Accessible motion:** Animations are subtle and respect reduced-motion
  preferences; layout fits within the viewport on mobile.

---

## Success Metrics
### Activation & Engagement
- Onboarding completion rate (login → first task saved).
- Average number of tasks created per user per week and percent recurring.
- Ratio of days with at least one task completed (streak participants).

### Retention & Satisfaction
- 7-day and 30-day return rates for authenticated users.
- Qualitative feedback on perceived focus/clarity collected through interviews
  or surveys.
- Net Promoter-style question after two weeks of use.

### Reliability & Quality
- Error rate of Firestore sync operations (queued vs. failed writes).
- Median time to full data availability after login (auth + Firestore fetch).
- Bug regression count across weekly releases.

---

## Technical Notes
- **Stack:** React + TypeScript (Vite), Tailwind for styling, Firebase Auth,
  Firestore with adaptive persistence, date-fns for calendaring.
- **State:** Global contexts for auth and app data (tasks, categories,
  preferences, streak). Reducer handles CRUD, recurrence processing, and daily
  normalization.
- **Scheduling:** `assignStartDates` orchestrates the horizon plan while
  respecting category and hour constraints and ensuring recurring tasks appear on
  the correct days.
- **Storage:** Local helpers serialize/deserialize dates, normalize recurring
  days, and ensure migrations run when structures change.
- **Testing:** Unit tests cover scheduling edge cases, recurrence handling, and
  inputs (see `taskPrioritization.test.ts`, `TaskInput.test.tsx`, etc.).

---

## Known Gaps & Next Iterations
1. **Reminders & nudges:** Investigate notification channels (email/push) once
   task completion patterns are stable.
2. **Category customization:** Allow creating/editing custom categories from the
   UI (currently seeded defaults only).
3. **Progress insights:** Lightweight history/analytics views to reinforce
   streaks and celebrate wins beyond the daily loop.
4. **Mobile-optimized gestures:** Explore native wrappers or PWA enhancements if
   mobile adoption remains high.
5. **Monetization experiments:** Prototype value-add features (e.g., premium
   templates, coaching tips) once retention signals are strong.

---

## Risks & Mitigations
- **Sync conflicts:** Mitigated by batching writes, retries, and exposing a
  manual force-sync control for users.
- **User trust in prioritization:** Continue usability testing, consider exposing
  more transparency (e.g., "Why this task") in future iterations.
- **Scope creep:** Maintain the four-task focus constraint and resist adding
  advanced project management features until the core habit proves sticky.

