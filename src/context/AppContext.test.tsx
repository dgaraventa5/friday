/** @jest-environment jsdom */
import { render, screen, waitFor, act } from '@testing-library/react';
import React from 'react';
import { AppProvider, useApp } from './AppContext';
import { saveTasks, loadTasks } from '../utils/localStorage';
import {
  saveTasksToFirestore as mockSaveTasksToFirestore,
  FirestoreSyncError as MockedFirestoreSyncError,
} from '../utils/firestoreService';
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
  FirestoreSyncError: class FirestoreSyncError extends Error {
    queued: boolean;
    constructor(message: string, options: { queued?: boolean } = {}) {
      super(message);
      this.name = 'FirestoreSyncError';
      this.queued = options.queued ?? false;
    }
  },
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
    mockLoadTasksFromFirestore.mockReset();
    mockLoadCategoriesFromFirestore.mockReset();
    mockLoadPreferencesFromFirestore.mockReset();
    mockLoadOnboardingStatusFromFirestore.mockReset();
    mockLoadStreakFromFirestore.mockReset();
    mockMigrateLocalStorageToFirestore.mockReset();
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

  it('preserves unsynced tasks and surfaces queued status after Firestore save failure', async () => {
    const userPrefix = 'user_user-1_';
    const newTask: Task = {
      id: 'task-queued',
      name: 'Queued Task',
      category: {
        id: 'cat',
        name: 'Cat',
        color: '#fff',
        dailyLimit: 1,
        icon: 'briefcase',
      },
      importance: 'important',
      urgency: 'urgent',
      dueDate: new Date('2024-01-01T00:00:00.000Z'),
      estimatedHours: 1,
      completed: false,
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      startDate: new Date('2024-01-01T00:00:00.000Z'),
    };

    mockLoadTasksFromFirestore.mockResolvedValue([]);
    mockLoadTasksFromFirestore.mockImplementationOnce(async () => []);
    mockLoadCategoriesFromFirestore.mockResolvedValue([]);
    mockLoadPreferencesFromFirestore.mockResolvedValue(null);
    mockLoadOnboardingStatusFromFirestore.mockResolvedValue(false);
    mockLoadStreakFromFirestore.mockResolvedValue(DEFAULT_STREAK_STATE);
    mockMigrateLocalStorageToFirestore.mockResolvedValue(undefined);

    const contextRef: { current: ReturnType<typeof useApp> | null } = {
      current: null,
    };

    function CaptureContext() {
      contextRef.current = useApp();
      return null;
    }

    const { unmount } = render(
      <AppProvider>
        <CaptureContext />
      </AppProvider>,
    );

    await waitFor(() => expect(contextRef.current).not.toBeNull());
    await waitFor(() =>
      expect(contextRef.current?.state.ui.isLoading).toBe(false),
    );

    mockSaveTasksToFirestore.mockImplementationOnce(() => {
      saveTasks([newTask], userPrefix);
      localStorage.setItem(`${userPrefix}tasks_unsynced`, 'true');
      return Promise.reject(
        new MockedFirestoreSyncError('offline', { queued: true }),
      );
    });

    const syncPromise = contextRef.current!.waitForNextTaskSync();

    await act(async () => {
      contextRef.current!.dispatch({ type: 'ADD_TASK', payload: newTask });
    });

    await waitFor(() =>
      expect(mockSaveTasksToFirestore).toHaveBeenCalledTimes(1),
    );

    const syncResult = await syncPromise;
    expect(syncResult.status).toBe('queued');
    expect(localStorage.getItem(`${userPrefix}tasks_unsynced`)).toBe('true');
    const [calledUserId, calledTasks] = (mockSaveTasksToFirestore as jest.Mock).mock
      .calls[0];
    expect(calledUserId).toBe('user-1');
    expect(calledTasks).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: 'task-queued' })]),
    );
    expect(loadTasks(userPrefix)).toHaveLength(1);

    unmount();

    mockLoadTasksFromFirestore.mockImplementationOnce(async () =>
      loadTasks(userPrefix),
    );
    mockLoadCategoriesFromFirestore.mockResolvedValue([]);
    mockLoadPreferencesFromFirestore.mockResolvedValue(null);
    mockLoadOnboardingStatusFromFirestore.mockResolvedValue(false);
    mockLoadStreakFromFirestore.mockResolvedValue(DEFAULT_STREAK_STATE);

    contextRef.current = null;

    render(
      <AppProvider>
        <CaptureContext />
      </AppProvider>,
    );

    await waitFor(() => expect(contextRef.current).not.toBeNull());
    await waitFor(() =>
      expect(contextRef.current?.state.ui.isLoading).toBe(false),
    );

    await waitFor(() =>
      expect(contextRef.current?.state.tasks).toEqual(
        expect.arrayContaining([expect.objectContaining({ id: 'task-queued' })]),
      ),
    );
  });
});

