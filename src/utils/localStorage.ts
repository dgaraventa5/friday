import { Task, Category, UserPreferences } from '../types/task';
import { normalizeDate, getDateKey } from './dateUtils';
import { DEFAULT_CATEGORY_LIMITS } from './taskPrioritization';

const STORAGE_KEYS = {
  TASKS: 'friday_tasks',
  CATEGORIES: 'friday_categories',
  PREFERENCES: 'friday_preferences',
};

export function saveTasks(tasks: Task[], prefix: string = ''): void {
  localStorage.setItem(`${prefix}${STORAGE_KEYS.TASKS}`, JSON.stringify(tasks));
}

export function loadTasks(prefix: string = ''): Task[] {
  const stored = localStorage.getItem(`${prefix}${STORAGE_KEYS.TASKS}`);
  if (!stored) return [];

  try {
    let tasks = JSON.parse(stored);
    // One-time migration: forcibly normalize all startDate values in localStorage
    let migrated = false;
    tasks = tasks.map((task: Task) => {
      const normalizedStartDate = task.startDate
        ? normalizeDate(task.startDate)
        : task.dueDate
          ? normalizeDate(task.dueDate)
          : normalizeDate(task.createdAt);
      if (
        !task.startDate ||
        new Date(task.startDate).getTime() !== normalizedStartDate.getTime()
      ) {
        migrated = true;
        return { ...task, startDate: normalizedStartDate };
      }
      return { ...task, startDate: normalizedStartDate };
    });
    if (migrated) {
      localStorage.setItem(
        `${prefix}${STORAGE_KEYS.TASKS}`,
        JSON.stringify(tasks),
      );
    }
    // Debug log: print all loaded tasks' startDate values
    console.log(
      'Loaded tasks with normalized startDate:',
      tasks.map((t: Task) => ({
        name: t.name,
        startDate: t.startDate,
        startDateString: getDateKey(t.startDate),
      })),
    );
    return tasks.map((task: Task) => ({
      ...task,
      dueDate: new Date(task.dueDate),
      createdAt: new Date(task.createdAt),
      updatedAt: new Date(task.updatedAt),
      completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
      nextDueDate: task.nextDueDate ? new Date(task.nextDueDate) : undefined,
      startDate: normalizeDate(task.startDate),
    }));
  } catch {
    return [];
  }
}

export function saveCategories(
  categories: Category[],
  prefix: string = '',
): void {
  localStorage.setItem(
    `${prefix}${STORAGE_KEYS.CATEGORIES}`,
    JSON.stringify(categories),
  );
}

export function loadCategories(prefix: string = ''): Category[] {
  const stored = localStorage.getItem(`${prefix}${STORAGE_KEYS.CATEGORIES}`);
  if (!stored) return [];

  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function savePreferences(
  preferences: UserPreferences,
  prefix: string = '',
): void {
  localStorage.setItem(
    `${prefix}${STORAGE_KEYS.PREFERENCES}`,
    JSON.stringify(preferences),
  );
}

export function loadPreferences(prefix: string = ''): UserPreferences | null {
  const stored = localStorage.getItem(`${prefix}${STORAGE_KEYS.PREFERENCES}`);
  if (!stored) return null;

  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function getDefaultCategories(): Category[] {
  return [
    {
      id: 'work',
      name: 'Work',
      color: '#3b82f6',
      dailyLimit: 2,
      icon: 'briefcase',
    },
    {
      id: 'home',
      name: 'Home',
      color: '#10b981',
      dailyLimit: 2,
      icon: 'home',
    },
    {
      id: 'health',
      name: 'Health',
      color: '#f59e0b',
      dailyLimit: 1,
      icon: 'heart',
    },
    {
      id: 'personal',
      name: 'Personal',
      color: '#8b5cf6',
      dailyLimit: 1,
      icon: 'user',
    },
  ];
}

export function getDefaultPreferences(): UserPreferences {
  return {
    maxDailyTasks: 4,
    categories: getDefaultCategories(),
    theme: 'light',
    notifications: true,
    categoryLimits: DEFAULT_CATEGORY_LIMITS,
  };
}
