// taskPrioritization.ts
// Utilities for scoring, prioritizing, and selecting daily tasks using the Eisenhower Matrix and other rules.

import { Task, TaskScore, EisenhowerQuadrant } from '../types/task';
import { isToday, differenceInDays, isPast, getDay } from 'date-fns';
import { normalizeDate, getDateKey, isSameNormalizedDay } from './dateUtils';

// Calculate a score for a task based on importance, urgency, due date, and age
export function calculateTaskScore(task: Task): TaskScore {
  const isImportant = task.importance === 'important';
  const isUrgent = task.urgency === 'urgent';

  // Determine Eisenhower quadrant and base score
  let quadrant: EisenhowerQuadrant;
  let baseScore = 0;

  if (isUrgent && isImportant) {
    quadrant = 'urgent-important';
    baseScore = 100;
  } else if (!isUrgent && isImportant) {
    quadrant = 'not-urgent-important';
    baseScore = 80;
  } else if (isUrgent && !isImportant) {
    quadrant = 'urgent-not-important';
    baseScore = 60;
  } else {
    quadrant = 'not-urgent-not-important';
    baseScore = 40;
  }

  // Calculate days overdue or due soon
  const daysOverdue =
    isPast(task.dueDate) && !isToday(task.dueDate)
      ? Math.abs(differenceInDays(new Date(), task.dueDate))
      : 0;

  const daysToDue = !isPast(task.dueDate)
    ? differenceInDays(task.dueDate, new Date())
    : 0;

  // Boost score for overdue tasks
  const overdueBonus = daysOverdue * 10;

  // Boost score for tasks due soon
  const dueSoonBonus = daysToDue <= 1 ? 20 : daysToDue <= 3 ? 10 : 0;

  // Boost score for tasks created longer ago (prevents procrastination)
  const daysSinceCreated = differenceInDays(new Date(), task.createdAt);
  const ageBonus = Math.min(daysSinceCreated * 2, 20);

  // Calculate final score
  const finalScore = baseScore + overdueBonus + dueSoonBonus + ageBonus;

  return {
    taskId: task.id,
    score: finalScore,
    quadrant,
    daysOverdue,
    priority: getPriorityLevel(finalScore),
  };
}

// Map score to a priority level (1=Critical, 5=Low)
function getPriorityLevel(score: number): number {
  if (score >= 120) return 1; // Critical
  if (score >= 100) return 2; // High
  if (score >= 80) return 3; // Medium-High
  if (score >= 60) return 4; // Medium
  return 5; // Low
}

// Sort tasks by score (highest first), then by due date (earliest first)
export function prioritizeTasks(tasks: Task[]): Task[] {
  const incompleteTasks = tasks.filter((task) => !task.completed);
  const taskScores = incompleteTasks.map(calculateTaskScore);

  // Sort by score (highest first), then by due date (earliest first)
  taskScores.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;

    const taskA = incompleteTasks.find((t) => t.id === a.taskId)!;
    const taskB = incompleteTasks.find((t) => t.id === b.taskId)!;

    return taskA.dueDate.getTime() - taskB.dueDate.getTime();
  });

  return taskScores.map(
    (score) => incompleteTasks.find((task) => task.id === score.taskId)!,
  );
}

// Select up to 4 top-priority tasks for "Today's Focus" (used for sticky focus set)
export function getTopDailyTasks(tasks: Task[], maxTasks: number = 4): Task[] {
  // Get all tasks due today (completed or not)
  const todayTasks = tasks.filter((task) => isToday(task.dueDate));

  // If we have fewer than maxTasks tasks due today, fill with upcoming incomplete tasks
  if (todayTasks.length < maxTasks) {
    const upcomingTasks = tasks
      .filter((task) => !isToday(task.dueDate) && !task.completed)
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
    return [...todayTasks, ...upcomingTasks].slice(0, maxTasks);
  }

  // If we have enough tasks due today, prioritize them (but include completed ones)
  // Sort by incomplete first, then by priority
  const sortedTodayTasks = [
    ...todayTasks.filter((t) => !t.completed),
    ...todayTasks.filter((t) => t.completed),
  ];
  return sortedTodayTasks.slice(0, maxTasks);
}

// Check if adding a new task would exceed the daily limit for its category
export function checkCategoryLimits(
  tasks: Task[],
  newTask: Task,
): { allowed: boolean; message?: string } {
  const todayTasks = tasks.filter(
    (task) =>
      !task.completed &&
      isToday(task.dueDate) &&
      task.category.id === newTask.category.id,
  );

  if (todayTasks.length >= newTask.category.dailyLimit) {
    return {
      allowed: false,
      message: `You've reached your daily limit of ${newTask.category.dailyLimit} tasks for ${newTask.category.name}. Focus on completing existing tasks first.`,
    };
  }

  return { allowed: true };
}

