// taskPrioritization.ts
// Utilities for scoring, prioritizing, and selecting daily tasks using the Eisenhower Matrix and other rules.

import { Task, TaskScore, EisenhowerQuadrant } from '../types/task';
import type { CategoryHourLimit, DailyHourLimits } from '../types/user';
import { isToday, differenceInDays, isPast } from 'date-fns';
import { normalizeDate, getDateKey, isSameNormalizedDay } from './dateUtils';
import logger from './logger';
import { SCHEDULE_LOOKAHEAD_DAYS } from './scheduleConfig';

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

  // Extra boost for tasks due today (higher than generic "due soon" bonus)
  const dueTodayBonus = isToday(task.dueDate) ? 40 : 0;

  // Boost score for tasks due soon (but not today)
  const dueSoonBonus = !isToday(task.dueDate)
    ? daysToDue <= 1
      ? 20
      : daysToDue <= 3
      ? 10
      : 0
    : 0;

  // Boost score for tasks created longer ago (prevents procrastination)
  const daysSinceCreated = differenceInDays(new Date(), task.createdAt);
  const ageBonus = Math.min(daysSinceCreated * 2, 20);

  // Calculate final score
  const finalScore =
    baseScore + overdueBonus + dueSoonBonus + dueTodayBonus + ageBonus;

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

  const todayTasks = incompleteTasks.filter((t) => isToday(t.dueDate));
  const otherTasks = incompleteTasks.filter((t) => !isToday(t.dueDate));

  const sortByScoreThenDate = (taskList: Task[]): Task[] =>
    taskList
      .map((task) => ({ task, score: calculateTaskScore(task).score }))
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.task.dueDate.getTime() - b.task.dueDate.getTime();
      })
      .map(({ task }) => task);

  const sortedToday = sortByScoreThenDate(todayTasks);
  const sortedOther = sortByScoreThenDate(otherTasks);

  return [...sortedToday, ...sortedOther];
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
  const getRelevantDate = (task: Task) => task.startDate ?? task.dueDate;
  const isFutureDueDate = (date?: Date | null) => {
    if (!date) {
      return false;
    }

    if (isToday(date)) {
      return false;
    }

    return !isPast(date);
  };

  if (isFutureDueDate(newTask.dueDate)) {
    return { allowed: true };
  }

  const newTaskDate = getRelevantDate(newTask);

  if (!newTaskDate || !isToday(newTaskDate)) {
    return { allowed: true };
  }

  const todayTasks = tasks.filter((task) => {
    if (task.completed || task.category.id !== newTask.category.id) {
      return false;
    }

    if (isFutureDueDate(task.dueDate)) {
      return false;
    }

    const taskDate = getRelevantDate(task);
    return !!taskDate && isToday(taskDate);
  });

  if (todayTasks.length >= newTask.category.dailyLimit) {
    return {
      allowed: false,
      message: `You've reached your daily limit of ${newTask.category.dailyLimit} tasks for ${newTask.category.name}. Focus on completing existing tasks first.`,
    };
  }

  return { allowed: true };
}

// Default category daily hour limits
export const DEFAULT_CATEGORY_LIMITS: Record<string, CategoryHourLimit> = {
  Work: { weekdayMax: 10, weekendMax: 2 },
  Home: { weekdayMax: 3, weekendMax: 4 },
  Health: { weekdayMax: 3, weekendMax: 2 },
  Personal: { weekdayMax: 3, weekendMax: 3 },
};

export const DEFAULT_DAILY_MAX_HOURS: DailyHourLimits = {
  weekday: 10,
  weekend: 6,
};

const parseLimitValue = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') {
      return undefined;
    }

    const parsed = Number(trimmed);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
};

