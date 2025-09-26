// AppContext.tsx
// Provides global app state, reducer, and context for tasks, categories, preferences, and UI state.
// Handles loading/saving from Firestore with localStorage fallback and exposes state/dispatch to the app.

import {
  createContext,
  useContext,
  useReducer,
  ReactNode,
  useEffect,
  useState,
  useCallback,
  memo,
} from 'react';
import { Task, Category } from '../types/task';
import { UserPreferences } from '../types/user';
import {
  loadTasks,
  loadCategories,
  loadPreferences,
} from '../utils/localStorage';
import {
  saveTasksToFirestore,
  loadTasksFromFirestore,
  saveCategoriesToFirestore,
  loadCategoriesFromFirestore,
  savePreferencesToFirestore,
  loadPreferencesFromFirestore,
  saveOnboardingStatusToFirestore,
  loadOnboardingStatusFromFirestore,
  migrateLocalStorageToFirestore,
} from '../utils/firestoreService';
import { processRecurringTasks } from '../utils/recurringTaskService';
import { useAuth } from './AuthContext';
import { normalizeDate } from '../utils/dateUtils';
import {
  DEFAULT_CATEGORY_LIMITS,
  DEFAULT_DAILY_MAX_HOURS,
  normalizeCategoryLimits,
} from '../utils/taskPrioritization';
import logger from '../utils/logger';

// Define the shape of our global state
interface AppState {
  tasks: Task[];
  categories: Category[];
  preferences: UserPreferences;
  ui: {
    currentPage: 'today' | 'schedule';
    isLoading: boolean;
    error: string | null;
  };
  onboarding_complete: boolean;
}

// Define the actions that can modify our state
// Each action type describes a possible state change
// (e.g. add task, update preferences, toggle schedule view, etc)
type AppAction =
  | { type: 'SET_TASKS'; payload: Task[] }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: Task }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'TOGGLE_TASK_COMPLETE'; payload: string }
  | { type: 'SET_CATEGORIES'; payload: Category[] }
  | { type: 'ADD_CATEGORY'; payload: Category }
  | { type: 'UPDATE_CATEGORY'; payload: Category }
  | { type: 'DELETE_CATEGORY'; payload: string }
  | { type: 'UPDATE_PREFERENCES'; payload: Partial<UserPreferences> }
  | { type: 'SET_CURRENT_PAGE'; payload: 'today' | 'schedule' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_ONBOARDING_COMPLETE'; payload: boolean }
  | { type: 'PROCESS_RECURRING_TASKS' }
  | { type: 'NORMALIZE_ALL_DATES' };

// Initial state for the app
const initialState: AppState = {
  tasks: [],
  categories: [],
  preferences: {
    maxDailyTasks: 5,
    categories: [],
    theme: 'light',
    notifications: true,
    categoryLimits: DEFAULT_CATEGORY_LIMITS,
    dailyMaxHours: DEFAULT_DAILY_MAX_HOURS,
  },
  ui: {
    currentPage: 'today',
    isLoading: false,
    error: null,
  },
  onboarding_complete: false,
};

// Create the context
const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  testMode: boolean;
  toggleTestMode: () => void;
} | null>(null);

