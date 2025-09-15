/** @jest-environment jsdom */
import { renderHook, act, waitFor } from '@testing-library/react';
import { useTasks } from './useTasks';
import { Task, Category } from '../types/task';
import { getNextRecurringDate, normalizeDate } from '../utils/dateUtils';

// Mock localStorage utilities
jest.mock('../utils/localStorage', () => ({
  saveTasks: jest.fn(),
  loadTasks: jest.fn(),
  saveCategories: jest.fn(),
  loadCategories: jest.fn(),
  savePreferences: jest.fn(),
  loadPreferences: jest.fn(),
}));

// Mock task prioritization utilities
jest.mock('../utils/taskPrioritization', () => ({
  getTopDailyTasks: jest.fn(() => []),
  checkCategoryLimits: jest.fn(() => ({ allowed: true })),
}));

const category: Category = {
  id: 'c1',
  name: 'Test',
  color: '#fff',
  dailyLimit: 5,
  icon: 'test',
};

const baseDate = new Date('2024-01-01');
const initialTask: Task = {
  id: 't1',
  name: 'Recurring Task',
  category,
  importance: 'important',
  urgency: 'urgent',
  dueDate: baseDate,
  estimatedHours: 1,
  completed: false,
  createdAt: baseDate,
  updatedAt: baseDate,
  isRecurring: true,
  recurringInterval: 'daily',
  startDate: normalizeDate(baseDate),
};

beforeEach(() => {
  const {
    loadTasks,
    loadCategories,
    loadPreferences,
  } = require('../utils/localStorage');
  loadTasks.mockReturnValue([initialTask]);
  loadCategories.mockReturnValue([]);
  loadPreferences.mockReturnValue(null);
});

test('completing a recurring task adds exactly one new instance', async () => {
  const { result } = renderHook(() => useTasks());

  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.tasks).toHaveLength(1);

  act(() => {
    result.current.toggleTaskComplete(initialTask.id);
  });

  await waitFor(() => expect(result.current.tasks).toHaveLength(2));

  const newTasks = result.current.tasks.filter((t) => t.id !== initialTask.id);
  expect(newTasks).toHaveLength(1);

  const expectedDue = getNextRecurringDate(
    baseDate,
    'daily',
    undefined,
  );
  expect(newTasks[0].dueDate.toISOString()).toBe(expectedDue.toISOString());
});

