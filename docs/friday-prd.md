# Friday: The Low-Stress To-Do List App PRD

### TL;DR

A focused to-do list app designed for busy professionals and
neurodivergent users seeking a low-stress way to manage daily
priorities. The app leverages the Eisenhower Matrix and simple
category-based limits to surface no more than four essential tasks per
day, reducing cognitive load and helping users achieve well-rounded,
intentional productivity.

------------------------------------------------------------------------

## Goals

### Business Goals

- Launch a minimum lovable product (MLP) for web, followed by mobile, as
  a learning-driven solo project.

- Achieve consistent daily active users within the first three months of
  launch.

- Collect actionable feedback to iterate and improve prioritization and
  UX.

- Validate potential for future monetization through a subscription
  model.

- Maintain lean operations to enable fast pivots and feature additions.

### User Goals

- Quickly and easily input, manage, and prioritize daily tasks without
  organizational overhead.

- Surface only high-priority, manageable workloads to lower day-to-day
  stress.

- Automatically focus on urgent and important items through intelligent
  task scoring.

- Experience improved balance across work, personal, health, and other
  key life categories.

- Enjoy a clean, clutter-free UI with minimal distractions.

### Non-Goals

- Team or collaborative task/project management features.

- In-depth analytics, Gantt charts, or complex reporting.

- Enterprise integrations or multi-user permissions.

------------------------------------------------------------------------

## User Stories

### Busy Professional

- As a busy professional, I want to add new tasks in seconds, so that I
  don’t lose track of things that pop up quickly.

- As a busy professional, I want my top 4 daily tasks auto-surfaced
  based on importance/urgency, so that I focus on what matters most each
  day.

- As a busy professional, I want to create recurring work tasks, so that
  routine responsibilities don’t slip.

- As a busy professional, I want to set limits on how many work-related
  tasks to tackle in a day, so that I don’t get overwhelmed.

- As a busy professional, I want to review and edit any incomplete tasks
  from the previous day, so that nothing falls through the cracks.

- As a busy professional who feels overwhelmed by long to-do lists, I
  want to be shown only my four most important tasks each day so I can
  focus and feel accomplished without constant distraction.

### Neurodivergent / ADHD User

- As an ADHD user, I want a simple way to break down my day by category
  (work, home, health), so that I feel less scattered.

- As an ADHD user, I want the app to limit the number of visible tasks,
  so that I’m not paralyzed by endless lists.

- As an ADHD user, I want clear prompts and minimal distractions, so
  that I stay focused during input and review.

- As an ADHD user, I want to trust the app’s prioritization, so I don’t
  have to make tough decisions about what to tackle next.

- As an ADHD user, I want to manage and edit recurring and overdue
  tasks, so that routine responsibilities stay manageable.

- As a user who struggles to balance work and personal priorities, I
  want to set daily category limits (e.g., Home, Health, Work) so my day
  never feels dominated by just one area and I maintain better life
  balance.

------------------------------------------------------------------------

## Functional Requirements

- **Core Task Management (Priority: Must-Have)**

  - **Quick Task Input:** Add, edit, and delete tasks with minimal
    steps.

  - **Task Completion:** Mark tasks as complete (with option to undo for
    a short period).

  - **Task Persistence:** Retain incomplete tasks for review or
    auto-resurface to the next day.

- **Intelligent Prioritization (Priority: Must-Have)**

  - **Auto-Scoring:** Score and prioritize tasks leveraging the
    Eisenhower Matrix (importance/urgency), days outstanding, and due
    date.

  - **Current Day Surfacing:** Limit the number of visible daily tasks
    to a maximum of 4, selected automatically by priority score.

- **Category Management (Priority: Should-Have)**

  - **Category Assignment:** Assign tasks to user-defined categories
    (e.g., Work, Home, Health).

  - **Category Limits:** Let users set daily limits per category (e.g.,
    max 2 work, 1 health per day).

- **Recurring Tasks (Priority: Should-Have)**

  - **Recurring Input:** Create tasks that repeat on chosen intervals
    (daily, weekly, custom).

