import { useState, useEffect } from 'react';
import { Task, Category, UserPreferences } from '../types/task';
import {
  saveTasks,
  loadTasks,
  saveCategories,
  loadCategories,
  savePreferences,
  loadPreferences,
} from '../utils/localStorage';
import {
  getTopDailyTasks,
  checkCategoryLimits,
} from '../utils/taskPrioritization';
import { getNextRecurringDate, normalizeDate } from '../utils/dateUtils';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  // Load data on mount
  useEffect(() => {
    const loadedTasks = loadTasks();
    const loadedCategories = loadCategories();
    const loadedPreferences = loadPreferences();

    setTasks(loadedTasks);
    setCategories(loadedCategories);
    setPreferences(loadedPreferences);
    setLoading(false);
  }, []);

  // Save data when it changes
  useEffect(() => {
    if (!loading) {
      saveTasks(tasks);
    }
  }, [tasks, loading]);

  useEffect(() => {
    if (!loading) {
      saveCategories(categories);
    }
  }, [categories, loading]);

  useEffect(() => {
    if (!loading && preferences) {
      savePreferences(preferences);
    }
  }, [preferences, loading]);

  const addTask = (
    taskData: Omit<Task, 'id' | 'completed' | 'createdAt' | 'updatedAt'>,
  ) => {
    // Check category limits
    const limitCheck = checkCategoryLimits(tasks, { ...taskData } as Task);
    if (!limitCheck.allowed) {
      alert(limitCheck.message);
      return false;
    }

    const newTask: Task = {
      ...taskData,
      id: crypto.randomUUID(),
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setTasks((prev) => [...prev, newTask]);
    return true;
  };

  const toggleTaskComplete = (taskId: string) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id === taskId) {
          const updatedTask = {
            ...task,
            completed: !task.completed,
            completedAt: !task.completed ? new Date() : undefined,
            updatedAt: new Date(),
            // When marking a task as complete, update its startDate to today
            // This ensures it's counted in today's tasks for the progress circle
            startDate: !task.completed
              ? normalizeDate(new Date())
              : task.startDate,
          };

          // Handle recurring tasks
          if (!task.completed && task.isRecurring && task.recurringInterval) {
            // Create next occurrence
            const nextDueDate = getNextRecurringDate(
              task.dueDate,
              task.recurringInterval,
              task.recurringDays,
            );

            const recurringTask: Task = {
              ...task,
              id: crypto.randomUUID(),
              completed: false,
              dueDate: nextDueDate,
              createdAt: new Date(),
              updatedAt: new Date(),
              completedAt: undefined,
            };

            // Add the new recurring task
            setTimeout(() => {
              setTasks((current) => [...current, recurringTask]);
            }, 100);
          }

          return updatedTask;
        }
        return task;
      }),
    );
  };

  const deleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
  };

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? { ...task, ...updates, updatedAt: new Date() }
          : task,
      ),
    );
  };

  const getTodayTasks = () => {
    return getTopDailyTasks(tasks, preferences?.maxDailyTasks || 4);
  };

  const getIncompleteTasks = () => {
    return tasks.filter((task) => !task.completed);
  };

  const updateCategories = (newCategories: Category[]) => {
    setCategories(newCategories);
  };

  const updatePreferences = (newPreferences: UserPreferences) => {
    setPreferences(newPreferences);
  };

  return {
    tasks,
    categories,
    preferences,
    loading,
    addTask,
    toggleTaskComplete,
    deleteTask,
    updateTask,
    getTodayTasks,
    getIncompleteTasks,
    updateCategories,
    updatePreferences,
  };
}