export function normalizeCategoryLimits(
  limits: Record<string, Partial<CategoryHourLimit> | { max: number }> = {},
): Record<string, CategoryHourLimit> {
  const normalized: Record<string, CategoryHourLimit> = {};
  const categories = new Set([
    ...Object.keys(DEFAULT_CATEGORY_LIMITS),
    ...Object.keys(limits),
  ]);

  categories.forEach((name) => {
    const provided = limits[name];
    const defaultLimit = DEFAULT_CATEGORY_LIMITS[name];

    if (!provided && !defaultLimit) {
      return;
    }

    const candidate: Partial<CategoryHourLimit> = {};

    if (provided && typeof provided === 'object') {
      if ('weekdayMax' in provided || 'weekendMax' in provided) {
        const weekdayCandidate = parseLimitValue(provided.weekdayMax);
        const weekendCandidate = parseLimitValue(provided.weekendMax);

        if (weekdayCandidate !== undefined) {
          candidate.weekdayMax = weekdayCandidate;
        }
        if (weekendCandidate !== undefined) {
          candidate.weekendMax = weekendCandidate;
        }
      } else if ('max' in provided) {
        const maxCandidate = parseLimitValue(provided.max);
        if (maxCandidate !== undefined) {
          candidate.weekdayMax = maxCandidate;
          candidate.weekendMax = maxCandidate;
        }
      }
    }

    const weekdayMax =
      typeof candidate.weekdayMax === 'number'
        ? candidate.weekdayMax
        : defaultLimit?.weekdayMax ?? Number.POSITIVE_INFINITY;
    const weekendMax =
      typeof candidate.weekendMax === 'number'
        ? candidate.weekendMax
        : defaultLimit?.weekendMax ?? weekdayMax;

    normalized[name] = {
      weekdayMax,
      weekendMax,
    };
  });

  return normalized;
}