- **Personalization & Settings (Priority: Nice-to-Have)**

  - Simple theme adjustment (light/dark).

  - Notification toggles (reminders for overdue/critical tasks).

- **Additional Features (Priority: Nice-to-Have)**

  - **Simple Task Archive:** View completed task history.

  - **Basic Data Export:** Download or sync tasks for personal records.

------------------------------------------------------------------------

## User Experience

**Entry Point & First-Time User Experience**

- Access via direct link or app store download (depending on platform).

- Simple email or SSO sign-up; skip optional for initial testing.

- 1-2 step onboarding: set your top categories, daily task number cap,
  and a brief explanation of the app’s philosophy (“See what matters.
  Don’t sweat the rest.”).

**Core Experience**

- **Step 1:** User lands on Today’s Tasks page.

  - “Add a Task” prominent, one-line input box always visible.

  - Minimalist dashboard—only today’s prioritized max 4 tasks.

- **Step 2:** When entering a task, users must enter the Task Name,
  Category, Importance (Important/Not Important), Urgency (Urgent/Not
  Urgent), Due Date, and Estimated Time in hours (allowing decimals).

- **Step 3:** User sees their top 4 tasks for the day, chosen by app’s
  scoring logic.

  - Option to click a 'View Full Schedule' button to display all tasks
    on their assigned days, which also toggles to hide the full task
    list.

- **Step 4:** User marks tasks complete as they go.

  - Real-time feedback for progress (gentle confetti, “Good job!” etc.).

- **Step 5:** Whenever a user Adds or Edits a task, the prioritization
  algorithm automatically re-runs to consider new/updated tasks for the
  day's top four tasks. However, only up to four tasks are actively
  shown at any time; if the user has already completed tasks today, only
  as many new tasks are surfaced as needed to keep the list capped at
  four.

- **Step 6:** Once all tasks are completed, the task list displays a
  calming, rewarding image, celebrating completion.

- **Step 7:** User can tweak category/day limits and recurring settings
  from a simple preferences panel at any time.

**Advanced Features & Edge Cases**

- For recurring tasks, offer a summary edit panel: “This task repeats
  every Monday. Change for just this week or all occurrences?”

- Edge: If a day has fewer than 4 tasks, show a positive affirmation
  rather than an empty list.

- Edge: If user tries to add more than allowed daily limit, explain why
  and suggest “focus on these first.”

**UI/UX Highlights**

- High contrast, easy navigation, clear type hierarchy.

- Responsive layout for quick web-to-mobile transition.

- Accessible color scheme and input interactions (aimed for
  neurodivergent comfort).

- Minimal animations; all feedback is gentle and non-obtrusive.

- Frictionless experience—no feature overload, every step justified by
  psychological ease.

------------------------------------------------------------------------

## Narrative

Lisa, a mid-career design manager, starts each day feeling overwhelmed
by reminders scattered across apps, sticky notes, and browser tabs.
She’s tried all the “pro” to-do tools, but endless lists and project
boards leave her even more stressed. Simple checklists are too generic
and don’t help her focus.

One day, Lisa tries the Low-Stress To-Do app. During her quick
onboarding, she sets Work, Home, and Health as her categories and caps
daily tasks at 4. Now, when she opens the app, she’s greeted only by
today’s four most important tasks—a mix of urgent work items and one
self-care commitment. The app’s prioritization algorithm, based on how
long tasks have lingered and what’s truly critical, lifts the hardest
decisions off her plate.

As she ticks off tasks, Lisa feels a sense of progress and balance, not
guilt. Her afternoons are spent on real priorities, and her evenings get
a nudge—“Great job finishing what mattered today!” She closes her laptop
content, anxiety dialed down. By helping Lisa consistently focus, the
app shifts her routine from chaos to calm. For the business, Lisa’s
story proves that less is often more—and that intentional, user-centered
design can create daily habits and long-term loyalty.

------------------------------------------------------------------------

## Success Metrics

### User-Centric Metrics

