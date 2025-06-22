import { Task, Category, UserPreferences } from '../types/task';
import { startOfDay } from 'date-fns';

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
      const normalizedStartDate = task.startDate ? startOfDay(new Date(task.startDate)) : (task.dueDate ? startOfDay(new Date(task.dueDate)) : startOfDay(new Date(task.createdAt)));
      if (!task.startDate || new Date(task.startDate).getTime() !== normalizedStartDate.getTime()) {
        migrated = true;
        return { ...task, startDate: normalizedStartDate };
      }
      return { ...task, startDate: normalizedStartDate };
    });
    if (migrated) {
      localStorage.setItem(`${prefix}${STORAGE_KEYS.TASKS}`, JSON.stringify(tasks));
    }
    // Debug log: print all loaded tasks' startDate values
    console.log('Loaded tasks with normalized startDate:', tasks.map((t: Task) => ({ 
      name: t.name, 
      startDate: t.startDate,
      startDateString: new Date(t.startDate).toLocaleDateString('en-CA')
    })));
    return tasks.map((task: Task) => ({
      ...task,
      dueDate: new Date(task.dueDate),
      createdAt: new Date(task.createdAt),
      updatedAt: new Date(task.updatedAt),
      completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
      nextDueDate: task.nextDueDate ? new Date(task.nextDueDate) : undefined,
      startDate: startOfDay(new Date(task.startDate)),
    }));
  } catch {
    return [];
  }
}

export function saveCategories(categories: Category[], prefix: string = ''): void {
  localStorage.setItem(`${prefix}${STORAGE_KEYS.CATEGORIES}`, JSON.stringify(categories));
}

export function loadCategories(prefix: string = ''): Category[] {
  const stored = localStorage.getItem(`${prefix}${STORAGE_KEYS.CATEGORIES}`);
  if (!stored) return getDefaultCategories();
  
  try {
    return JSON.parse(stored);
  } catch {
    return getDefaultCategories();
  }
}

export function savePreferences(preferences: UserPreferences, prefix: string = ''): void {
  localStorage.setItem(`${prefix}${STORAGE_KEYS.PREFERENCES}`, JSON.stringify(preferences));
}

export function loadPreferences(prefix: string = ''): UserPreferences {
  const stored = localStorage.getItem(`${prefix}${STORAGE_KEYS.PREFERENCES}`);
  if (!stored) return getDefaultPreferences();
  
  try {
    return JSON.parse(stored);
  } catch {
    return getDefaultPreferences();
  }
}

export function getDefaultCategories(): Category[] {
  return [
    {
      id: 'work',
      name: 'Work',
      color: '#3b82f6',
      dailyLimit: 2,
      icon: 'briefcase'
    },
    {
      id: 'home',
      name: 'Home',
      color: '#10b981',
      dailyLimit: 2,
      icon: 'home'
    },
    {
      id: 'health',
      name: 'Health',
      color: '#f59e0b',
      dailyLimit: 1,
      icon: 'heart'
    },
    {
      id: 'personal',
      name: 'Personal',
      color: '#8b5cf6',
      dailyLimit: 1,
      icon: 'user'
    }
  ];
}

export function getDefaultPreferences(): UserPreferences {
  return {
    maxDailyTasks: 4,
    categories: getDefaultCategories(),
    theme: 'light',
    notifications: true
  };
}