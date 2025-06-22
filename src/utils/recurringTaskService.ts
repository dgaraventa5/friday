// recurringTaskService.ts
// Utilities for handling recurring task generation and management

import { Task } from '../types/task';
import { getNextRecurringDate } from './dateUtils';
import { startOfDay, addDays, isBefore, isAfter } from 'date-fns';

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
  if (task.recurringEndType === 'after' && task.recurringEndCount && task.recurringCurrentCount) {
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
  
  const nextDueDate = getNextRecurringDate(
    task.dueDate,
    task.recurringInterval,
    task.recurringDays
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
    dueDate: nextDueDate,
    createdAt: new Date(),
    updatedAt: new Date(),
    completedAt: undefined,
    recurringCurrentCount,
    startDate: nextDueDate // Set startDate to the nextDueDate
  };
}

// Process all recurring tasks to ensure future instances exist
export function processRecurringTasks(tasks: Task[]): Task[] {
  const today = startOfDay(new Date());
  // Look ahead 14 days for recurring tasks
  const lookAheadDate = addDays(today, 14);
  
  const recurringTasks = tasks.filter(task => 
    task.isRecurring && 
    task.recurringInterval && 
    !task.completed &&
    !hasReachedEndOfRecurrence(task)
  );
  
  const newTasks: Task[] = [];
  const existingTaskDates = new Map<string, Set<string>>();
  
  // Create a map of existing task dates by name to avoid duplicates
  tasks.forEach(task => {
    if (!existingTaskDates.has(task.name)) {
      existingTaskDates.set(task.name, new Set());
    }
    existingTaskDates.get(task.name)!.add(startOfDay(new Date(task.dueDate)).toISOString());
  });
  
  // For each recurring task, generate future instances
  recurringTasks.forEach(task => {
    let currentTask = task;
    let nextDate = getNextRecurringDate(
      currentTask.dueDate,
      currentTask.recurringInterval!,
      currentTask.recurringDays
    );
    
    // Generate instances until we reach the look-ahead date or the task's recurrence end
    while (isBefore(nextDate, lookAheadDate)) {
      // Check if this task instance already exists
      const taskName = currentTask.name;
      const dateString = startOfDay(nextDate).toISOString();
      
      // Calculate the next recurrence count
      const nextRecurringCount = 
        currentTask.recurringEndType === 'after' && currentTask.recurringCurrentCount 
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
      
      if (!existingTaskDates.has(taskName) || !existingTaskDates.get(taskName)!.has(dateString)) {
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
          recurringCurrentCount: nextRecurringCount
        };
        
        newTasks.push(newTask);
        
        // Add to our tracking set
        if (!existingTaskDates.has(taskName)) {
          existingTaskDates.set(taskName, new Set());
        }
        existingTaskDates.get(taskName)!.add(dateString);
      }
      
      // Move to the next occurrence
      currentTask = {
        ...currentTask,
        dueDate: nextDate,
        recurringCurrentCount: nextRecurringCount
      };
      
      nextDate = getNextRecurringDate(
        currentTask.dueDate,
        currentTask.recurringInterval!,
        currentTask.recurringDays
      );
    }
  });
  
  console.log(`Generated ${newTasks.length} future recurring task instances`);
  return [...tasks, ...newTasks];
}

// Handle recurring task completion
export function handleRecurringTaskCompletion(completedTask: Task): Task | null {
  if (!completedTask.isRecurring || !completedTask.recurringInterval) {
    return null;
  }
  
  // Check if the task has reached its end of recurrence
  if (hasReachedEndOfRecurrence(completedTask)) {
    return null;
  }
  
  return generateNextRecurringTask(completedTask);
} 