- **User Adoption:** Number of installs/sign-ups within first month.

- **Daily Active Users (DAU):** 7- and 30-day DAU/MAU ratio.

- **Task Engagement:** Average tasks entered and completed per user per
  day.

- **Category Usage:** Percentage of users activating and using multiple
  categories.

- **User Satisfaction:** Qualitative feedback (NPS, direct comments).

### Business Metrics

- **Web Launch Success:** Launch to a minimum of 100 active users in the
  first 4 weeks.

- **Mobile App Waitlist:** Sign-up target for mobile (pre-launch).

- **Retention:** At least 20% week 4 user retention.

- **Monetization Validation:** Record \# of users who signal willingness
  to pay (e.g., early subscription interest).

### Technical Metrics

- **Bug Rate:** \<2 critical bugs per launch phase.

- **Uptime:** \>99% service uptime post-launch.

- **Performance:** Core actions (add/edit/save/complete task) \<500ms.

### Tracking Plan

- Task created, edited, deleted.

- Task completed.

- Category created, edited, limits set.

- User session (login, logout).

- Recurring task added.

- Settings changed (theme, notifications).

- User feedback submitted.

------------------------------------------------------------------------

## Technical Considerations

### Technical Needs

- **Developed Initially in Cursor:** Fast, code-aided product
  development with real-time preview.

- **Prototype in Google Sheets/App Script:** For rapid validation and
  data model iteration.

- **Core Components:**

  - Task manager logic (input, scoring, CRUD).

  - User profile and preference storage (categories, limits).

  - Prioritization engine (Eisenhower-based, days-open/due-date
    modifier).

  - Responsive web interface; initial focus on web build.

### Integration Points

- Potential for SSO (Google/Apple login) for fast onboarding.

- Optional: Notification service (email/app) for daily reminders.

- Future: Sync with calendar services.

### Data Storage & Privacy

- Store task data, category settings, user prefs securely (prefer
  local-first + cloud backup approach).

- User data never sold/shared.

- Option for account deletion and data export.

### Scalability & Performance

- Designed for individual users; MVP load is low and manageable.

- Cursor enables rapid iteration—monitor as DAU scales and switch to
  scalable backend if needed.

### Potential Challenges

- Ensuring prioritization algorithm is trusted/transparent to users.

- Maintaining frictionless UX as features are added.

- Accessibility and performance across web/mobile platforms.

- Simple, reassuring empty/error states.

------------------------------------------------------------------------

## Milestones & Sequencing

### Project Estimate

- **Small:** ~2–4 weeks for MVP web version (solo effort); 1–2 weeks for
  gather/test/iterate feedback; mobile version following web.

### Team Size & Composition

- Extra-small: 1 person (Dom) acting as product manager, designer,
  engineer, and tester.

- Occasional ad hoc feedback from real users/friends.

### Suggested Phases

**1. Ideation & Design (2–3 days)**

- Deliverables: User journeys, low-/hi-fi wireframes, scoring logic
  outline.

- Dependencies: Early user research/feedback.

**2. Prototyping (4–7 days)**

- Deliverables: Google Sheets or App Script working prototype already
  complete.

- Dependencies: Migrate prototype functionalities to Cursor.

**3. MVP Build in Cursor (7–10 days)**

- Deliverables: Fully functional web app with task input, scoring,
  categories, limited daily surface.

- Dependencies: Prototyped user stories.

**4. Closed Beta & Feedback (3–5 days)**

- Deliverables: Invite handful of testers; collect usability data/UX
  friction.

- Dependencies: Feedback channels (survey, email).

**5. Web Launch (3–5 days post-beta)**

- Deliverables: Publicly accessible version; integrated feedback
  improvements.

- Dependencies: Bug fixes from beta.

**6. Mobile App Build & Release**

- Deliverables: Port to mobile if traction is promising; launch through
  app stores.

- Dependencies: Web version stable; app store review.

**7. Monetization Testing**

- Deliverables: Light subscription/paywall experiment for super-users.

- Dependencies: User base feedback, readiness for payments integration.