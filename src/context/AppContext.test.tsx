/** @jest-environment jsdom */
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { AppProvider, useApp } from './AppContext';
import { saveTasks } from '../utils/localStorage';
import { DEFAULT_STREAK_STATE, STREAK_STORAGE_KEY } from '../utils/streakUtils';
import type { Task, Category } from '../types/task';

jest.mock('./AuthContext', () => ({
  useAuth: () => ({
    authState: {
      user: {
        uid: 'user-1',
        displayName: 'Test User',
        email: 'test@example.com',
      },
      loading: false,
      error: null,
    },
  }),
}));

const mockLoadTasksFromFirestore = jest.fn();
const mockLoadCategoriesFromFirestore = jest.fn();
const mockLoadPreferencesFromFirestore = jest.fn();
const mockLoadOnboardingStatusFromFirestore = jest.fn();
const mockLoadStreakFromFirestore = jest.fn();
const mockMigrateLocalStorageToFirestore = jest.fn();

jest.mock('../utils/firestoreService', () => ({
  __esModule: true,
  saveTasksToFirestore: jest.fn(() => Promise.resolve()),
  loadTasksFromFirestore: (...args: unknown[]) =>
    mockLoadTasksFromFirestore(...args),
  saveCategoriesToFirestore: jest.fn(() => Promise.resolve()),
  loadCategoriesFromFirestore: (...args: unknown[]) =>
    mockLoadCategoriesFromFirestore(...args),
  savePreferencesToFirestore: jest.fn(() => Promise.resolve()),
  loadPreferencesFromFirestore: (...args: unknown[]) =>
    mockLoadPreferencesFromFirestore(...args),
  saveOnboardingStatusToFirestore: jest.fn(() => Promise.resolve()),
  loadOnboardingStatusFromFirestore: (...args: unknown[]) =>
    mockLoadOnboardingStatusFromFirestore(...args),
  migrateLocalStorageToFirestore: (...args: unknown[]) =>
    mockMigrateLocalStorageToFirestore(...args),
  loadStreakFromFirestore: (...args: unknown[]) =>
    mockLoadStreakFromFirestore(...args),
  saveStreakToFirestore: jest.fn(() => Promise.resolve()),
}));

function TestConsumer() {
  const {
    state: { tasks, categories },
  } = useApp();

  return (
    <>
      <div data-testid="task-names">{tasks.map((task) => task.name).join(',')}</div>
      <div data-testid="category-count">{categories.length}</div>
    </>
  );
}

describe('AppProvider task migration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('loads local tasks when Firestore tasks are empty but categories exist', async () => {
    const userPrefix = 'user_user-1_';
    const localCategory: Category = {
      id: 'cat-local',
      name: 'Local',
      color: '#000000',
      dailyLimit: 3,
      icon: 'star',
    };
    const localTask: Task = {
      id: 'task-1',
      name: 'Local Task',
      category: localCategory,
      importance: 'important',
      urgency: 'urgent',
      dueDate: new Date('2024-01-01T00:00:00.000Z'),
      estimatedHours: 1,
      completed: false,
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      startDate: new Date('2024-01-01T00:00:00.000Z'),
    };

    saveTasks([localTask], userPrefix);
    localStorage.setItem(
      `${userPrefix}${STREAK_STORAGE_KEY}`,
      JSON.stringify(DEFAULT_STREAK_STATE),
    );

    const firestoreCategory: Category = {
      id: 'cat-firestore',
      name: 'Remote',
      color: '#FFFFFF',
      dailyLimit: 5,
      icon: 'cloud',
    };

    mockLoadTasksFromFirestore.mockResolvedValue([]);
    mockLoadCategoriesFromFirestore.mockResolvedValue([firestoreCategory]);
    mockLoadPreferencesFromFirestore.mockResolvedValue(null);
    mockLoadOnboardingStatusFromFirestore.mockResolvedValue(false);
    mockLoadStreakFromFirestore.mockResolvedValue(DEFAULT_STREAK_STATE);
    mockMigrateLocalStorageToFirestore.mockResolvedValue(undefined);

    render(
      <AppProvider>
        <TestConsumer />
      </AppProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId('task-names').textContent).toContain(
        'Local Task',
      ),
    );

    expect(mockMigrateLocalStorageToFirestore).toHaveBeenCalledTimes(1);
    const migrationCall = mockMigrateLocalStorageToFirestore.mock.calls[0];
    expect(migrationCall[2]).toEqual({ includeCategories: false });
    expect(mockLoadTasksFromFirestore).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('category-count').textContent).toBe('1');
  });
});

