// AppContext.tsx
// Provides global app state, reducer, and context for tasks, categories, preferences, and UI state.
// Handles loading/saving from localStorage and exposes state/dispatch to the app.

import { createContext, useContext, useReducer, ReactNode, useEffect, useState } from 'react';
import { Task, Category, UserPreferences } from '../types/task';
import { saveTasks, loadTasks, saveCategories, loadCategories, savePreferences, loadPreferences } from '../utils/localStorage';
import { processRecurringTasks } from '../utils/recurringTaskService';
import { useAuth } from './AuthContext';

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
  | { type: 'PROCESS_RECURRING_TASKS' };

// Initial state for the app
const initialState: AppState = {
  tasks: [],
  categories: [],
  preferences: {
    maxDailyTasks: 5,
    categories: [],
    theme: 'light',
    notifications: true,
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
        tasks: state.tasks.map(task =>
          task.id === action.payload.id ? action.payload : task
        ),
      };
    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter(task => task.id !== action.payload),
      };
    case 'TOGGLE_TASK_COMPLETE':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload
            ? {
                ...task,
                completed: !task.completed,
                completedAt: !task.completed ? new Date() : undefined,
              }
            : task
        ),
      };
    case 'SET_CATEGORIES':
      return { ...state, categories: action.payload };
    case 'ADD_CATEGORY':
      return { ...state, categories: [...state.categories, action.payload] };
    case 'UPDATE_CATEGORY':
      return {
        ...state,
        categories: state.categories.map(category =>
          category.id === action.payload.id ? action.payload : category
        ),
      };
    case 'DELETE_CATEGORY':
      return {
        ...state,
        categories: state.categories.filter(category => category.id !== action.payload),
      };
    case 'UPDATE_PREFERENCES':
      return {
        ...state,
        preferences: { ...state.preferences, ...action.payload },
      };
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
      return { ...state, onboarding_complete: action.payload };
    case 'PROCESS_RECURRING_TASKS': {
      const processedTasks = processRecurringTasks(state.tasks);
      return { ...state, tasks: processedTasks };
    }
    default:
      return state;
  }
}

// Provider component: wraps the app and provides state/dispatch
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const { authState } = useAuth();
  const { user } = authState;
  const [testMode, setTestMode] = useState(false);

  // Function to toggle test mode for onboarding testing
  const toggleTestMode = () => {
    setTestMode(prev => !prev);
    if (!testMode) {
      dispatch({ type: 'SET_ONBOARDING_COMPLETE', payload: false });
      console.log('Test mode activated: Onboarding reset');
    } else {
      console.log('Test mode deactivated');
    }
  };

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
  }, [testMode]);

  // Load data from localStorage on mount, using user ID if available
  useEffect(() => {
    if (user) {
      const userPrefix = `user_${user.uid}_`;
      const loadedTasks = loadTasks(userPrefix);
      const loadedCategories = loadCategories(userPrefix);
      const loadedPreferences = loadPreferences(userPrefix);
      const onboardingComplete = localStorage.getItem(`${userPrefix}onboarding_complete`) === 'true';

      if (loadedTasks.length > 0) {
        dispatch({ type: 'SET_TASKS', payload: loadedTasks });
        // If onboarding_complete is not set but tasks exist, set it
        if (!onboardingComplete && !testMode) {
          dispatch({ type: 'SET_ONBOARDING_COMPLETE', payload: true });
          localStorage.setItem(`${userPrefix}onboarding_complete`, 'true');
        }
      }
      if (loadedCategories.length > 0) {
        dispatch({ type: 'SET_CATEGORIES', payload: loadedCategories });
      }
      if (loadedPreferences) {
        dispatch({ type: 'UPDATE_PREFERENCES', payload: loadedPreferences });
      }
      if (onboardingComplete && !testMode) {
        dispatch({ type: 'SET_ONBOARDING_COMPLETE', payload: true });
      } else if (testMode) {
        dispatch({ type: 'SET_ONBOARDING_COMPLETE', payload: false });
      }
    } else {
      // Reset state when user logs out
      dispatch({ type: 'SET_TASKS', payload: [] });
      dispatch({ type: 'SET_CATEGORIES', payload: [] });
      dispatch({ type: 'SET_ONBOARDING_COMPLETE', payload: false });
    }
  }, [user?.uid, testMode]);

  // Save tasks to localStorage when they change
  useEffect(() => {
    if (state.tasks.length > 0 && user) {
      const userPrefix = `user_${user.uid}_`;
      saveTasks(state.tasks, userPrefix);
    }
  }, [state.tasks, user?.uid]);

  // Save categories to localStorage when they change
  useEffect(() => {
    if (state.categories.length > 0 && user) {
      const userPrefix = `user_${user.uid}_`;
      saveCategories(state.categories, userPrefix);
    }
  }, [state.categories, user?.uid]);

  // Save preferences to localStorage when they change
  useEffect(() => {
    if (state.preferences && user) {
      const userPrefix = `user_${user.uid}_`;
      savePreferences(state.preferences, userPrefix);
    }
  }, [state.preferences, user?.uid]);

  // Save onboarding_complete to localStorage when it changes
  useEffect(() => {
    if (state.onboarding_complete && user && !testMode) {
      const userPrefix = `user_${user.uid}_`;
      localStorage.setItem(`${userPrefix}onboarding_complete`, 'true');
    }
  }, [state.onboarding_complete, user?.uid, testMode]);

  return (
    <AppContext.Provider value={{ state, dispatch, testMode, toggleTestMode }}>
      {children}
    </AppContext.Provider>
  );
}

// Custom hook to use the context
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
} 