// Category daily hour limits
const CATEGORY_LIMITS: Record<string, { max: number }> = {
  Work: { max: 10 },
  Home: { max: 3 },
  Health: { max: 3 },
};

function isWeekend(date: Date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

// Check if a recurring task should appear on a specific date
function shouldRecurringTaskAppearOnDate(task: Task, date: Date): boolean {
  if (!task.isRecurring || !task.recurringInterval) {
    return true; // Non-recurring tasks follow normal scheduling
  }

  // If the task's dueDate is the same as the date we're checking, it should appear
  if (isSameNormalizedDay(task.dueDate, date)) {
    return true;
  }

  // For recurring tasks, check if the date matches the recurrence pattern
  switch (task.recurringInterval) {
    case 'daily':
      return true; // Daily tasks appear every day
    case 'weekly':
      if (task.recurringDays && task.recurringDays.length > 0) {
        const dayOfWeek = getDay(date); // 0-6, where 0 is Sunday
        return task.recurringDays.includes(dayOfWeek);
      }
      // If no specific days are set, check if it's the same day of week as the original due date
      return getDay(date) === getDay(task.dueDate);
    case 'monthly':
      // Check if it's the same day of the month
      return date.getDate() === task.dueDate.getDate();
    default:
      return false;
  }
}

export function assignStartDates(
  tasks: Task[],
  maxPerDay: number = 4,
  baseDate?: Date,
): Task[] {
  // First, normalize all dates to startOfDay for consistency
  const normalizedTasks = tasks.map((task) => ({
    ...task,
    // Always ensure startDate is a Date by using dueDate or createdAt as fallback
    startDate: normalizeDate(task.startDate || task.dueDate || task.createdAt),
    dueDate: normalizeDate(task.dueDate),
    createdAt: normalizeDate(task.createdAt),
  }));

  // Separate recurring and non-recurring tasks
  const recurringTasks = normalizedTasks.filter(
    (task) => task.isRecurring && !task.completed,
  );

  const nonRecurringTasks = normalizedTasks.filter(
    (task) => !task.isRecurring && !task.completed,
  );

  // Score and sort non-recurring tasks
  const scoredNonRecurring = nonRecurringTasks.map((task) => ({
    ...task,
    _score: calculateTaskScore(task).score,
  }));
  scoredNonRecurring.sort((a, b) => b._score - a._score);

  let dayOffset = 0;
  let assigned: Task[] = [];
  let unassigned = [...scoredNonRecurring];
  const today = normalizeDate(baseDate || new Date());
  const processedDays = new Set<string>();

  // First, assign recurring tasks to their specific days
  const recurringAssignments: Task[] = [];
  const maxDaysToLookAhead = 14; // Look ahead 14 days for scheduling

  // Track recurring tasks by name and date to avoid duplicates
  const recurringTaskTracker = new Map<string, Task>();

  for (let i = 0; i < maxDaysToLookAhead; i++) {
    const currentDate = new Date(today);
    currentDate.setDate(currentDate.getDate() + i);
    const normalizedCurrentDate = normalizeDate(currentDate);
    const dateKey = getDateKey(normalizedCurrentDate);

    if (processedDays.has(dateKey)) continue;
    processedDays.add(dateKey);

    // Find recurring tasks that should appear on this date
    const recurringTasksForDay = recurringTasks.filter((task) =>
      shouldRecurringTaskAppearOnDate(task, normalizedCurrentDate),
    );

    if (recurringTasksForDay.length > 0) {
      // Sort recurring tasks by priority
      recurringTasksForDay.sort((a, b) => {
        const scoreA = calculateTaskScore(a).score;
        const scoreB = calculateTaskScore(b).score;
        return scoreB - scoreA;
      });

      // Deduplicate recurring tasks by name for this date
      const deduplicatedTasks: Task[] = [];
      recurringTasksForDay.forEach((task) => {
        const taskDateKey = `${task.name}_${dateKey}`;
        if (!recurringTaskTracker.has(taskDateKey)) {
          recurringTaskTracker.set(taskDateKey, task);
          deduplicatedTasks.push(task);
        }
      });

      // Add recurring tasks to assignments with the current date
      recurringAssignments.push(
        ...deduplicatedTasks.map((task) => ({
          ...task,
          startDate: normalizedCurrentDate,
        })),
      );
    }
  }

  // Now process non-recurring tasks with the remaining capacity
  while (unassigned.length > 0) {
    const currentDate = new Date(today);
    currentDate.setDate(currentDate.getDate() + dayOffset);
    const normalizedCurrentDate = normalizeDate(currentDate);
    const isWknd = isWeekend(currentDate);

    // Count how many recurring tasks are already assigned to this day
    const recurringTasksCount = recurringAssignments.filter((task) =>
      isSameNormalizedDay(task.startDate, normalizedCurrentDate),
    ).length;

    // Calculate remaining capacity for this day
    const remainingCapacity = Math.max(0, maxPerDay - recurringTasksCount);

    // Skip to next day if no capacity left after recurring tasks
    if (remainingCapacity <= 0) {
      console.log(
        `Day ${dayOffset}: Skipping - ${recurringTasksCount} recurring tasks already at or exceeding max (${maxPerDay})`,
      );
      dayOffset++;
      continue;
    }

    console.log(
      `Day ${dayOffset}: ${recurringTasksCount} recurring tasks, ${remainingCapacity} slots remaining (max: ${maxPerDay})`,
    );

    const currentBucket: typeof scoredNonRecurring = [];
    const categoryHours: Record<string, number> = {};
    let totalTasks = 0;
    let scheduledAny = true;

    // True greedy fill for non-recurring tasks, respecting the remaining capacity
    while (
      scheduledAny &&
      totalTasks < remainingCapacity &&
      unassigned.length > 0
    ) {
      scheduledAny = false;
      for (let i = 0; i < unassigned.length; ) {
        if (totalTasks >= remainingCapacity) break;
        const task = unassigned[i];
        const cat = task.category?.name || 'Other';
        const cap = CATEGORY_LIMITS[cat] || { max: Infinity };
        const used = categoryHours[cat] || 0;
        // Skip Work tasks on weekends
        if (isWknd && cat === 'Work') {
          i++;
          continue;
        }
        if (used + (task.estimatedHours || 1) <= cap.max) {
          currentBucket.push(task);
          categoryHours[cat] = used + (task.estimatedHours || 1);
          totalTasks++;
          unassigned.splice(i, 1); // Remove scheduled task
          scheduledAny = true;
          // After scheduling, restart the loop for the current day
          i = 0;
        } else {
          i++;
        }
      }
    }

    console.log(
      `Day ${dayOffset} final: ${recurringTasksCount + currentBucket.length} total tasks assigned`,
    );

    // Any remaining unassigned tasks go to the next day
    const nextDayTasks = [...unassigned];
    // If nothing could be scheduled for a non-weekend day, break to avoid infinite loop
    if (
      currentBucket.length === 0 &&
      unassigned.length === nextDayTasks.length &&
      !isWknd
    ) {
      break;
    }

    // Always use normalized dates for consistent date handling
    assigned = assigned.concat(
      currentBucket.map((task) => ({
        ...task,
        startDate: normalizedCurrentDate,
      })),
    );

    unassigned = nextDayTasks;
    dayOffset++;
  }

  const completedTasks = normalizedTasks.filter((task) => task.completed);

  // Ensure all tasks have a properly normalized startDate
  const result = [
    ...assigned, // Non-recurring tasks assigned by priority
    ...recurringAssignments, // Recurring tasks assigned to their specific days
    ...completedTasks, // Completed tasks
  ];

  // Verify that no day exceeds the maxPerDay limit
  const tasksByDay = new Map<string, Task[]>();

  // Group tasks by date
  result.forEach((task) => {
    if (task.startDate && !task.completed) {
      const dateKey = getDateKey(task.startDate);
      if (!tasksByDay.has(dateKey)) {
        tasksByDay.set(dateKey, []);
      }
      tasksByDay.get(dateKey)!.push(task);
    }
  });

  // Check for any days exceeding the limit
  tasksByDay.forEach((tasksForDay, dateKey) => {
    if (tasksForDay.length > maxPerDay) {
      console.warn(
        `Warning: ${dateKey} has ${tasksForDay.length} tasks (exceeds max ${maxPerDay})`,
      );
    }
  });

  console.log(
    'Task prioritization - Assigned tasks with normalized dates:',
    result.map((t) => ({
      name: t.name,
      startDate: t.startDate,
      startDateString: getDateKey(t.startDate),
      isRecurring: t.isRecurring,
      recurringInterval: t.recurringInterval,
      recurringDays: t.recurringDays,
    })),
  );

  return result;
}
