# Friday Onboarding Flow

This document defines the copy and actions for each step of the onboarding experience.  
Codex should implement the flow as `/onboarding` (feature-flagged with `onboarding_v1`).

---

## Step 1: Welcome
- **Title:** 👋 welcome to friday
- **Body:** A calmer way to run your day. Let’s get started.
- **Primary button:** **Get Started** → goes to Step 2
- **Secondary button:** none

---

## Step 2: Explanation
- **Title:** unlock your productivity
- **Body:** friday is not just another to-do list app. It's a sure-fire way to track and prioritize every task that you need to complete, whether at work or in your personal life. 
- **Primary button:** **Learn More** → goes to Step 3
- **Secondary button:** none

---

## Step 3: How It Works, part 1
- **Title:** how it works
- **Body:** Every task you add is prioritized based on a variety of factors: Due Date, Importance, and Urgency. 

Due Date: when is the task due? 
Importance: does this task help you accompish long-term and/or meaningful goals?
Urgency: does this task require immediate attention?

Our alogirthm will stack-rank every task based on these criteria, known as the Eisenhower Matrix. 

- **Primary button:** **Continue** → goes to Step 4
- **Secondary button:** none

## Step 4: How It Works, part 2
- **Title:** your task schedule
- **Body:** Once you start recording tasks, the 'Today' view will show you the top tasks for you to complete for the day. 

Cognitive research shows that humans only have so much mental energy in one day. By focusing on a few highest-priority tasks each day, you'll begin to feel your stress decrease and effectiveness improve. 

Watch yourself accomplish your goals more quickly, with your efforts compounding day over day.

- **Primary button:** **Let's do it** → goes to Step 5
- **Secondary button:** none

## Step 5: Connect your Google account
- **Title:** sign in with google
- **Body:** To save tasks and sync across devices, connect your Google account.

- **Primary button:** **Sign in with Google** → triggers Google sign-in
- **Secondary button:** none

---

## Step 6: Create Your First Task
- **Title:** create your first task
- **Body:** Let’s start simple. Add one task you’d like to get done today.
- **Action:** Show the existing **Task Form** component (same fields as on the main app: name, category, importance, urgency, due date, estimated time).
- **Primary button:** **Save Task** → adds task to “MasterTasks” sheet and goes to Step 7

---

## Step 7: Success
- **Title:** 🎉 great start!
- **Body:** Your first task is ready. Check Today’s list to see it. Add more tasks to unlock your productivity. 
- **Primary button:** **Go to Today** → redirect to Today view (the same screen that loads in `index.html`)
- **Secondary button:** none

---

# Implementation Notes
- Only show onboarding once per new user; set `localStorage.hasOnboarded = true` after completion.
- Wrap the entire flow in a feature flag named `onboarding_v1`.
- Analytics events to track:
  - `onboarding.step_view` — when a step is shown
  - `onboarding.button_click` — when a button is clicked
  - `onboarding.complete` — when the flow is finished
  - `onboarding.task_created` - when first task is created

---
