// recurringTaskService.ts
// Utilities for handling recurring task generation and management

import { Task } from '../types/task';
import { getNextRecurringDate, normalizeDate, getDateKey } from './dateUtils';
import { addDays, isAfter } from 'date-fns';
import logger from './logger';
import { SCHEDULE_LOOKAHEAD_DAYS } from './scheduleConfig';

export interface RecurringTaskProcessingOptions {
  lookAheadDays?: number;
  referenceDate?: Date;
}

// Check if a recurring task has reached its end
export function hasReachedEndOfRecurrence(task: Task): boolean {
  if (!task.isRecurring || !task.recurringInterval) {
    return false;
  }

  // If the task is set to never end, it hasn't reached its end
  if (!task.recurringEndType || task.recurringEndType === 'never') {
    return false;
  }

  // If the task is set to end after a certain number of occurrences
  if (
    task.recurringEndType === 'after' &&
    task.recurringEndCount &&
    task.recurringCurrentCount
  ) {
    return task.recurringCurrentCount >= task.recurringEndCount;
  }

  return false;
}

// Generate the next instance of a recurring task
export function generateNextRecurringTask(task: Task): Task | null {
  if (!task.isRecurring || !task.recurringInterval) {
    throw new Error('Cannot generate next instance for non-recurring task');
  }

  // Check if the task has reached its end of recurrence
  if (hasReachedEndOfRecurrence(task)) {
    return null;
  }

  const seriesId = task.recurringSeriesId ?? task.id;

  const nextDueDate = getNextRecurringDate(
    task.dueDate,
    task.recurringInterval,
    task.recurringDays,
  );

  // Ensure the next due date is not today (not the same day as the completed task)
  const today = normalizeDate(new Date());
  const todayKey = getDateKey(today);
  const nextDueDateKey = getDateKey(nextDueDate);

  // If the next due date falls on today, move it to the next occurrence
  if (nextDueDateKey === todayKey) {
    // Get the next occurrence after this one
    const futureDueDate = getNextRecurringDate(
      nextDueDate,
      task.recurringInterval,
      task.recurringDays,
    );

    // Increment the current count for tasks with 'after' end type
    const recurringCurrentCount =
      task.recurringEndType === 'after' && task.recurringCurrentCount
        ? task.recurringCurrentCount + 1
        : task.recurringCurrentCount;

    return {
      ...task,
      id: crypto.randomUUID(),
      completed: false,
      dueDate: futureDueDate,
      createdAt: new Date(),
      updatedAt: new Date(),
      completedAt: undefined,
      recurringCurrentCount,
      startDate: futureDueDate, // Set startDate to the futureDueDate
      recurringSeriesId: seriesId,
    };
  }

  // Increment the current count for tasks with 'after' end type
  const recurringCurrentCount =
    task.recurringEndType === 'after' && task.recurringCurrentCount
      ? task.recurringCurrentCount + 1
      : task.recurringCurrentCount;

  return {
    ...task,
    id: crypto.randomUUID(),
    completed: false,
    dueDate: nextDueDate,
    createdAt: new Date(),
    updatedAt: new Date(),
    completedAt: undefined,
    recurringCurrentCount,
    startDate: nextDueDate, // Set startDate to the nextDueDate
    recurringSeriesId: seriesId,
  };
}

// Process all recurring tasks to ensure future instances exist
export function processRecurringTasks(
  tasks: Task[],
  options: RecurringTaskProcessingOptions = {},
): Task[] {
  const { lookAheadDays = SCHEDULE_LOOKAHEAD_DAYS, referenceDate = new Date() } =
    options;

  const today = normalizeDate(referenceDate);
  const lookAheadDate = addDays(today, lookAheadDays);

  // Ensure every recurring task in the list has a stable series identifier
  const normalizedTasks = tasks.map((task) => {
    if (task.isRecurring && task.recurringInterval) {
      const seriesId = task.recurringSeriesId ?? task.id;
      if (task.recurringSeriesId !== seriesId) {
        return { ...task, recurringSeriesId: seriesId };
      }
    }
    return task;
  });

  const recurringTasks = normalizedTasks.filter(
    (task) =>
      task.isRecurring &&
      task.recurringInterval &&
      !task.completed &&
      !hasReachedEndOfRecurrence(task),
  );

  const newTasks: Task[] = [];

  // Create a map to track which dates already have which recurring tasks
  // The key will be a combination of task name and date
  const existingTasksMap = new Map<string, boolean>();

  // First, populate the map with existing tasks
  normalizedTasks.forEach((task) => {
    const seriesId = task.recurringSeriesId ?? task.id;
    const taskDateKey = `${seriesId}_${task.name}_${getDateKey(task.dueDate)}`;
    existingTasksMap.set(taskDateKey, true);
  });

  // For each recurring task, generate future instances
  recurringTasks.forEach((task) => {
    let currentTask = task;
    let nextDate = getNextRecurringDate(
      currentTask.dueDate,
      currentTask.recurringInterval!,
      currentTask.recurringDays,
    );

    // Generate instances until we reach the look-ahead date or the task's recurrence end
    while (!isAfter(nextDate, lookAheadDate)) {
      // Check if this task instance already exists
      const taskName = currentTask.name;
      const dateString = getDateKey(nextDate);
      const seriesId = currentTask.recurringSeriesId ?? task.recurringSeriesId ?? task.id;
      const taskDateKey = `${seriesId}_${taskName}_${dateString}`;

      // Calculate the next recurrence count
      const nextRecurringCount =
        currentTask.recurringEndType === 'after' &&
        currentTask.recurringCurrentCount
          ? currentTask.recurringCurrentCount + 1
          : currentTask.recurringCurrentCount || 1;

      // Check if we've reached the end of recurrence
      const reachedEnd =
        currentTask.recurringEndType === 'after' &&
        currentTask.recurringEndCount &&
        nextRecurringCount > currentTask.recurringEndCount;

      if (reachedEnd) {
        break;
      }

      // Only create a new task if one doesn't already exist for this name and date
      if (!existingTasksMap.has(taskDateKey)) {
        // Create a new task instance
        const newTask: Task = {
          ...currentTask,
          id: crypto.randomUUID(),
          dueDate: nextDate,
          startDate: nextDate,
          completed: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          completedAt: undefined,
          recurringCurrentCount: nextRecurringCount,
          recurringSeriesId: seriesId,
        };

        newTasks.push(newTask);

        // Add to our tracking map
        existingTasksMap.set(taskDateKey, true);
      }

      // Move to the next occurrence
      currentTask = {
        ...currentTask,
        dueDate: nextDate,
        recurringCurrentCount: nextRecurringCount,
      };

      nextDate = getNextRecurringDate(
        currentTask.dueDate,
        currentTask.recurringInterval!,
        currentTask.recurringDays,
      );
    }
  });

  logger.log(`Generated ${newTasks.length} future recurring task instances`);
  return [...normalizedTasks, ...newTasks];
}

// Handle recurring task completion
export function handleRecurringTaskCompletion(
  completedTask: Task,
): Task | null {
  if (!completedTask.isRecurring || !completedTask.recurringInterval) {
    return null;
  }

  // Check if the task has reached its end of recurrence
  if (hasReachedEndOfRecurrence(completedTask)) {
    return null;
  }

  return generateNextRecurringTask(completedTask);
}