// Reducer function to handle state updates
// Handles all action types and returns the new state
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_TASKS':
      return { ...state, tasks: action.payload };
    case 'ADD_TASK':
      return { ...state, tasks: [...state.tasks, action.payload] };
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.payload.id ? action.payload : task,
        ),
      };
    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter((task) => task.id !== action.payload),
      };
    case 'TOGGLE_TASK_COMPLETE': {
      const updatedTasks = state.tasks.map((task) =>
        task.id === action.payload
          ? {
              ...task,
              completed: !task.completed,
              completedAt: !task.completed ? new Date() : undefined,
              // When marking a task as complete, update its startDate to today
              // This ensures it's counted in today's tasks for the progress circle
              startDate: !task.completed
                ? normalizeDate(new Date())
                : task.startDate,
            }
          : task,
      );

      // Debug logging for completed task toggle
      const toggledTask = updatedTasks.find(
        (task) => task.id === action.payload,
      );
      logger.log(
        `[AppContext] Task ${toggledTask?.name} (${action.payload}) toggled to ${toggledTask?.completed ? 'completed' : 'incomplete'}`,
      );

      return {
        ...state,
        tasks: updatedTasks,
      };
    }
    case 'SET_CATEGORIES':
      return { ...state, categories: action.payload };
    case 'ADD_CATEGORY':
      return { ...state, categories: [...state.categories, action.payload] };
    case 'UPDATE_CATEGORY':
      return {
        ...state,
        categories: state.categories.map((category) =>
          category.id === action.payload.id ? action.payload : category,
        ),
      };
    case 'DELETE_CATEGORY':
      return {
        ...state,
        categories: state.categories.filter(
          (category) => category.id !== action.payload,
        ),
      };
    case 'UPDATE_PREFERENCES': {
      const partial = { ...action.payload };
      let nextCategoryLimits =
        state.preferences.categoryLimits ||
        normalizeCategoryLimits(DEFAULT_CATEGORY_LIMITS);

      if (partial.categoryLimits) {
        nextCategoryLimits = normalizeCategoryLimits(partial.categoryLimits);
      }

      const mergedDailyMaxHours = {
        ...DEFAULT_DAILY_MAX_HOURS,
        ...(state.preferences.dailyMaxHours || {}),
        ...(partial.dailyMaxHours || {}),
      };

      return {
        ...state,
        preferences: {
          ...state.preferences,
          ...partial,
          categoryLimits: nextCategoryLimits,
          dailyMaxHours: mergedDailyMaxHours,
        },
      };
    }
    case 'SET_CURRENT_PAGE':
      return {
        ...state,
        ui: { ...state.ui, currentPage: action.payload },
      };
    case 'SET_LOADING':
      return {
        ...state,
        ui: { ...state.ui, isLoading: action.payload },
      };
    case 'SET_ERROR':
      return {
        ...state,
        ui: { ...state.ui, error: action.payload },
      };
    case 'SET_ONBOARDING_COMPLETE':
      logger.log(
        `[AppContext] Setting onboarding_complete to: ${action.payload}`,
      );
      return { ...state, onboarding_complete: action.payload };
    case 'PROCESS_RECURRING_TASKS': {
      const processedTasks = processRecurringTasks(state.tasks);
      return { ...state, tasks: processedTasks };
    }
    case 'NORMALIZE_ALL_DATES': {
      // Normalize all dates in all tasks
      const normalizedTasks = state.tasks.map((task) => ({
        ...task,
        startDate: normalizeDate(
          task.startDate || task.dueDate || task.createdAt,
        ),
        dueDate: normalizeDate(task.dueDate),
        createdAt: normalizeDate(task.createdAt),
        updatedAt: normalizeDate(task.updatedAt),
        completedAt: task.completedAt
          ? normalizeDate(task.completedAt)
          : undefined,
      }));

      logger.log('Normalized all dates in tasks');
      return { ...state, tasks: normalizedTasks };
    }
    default:
      return state;
  }
}