function isWeekend(date: Date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

// Check if a recurring task should appear on a specific date
function shouldRecurringTaskAppearOnDate(
  task: Task,
  date: Date,
  allTasks: Task[] = [],
): boolean {
  if (!task.isRecurring || !task.recurringInterval) {
    return true; // Non-recurring tasks follow normal scheduling
  }

  // Recurring tasks should only appear on the specific day they are scheduled for.
  // If the task's dueDate matches the date being evaluated, show it (unless there's
  // already a completed task with the same name on that day).
  if (isSameNormalizedDay(task.dueDate, date)) {
    const dateKey = getDateKey(date);
    const hasCompletedTaskOnSameDay = allTasks.some(
      (otherTask) =>
        otherTask.name === task.name &&
        otherTask.completed &&
        (getDateKey(otherTask.dueDate) === dateKey ||
          getDateKey(otherTask.startDate) === dateKey),
    );

    return !hasCompletedTaskOnSameDay;
  }

  // If the task's due date is before or after the date being checked,
  // it should not roll over or appear on other days.
  return false;
}

export function assignStartDates(
  tasks: Task[],
  maxPerDay: number = 4,
  categoryLimits: Record<string, CategoryHourLimit> = DEFAULT_CATEGORY_LIMITS,
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

  // Get completed tasks by day to count them against the daily limit
  const completedTasksByDay = new Map<string, number>();
  const completedCategoryHoursByDay = new Map<string, Record<string, number>>();
  normalizedTasks
    .filter((task) => task.completed)
    .forEach((task) => {
      const dateKey = getDateKey(task.startDate);
      completedTasksByDay.set(
        dateKey,
        (completedTasksByDay.get(dateKey) || 0) + 1,
      );

      const cat = task.category?.name || 'Other';
      const hours = task.estimatedHours || 1;
      const categoryMap = completedCategoryHoursByDay.get(dateKey) || {};
      categoryMap[cat] = (categoryMap[cat] || 0) + hours;
      completedCategoryHoursByDay.set(dateKey, categoryMap);
    });

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
  const maxDaysToLookAhead = SCHEDULE_LOOKAHEAD_DAYS; // Align look-ahead with schedule horizon

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
      shouldRecurringTaskAppearOnDate(
        task,
        normalizedCurrentDate,
        normalizedTasks,
      ),
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
      // Update both startDate and dueDate to match the day the task appears on the schedule
      recurringAssignments.push(
        ...deduplicatedTasks.map((task) => ({
          ...task,
          startDate: normalizedCurrentDate,
          dueDate: normalizedCurrentDate, // Set dueDate to match the day it appears on schedule
        })),
      );
    }
  }

  // Now process non-recurring tasks with the remaining capacity
  while (unassigned.length > 0) {
    const currentDate = new Date(today);
    currentDate.setDate(currentDate.getDate() + dayOffset);
    const normalizedCurrentDate = normalizeDate(currentDate);
    const dateKey = getDateKey(normalizedCurrentDate);
    const isWknd = isWeekend(currentDate);

    // Count how many recurring tasks are already assigned to this day
    const recurringTasksCount = recurringAssignments.filter((task) =>
      isSameNormalizedDay(task.startDate, normalizedCurrentDate),
    ).length;

    // Count completed tasks for this day
    const completedTasksCount = completedTasksByDay.get(dateKey) || 0;

    // Calculate remaining capacity for this day, accounting for completed tasks
    const remainingCapacity = Math.max(
      0,
      maxPerDay - recurringTasksCount - completedTasksCount,
    );

    // Skip to next day if no capacity left after recurring tasks and completed tasks
    if (remainingCapacity <= 0) {
      logger.log(
        `Day ${dayOffset}: Skipping - ${recurringTasksCount} recurring tasks, ${completedTasksCount} completed tasks already at or exceeding max (${maxPerDay})`,
      );
      dayOffset++;
      continue;
    }

    logger.log(
      `Day ${dayOffset}: ${recurringTasksCount} recurring tasks, ${completedTasksCount} completed tasks, ${remainingCapacity} slots remaining (max: ${maxPerDay})`,
    );

    const currentBucket: typeof scoredNonRecurring = [];
    const categoryHours: Record<string, number> = {
      ...(completedCategoryHoursByDay.get(dateKey) || {}),
    };
    let totalTasks = 0;
    let scheduledAny = true;
    const normalizedCurrentTime = normalizedCurrentDate.getTime();

    // True greedy fill for non-recurring tasks, respecting the remaining capacity
    while (
      scheduledAny &&
      totalTasks < remainingCapacity &&
      unassigned.length > 0
    ) {
      scheduledAny = false;
      const dueNowTasks = unassigned.filter(
        (task) => task.dueDate.getTime() <= normalizedCurrentTime,
      );
      const futureTasks = unassigned.filter(
        (task) => task.dueDate.getTime() > normalizedCurrentTime,
      );
      const selectionOrder = [...dueNowTasks, ...futureTasks];

      for (const task of selectionOrder) {
        if (totalTasks >= remainingCapacity) {
          break;
        }

        const unassignedIndex = unassigned.findIndex((t) => t.id === task.id);
        if (unassignedIndex === -1) {
          continue;
        }

        const cat = task.category?.name || 'Other';
        const limitSource = categoryLimits[cat] || DEFAULT_CATEGORY_LIMITS[cat];
        const weekdayCap =
          limitSource?.weekdayMax ?? Number.POSITIVE_INFINITY;
        const weekendCap =
          limitSource?.weekendMax ?? weekdayCap ?? Number.POSITIVE_INFINITY;
        const applicableCap = isWknd ? weekendCap : weekdayCap;
        const used = categoryHours[cat] || 0;
        const estimatedHours = task.estimatedHours || 1;
        const isDueNow = task.dueDate.getTime() <= normalizedCurrentTime;

        // Skip Work tasks on weekends only if they aren't due now
        if (isWknd && cat === 'Work' && !isDueNow) {
          continue;
        }

        const withinCategoryLimit = used + estimatedHours <= applicableCap;
        if (!withinCategoryLimit && !isDueNow) {
          continue;
        }

        currentBucket.push(task);
        categoryHours[cat] = used + estimatedHours;
        totalTasks++;
        unassigned.splice(unassignedIndex, 1);
        scheduledAny = true;
        // Recalculate ordering after each assignment so due/overdue tasks always run first
        break;
      }
    }

    logger.log(
      `Day ${dayOffset} final: ${recurringTasksCount + currentBucket.length + completedTasksCount} total tasks assigned (including ${completedTasksCount} completed)`,
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
    if (task.startDate) {
      const dateKey = getDateKey(task.startDate);
      if (!tasksByDay.has(dateKey)) {
        tasksByDay.set(dateKey, []);
      }
      tasksByDay.get(dateKey)!.push(task);
    }
  });

  // Check for any days exceeding the limit
  tasksByDay.forEach((tasksForDay, dateKey) => {
    const incompleteCount = tasksForDay.filter((t) => !t.completed).length;
    const completedCount = tasksForDay.filter((t) => t.completed).length;

    if (tasksForDay.length > maxPerDay) {
      logger.warn(
        `Warning: ${dateKey} has ${tasksForDay.length} tasks (${incompleteCount} incomplete, ${completedCount} completed) exceeding max ${maxPerDay}`,
      );
    }
  });

  logger.log(
    'Task prioritization - Assigned tasks with normalized dates:',
    result.map((t) => ({
      name: t.name,
      startDate: t.startDate,
      startDateString: getDateKey(t.startDate),
      isRecurring: t.isRecurring,
      recurringInterval: t.recurringInterval,
      recurringDays: t.recurringDays,
      completed: t.completed,
    })),
  );

  return result;
}
