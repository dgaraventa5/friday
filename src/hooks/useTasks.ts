import { useState, useEffect } from 'react';
import { Task, Category } from '../types/task';
import { UserPreferences } from '../types/user';
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

  const addTask = async (
    taskData: Omit<Task, 'id' | 'completed' | 'createdAt' | 'updatedAt'>,
  ): Promise<AddTaskResult> => {
    // Check category limits
    const limitCheck = checkCategoryLimits(tasks, { ...taskData } as Task);
    if (!limitCheck.allowed) {
      return { success: false, message: limitCheck.message };
    }

    const newTask: Task = {
      ...taskData,
      id: crypto.randomUUID(),
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setTasks((prev) => [...prev, newTask]);
    return { success: true };
  };

  const toggleTaskComplete = (taskId: string) => {
    setTasks((prev) =>
      prev.flatMap((task) => {
        if (task.id !== taskId) return [task];

        const completed = !task.completed;
        const updatedTask: Task = {
          ...task,
          completed,
          completedAt: completed ? new Date() : undefined,
          updatedAt: new Date(),
          // When marking a task as complete, update its startDate to today
          // This ensures it's counted in today's tasks for the progress circle
          startDate: completed ? normalizeDate(new Date()) : task.startDate,
        };

        if (completed && task.isRecurring && task.recurringInterval) {
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

          return [updatedTask, recurringTask];
        }

        return [updatedTask];
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