// Provider component: wraps the app and provides state/dispatch
function AppProviderComponent({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const { authState } = useAuth();
  const { user } = authState;
  const userId = user?.uid; // Create stable reference to user ID
  const [testMode, setTestMode] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Function to toggle test mode for onboarding testing
  const toggleTestMode = useCallback(() => {
    setTestMode((prev) => !prev);
    if (!testMode) {
      dispatch({ type: 'SET_ONBOARDING_COMPLETE', payload: false });
      logger.log('Test mode activated: Onboarding reset');
    } else {
      logger.log('Test mode deactivated');
    }
  }, [testMode, dispatch]);

  // Effect for test mode keyboard shortcut (Ctrl+Shift+O)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl+Shift+O (O for Onboarding)
      if (e.ctrlKey && e.shiftKey && e.key === 'O') {
        toggleTestMode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleTestMode]);

  // Load data from Firestore on mount, with localStorage fallback
  useEffect(() => {
    if (userId) {
      logger.log('[AppContext] Loading data for user:', userId);
      dispatch({ type: 'SET_LOADING', payload: true });
      setIsDataLoaded(false);

      const userPrefix = `user_${userId}_`;

      // Helper function to handle errors
      const handleError = (error: unknown) => {
        console.error('[AppContext] Error loading data:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to load your data' });
        dispatch({ type: 'SET_LOADING', payload: false });
      };

      // Load data from Firestore
      Promise.all([
        loadTasksFromFirestore(userId),
        loadCategoriesFromFirestore(userId),
        loadPreferencesFromFirestore(userId),
        loadOnboardingStatusFromFirestore(userId),
      ])
        .then(([tasks, categories, preferences, onboardingComplete]) => {
          logger.log(
            `[AppContext] Loaded ${tasks.length} tasks, ${categories.length} categories from Firestore`,
          );

          if (tasks.length > 0) {
            dispatch({ type: 'SET_TASKS', payload: tasks });
          }

          // Set categories or use default categories if none exist
          if (categories.length > 0) {
            dispatch({ type: 'SET_CATEGORIES', payload: categories });
          } else {
            // Add default categories if none exist
            const defaultCategories = [
              {
                id: crypto.randomUUID(),
                name: 'Work',
                color: '#4F46E5',
                dailyLimit: 5,
                icon: 'briefcase',
              },
              {
                id: crypto.randomUUID(),
                name: 'Home',
                color: '#10B981',
                dailyLimit: 3,
                icon: 'home',
              },
              {
                id: crypto.randomUUID(),
                name: 'Health',
                color: '#EF4444',
                dailyLimit: 2,
                icon: 'heart',
              },
            ];
            dispatch({ type: 'SET_CATEGORIES', payload: defaultCategories });
            logger.log(
              '[AppContext] Added default categories:',
              defaultCategories.length,
            );

            // Save default categories to Firestore
            saveCategoriesToFirestore(userId, defaultCategories).catch(
              (error) => {
                console.error(
                  '[AppContext] Error saving default categories:',
                  error,
                );
              },
            );
          }

          if (preferences) {
            const mergedPrefs = {
              ...preferences,
              categoryLimits: normalizeCategoryLimits(
                preferences.categoryLimits,
              ),
              dailyMaxHours: {
                ...DEFAULT_DAILY_MAX_HOURS,
                ...(preferences.dailyMaxHours || {}),
              },
            };
            dispatch({ type: 'UPDATE_PREFERENCES', payload: mergedPrefs });
          }

          if (onboardingComplete && !testMode) {
            dispatch({ type: 'SET_ONBOARDING_COMPLETE', payload: true });
          } else if (testMode) {
            dispatch({ type: 'SET_ONBOARDING_COMPLETE', payload: false });
          }

          // If no data in Firestore but we have local data, migrate it
          if (tasks.length === 0 && categories.length === 0) {
            const localTasks = loadTasks(userPrefix);
            const localCategories = loadCategories(userPrefix);

            if (localTasks.length > 0 || localCategories.length > 0) {
              logger.log('[AppContext] Migrating local data to Firestore');
              migrateLocalStorageToFirestore(userId)
                .then(() => {
                  logger.log('[AppContext] Migration complete');
                })
                .catch((error) => {
                  console.error('[AppContext] Migration failed:', error);
                });

              // Use local data for now
              if (localTasks.length > 0) {
                dispatch({ type: 'SET_TASKS', payload: localTasks });
              }
              if (localCategories.length > 0) {
                dispatch({ type: 'SET_CATEGORIES', payload: localCategories });
              }
            }
          }

          setIsDataLoaded(true);
          dispatch({ type: 'SET_LOADING', payload: false });
        })
        .catch((error) => {
          console.error(
            '[AppContext] Firestore load failed, using localStorage:',
            error,
          );

          try {
            // Fallback to localStorage
            const loadedTasks = loadTasks(userPrefix);
            const loadedCategories = loadCategories(userPrefix);
            const loadedPreferences = loadPreferences(userPrefix);
            const onboardingComplete =
              localStorage.getItem(`${userPrefix}onboarding_complete`) ===
              'true';

            logger.log(
              `[AppContext] Loaded ${loadedTasks.length} tasks, ${loadedCategories.length} categories from localStorage`,
            );

            if (loadedTasks.length > 0) {
              dispatch({ type: 'SET_TASKS', payload: loadedTasks });
            }
            if (loadedCategories.length > 0) {
              dispatch({ type: 'SET_CATEGORIES', payload: loadedCategories });
            }
            if (loadedPreferences) {
              const mergedPrefs = {
                ...loadedPreferences,
                categoryLimits: normalizeCategoryLimits(
                  loadedPreferences.categoryLimits,
                ),
                dailyMaxHours: {
                  ...DEFAULT_DAILY_MAX_HOURS,
                  ...(loadedPreferences.dailyMaxHours || {}),
                },
              };
              dispatch({ type: 'UPDATE_PREFERENCES', payload: mergedPrefs });
            }
            if (onboardingComplete && !testMode) {
              dispatch({ type: 'SET_ONBOARDING_COMPLETE', payload: true });
            } else if (testMode) {
              dispatch({ type: 'SET_ONBOARDING_COMPLETE', payload: false });
            }

            setIsDataLoaded(true);
            dispatch({ type: 'SET_LOADING', payload: false });
          } catch (localError) {
            handleError(localError);
          }
        });
    } else {
      // Reset state when user logs out
      dispatch({ type: 'SET_TASKS', payload: [] });
      dispatch({ type: 'SET_CATEGORIES', payload: [] });
      dispatch({ type: 'SET_ONBOARDING_COMPLETE', payload: false });
      setIsDataLoaded(true);
    }
  }, [userId, testMode, dispatch]);

  // Save tasks to Firestore when they change
  useEffect(() => {
    if (state.tasks.length > 0 && userId && isDataLoaded) {
      logger.log(`[AppContext] Saving ${state.tasks.length} tasks`);

      // Save to Firestore with localStorage fallback
      saveTasksToFirestore(userId, state.tasks).catch((error) => {
        console.error('[AppContext] Error saving tasks to Firestore:', error);
        // Fallback to localStorage already handled in the service
      });
    }
  }, [state.tasks, userId, isDataLoaded]);

  // Save categories to Firestore when they change
  useEffect(() => {
    if (state.categories.length > 0 && userId && isDataLoaded) {
      logger.log(`[AppContext] Saving ${state.categories.length} categories`);

      // Save to Firestore with localStorage fallback
      saveCategoriesToFirestore(userId, state.categories).catch((error) => {
        console.error(
          '[AppContext] Error saving categories to Firestore:',
          error,
        );
        // Fallback to localStorage already handled in the service
      });
    }
  }, [state.categories, userId, isDataLoaded]);

  // Save preferences to Firestore when they change
  useEffect(() => {
    if (state.preferences && userId && isDataLoaded) {
      logger.log('[AppContext] Saving preferences');

      // Save to Firestore with localStorage fallback
      savePreferencesToFirestore(userId, state.preferences).catch((error) => {
        console.error(
          '[AppContext] Error saving preferences to Firestore:',
          error,
        );
        // Fallback to localStorage already handled in the service
      });
    }
  }, [state.preferences, userId, isDataLoaded]);

  // Save onboarding_complete to Firestore when it changes
  useEffect(() => {
    if (userId && !testMode && isDataLoaded) {
      logger.log(
        `[AppContext] Saving onboarding status: ${state.onboarding_complete}`,
      );

      // Save to Firestore with localStorage fallback
      saveOnboardingStatusToFirestore(userId, state.onboarding_complete).catch(
        (error) => {
          console.error(
            '[AppContext] Error saving onboarding status to Firestore:',
            error,
          );
          // Save to localStorage as fallback
          const userPrefix = `user_${userId}_`;
          localStorage.setItem(
            `${userPrefix}onboarding_complete`,
            String(state.onboarding_complete),
          );
        },
      );
    }
  }, [state.onboarding_complete, userId, testMode, isDataLoaded]);

  return (
    <AppContext.Provider value={{ state, dispatch, testMode, toggleTestMode }}>
      {children}
    </AppContext.Provider>
  );
}

// Memoize the provider component to avoid unnecessary re-renders
export const AppProvider = memo(AppProviderComponent);

// Custom hook to use the context
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

// Export the context for use in tests
export { AppContext };
