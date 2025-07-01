// App.tsx
// Main entry point for the Friday app UI. Handles global layout, state, and sticky Today's Focus logic.

import { AppProvider, useApp } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { TaskList } from './components/TaskList';
import { TaskInput } from './components/TaskInput';
import { WelcomeMessage } from './components/WelcomeMessage';
import { ErrorBoundary } from './components/ErrorBoundary';
import { TaskErrorBoundary } from './components/TaskErrorBoundary';
import { LoadingOverlay } from './components/LoadingOverlay';
import { LoadingState } from './components/LoadingState';
import { Task } from './types/task';
import { useState, useEffect, useRef } from 'react';
import { isToday } from 'date-fns';
import { assignStartDates } from './utils/taskPrioritization';
import { BottomNav } from './components/BottomNav';
import { SchedulePage } from './components/SchedulePage';
import { EditTaskModal } from './components/EditTaskModal';
import { RecurringTaskModal } from './components/RecurringTaskModal';
import { handleRecurringTaskCompletion } from './utils/recurringTaskService';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DevTools } from './components/DevTools';
import { Button } from './components/Button';
import { getTodayKey, getDateKey } from './utils/dateUtils';
import { X } from 'lucide-react';

// Helper to get a string key for today (YYYY-MM-DD) - DEPRECATED, use getTodayKey from dateUtils
// function getTodayKey() {
//   const today = new Date();
//   // Use local date string to avoid timezone issues
//   return today.toLocaleDateString('en-CA'); // en-CA uses YYYY-MM-DD format
// }

function AppContent() {
  // Get global state and dispatch from context
  const { state, dispatch } = useApp();
  const { tasks, categories, ui, onboarding_complete } = state;
  const [isTaskInputExpanded, setIsTaskInputExpanded] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [recurringModal, setRecurringModal] = useState<{
    completedTask: Task;
    nextTask: Task;
  } | null>(null);
  const todayKey = getTodayKey();
  // Sticky set of completed focus task IDs for today
  const [completedFocusIds, setCompletedFocusIds] = useState<string[]>(() => {
    const stored = localStorage.getItem('completed_focus_' + todayKey);
    return stored ? JSON.parse(stored) : [];
  });
  const [showSettings, setShowSettings] = useState(false);
  const { authState } = useAuth();

  // Update completedFocusIds when a task is completed
  useEffect(() => {
    const completedToday = tasks
      .filter(
        (t) =>
          t.completed &&
          !completedFocusIds.includes(t.id) &&
          (isToday(t.dueDate) || isToday(t.startDate)),
      )
      .map((t) => t.id);
    if (completedToday.length > 0) {
      const updated = [...completedFocusIds, ...completedToday];
      setCompletedFocusIds(updated);
      localStorage.setItem(
        'completed_focus_' + todayKey,
        JSON.stringify(updated),
      );
    }
  }, [tasks, completedFocusIds, todayKey]);

  // Clean up old completed focus sets when the day changes
  useEffect(() => {
    const keys = Object.keys(localStorage).filter(
      (k) =>
        k.startsWith('completed_focus_') && k !== 'completed_focus_' + todayKey,
    );
    keys.forEach((k) => localStorage.removeItem(k));
  }, [todayKey]);

  // Process recurring tasks once a day or when the app loads
  useEffect(() => {
    // Normalize all dates to ensure consistency
    dispatch({ type: 'NORMALIZE_ALL_DATES' });

    // Process recurring tasks on load
    dispatch({ type: 'PROCESS_RECURRING_TASKS' });

    // Set up a check at midnight each day
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const timeUntilMidnight = tomorrow.getTime() - now.getTime();

    const midnightTimer = setTimeout(() => {
      dispatch({ type: 'NORMALIZE_ALL_DATES' });
      dispatch({ type: 'PROCESS_RECURRING_TASKS' });
    }, timeUntilMidnight);

    return () => clearTimeout(midnightTimer);
  }, [dispatch, todayKey]); // todayKey changes when the date changes

  // Always use assigned tasks for rendering
  const assignedTasks = assignStartDates(tasks, 4);

  // Get today's date as a string in YYYY-MM-DD format for comparison
  const todayDateString = getTodayKey();

  // Filter tasks that have a startDate matching today
  // First, get all tasks for today
  const allTodayTasks = assignedTasks.filter((t) => {
    const taskDateString = getDateKey(t.startDate);
    return taskDateString === todayDateString;
  });

  // Ensure we don't show more than 4 tasks total for today
  // Priority: 1) Completed tasks for today, 2) Incomplete tasks by priority
  const completedTodayTasks = allTodayTasks.filter((t) => t.completed);
  const incompleteTodayTasks = allTodayTasks.filter((t) => !t.completed);

  // Calculate how many incomplete tasks we can show
  const maxIncompleteTasks = Math.max(0, 4 - completedTodayTasks.length);

  // Combine completed tasks with up to maxIncompleteTasks incomplete tasks
  const todayFocusTasks = [
    ...completedTodayTasks,
    ...incompleteTodayTasks.slice(0, maxIncompleteTasks),
  ];

  // Debug logging for progress circle
  console.log("Today's Focus Tasks:", todayFocusTasks);
  console.log(
    "Today's Focus Completed:",
    todayFocusTasks.filter((t) => t.completed).length,
    'of',
    todayFocusTasks.length,
  );
  console.log("Today's date string for comparison:", todayDateString);
  console.log('Onboarding complete status:', onboarding_complete);
  console.log(
    'Task startDate strings:',
    assignedTasks.map((t) => ({
      name: t.name,
      startDate: t.startDate,
      startDateString: getDateKey(t.startDate),
      isToday: getDateKey(t.startDate) === todayDateString,
    })),
  );

  // Mark a task as complete/incomplete
  const handleToggleComplete = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);

    if (task && !task.completed && task.isRecurring && task.recurringInterval) {
      // Generate next occurrence when marking a recurring task as complete
      const nextTask = handleRecurringTaskCompletion(task);
      if (nextTask) {
        // Show the modal with information about the recurring task
        setRecurringModal({ completedTask: task, nextTask });

        // Add the new recurring task
        setTimeout(() => {
          dispatch({ type: 'ADD_TASK', payload: nextTask });
        }, 100);
      }
    }

    dispatch({ type: 'TOGGLE_TASK_COMPLETE', payload: taskId });
  };

  // Add a new task and handle onboarding flag
  const handleAddTask = (task: Task) => {
    dispatch({ type: 'ADD_TASK', payload: task });
    setIsTaskInputExpanded(false);

    // Set onboarding complete when first task is added
    if (!onboarding_complete) {
      console.log('Setting onboarding complete after first task added');
      dispatch({ type: 'SET_ONBOARDING_COMPLETE', payload: true });

      // Also directly update localStorage
      const { user } = authState;
      if (user) {
        const userPrefix = `user_${user.uid}_`;
        localStorage.setItem(`${userPrefix}onboarding_complete`, 'true');
        console.log('Directly updated localStorage onboarding status to true');
      }
    }
  };

  // Handle task editing
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
  };

  // Update task after editing
  const handleUpdateTask = (updatedTask: Task) => {
    dispatch({ type: 'UPDATE_TASK', payload: updatedTask });
    setEditingTask(null);
  };

  // Delete task
  const handleDeleteTask = (taskId: string) => {
    dispatch({ type: 'DELETE_TASK', payload: taskId });
    setEditingTask(null);
  };

  // Navigation handlers
  const handleNavToday = () =>
    dispatch({ type: 'SET_CURRENT_PAGE', payload: 'today' });
  const handleNavAdd = () => {
    setIsTaskInputExpanded(true);
  };
  const handleNavSchedule = () =>
    dispatch({ type: 'SET_CURRENT_PAGE', payload: 'schedule' });

  // Modal close on outside click or Escape
  const modalRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!isTaskInputExpanded && !editingTask) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (isTaskInputExpanded) setIsTaskInputExpanded(false);
        if (editingTask) setEditingTask(null);
      }
    }

    function handleClick(e: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        if (isTaskInputExpanded) setIsTaskInputExpanded(false);
        if (editingTask) setEditingTask(null);
      }
    }

    // Scroll lock
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Swipe down to close (touch devices)
    let startY: number | null = null;
    function handleTouchStart(e: TouchEvent) {
      startY = e.touches[0].clientY;
    }

    function handleTouchMove(e: TouchEvent) {
      if (startY !== null) {
        const deltaY = e.touches[0].clientY - startY;
        if (deltaY > 60) {
          if (isTaskInputExpanded) setIsTaskInputExpanded(false);
          if (editingTask) setEditingTask(null);
          startY = null;
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isTaskInputExpanded, editingTask]);

  useEffect(() => {
    console.log('isTaskInputExpanded:', isTaskInputExpanded);
  }, [isTaskInputExpanded]);

  // Log onboarding status whenever it changes
  useEffect(() => {
    console.log('Onboarding complete status changed:', onboarding_complete);

    // Check the localStorage directly
    const { user } = authState;
    if (user) {
      const userPrefix = `user_${user.uid}_`;
      const localStorageValue = localStorage.getItem(
        `${userPrefix}onboarding_complete`,
      );
      console.log('LocalStorage onboarding status:', localStorageValue);

      // Force update localStorage if it doesn't match the current state
      if (onboarding_complete && localStorageValue !== 'true') {
        console.log('Forcing localStorage update for onboarding status');
        localStorage.setItem(`${userPrefix}onboarding_complete`, 'true');
      }
    }
  }, [onboarding_complete, authState]);

  // Check if there are tasks and force set onboarding status
  useEffect(() => {
    if (tasks.length > 0 && !onboarding_complete) {
      console.log(
        'Tasks exist but onboarding not complete. Forcing onboarding complete.',
      );
      dispatch({ type: 'SET_ONBOARDING_COMPLETE', payload: true });

      // Also directly update localStorage
      const { user } = authState;
      if (user) {
        const userPrefix = `user_${user.uid}_`;
        localStorage.setItem(`${userPrefix}onboarding_complete`, 'true');
      }
    }
  }, [tasks, onboarding_complete, authState, dispatch]);

  // Add a handler for opening settings
  const handleOpenSettings = () => {
    setShowSettings(true);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Overlay for loading state */}
      <LoadingOverlay show={ui.isLoading} message="Loading your tasks..." />

      {/* App header with progress circle */}
      <ErrorBoundary>
        <Header
          onOpenSettings={handleOpenSettings}
          todayTaskCount={todayFocusTasks.length}
          totalTaskCount={tasks.length}
          todayTasksCompleted={
            todayFocusTasks.filter((t) => t.completed).length
          }
        />
      </ErrorBoundary>

      <main className="flex-1 mx-auto px-2 py-4 w-full max-w-[600px] md:px-6 md:py-8 lg:max-w-[900px] overflow-hidden">
        <div className="w-full h-full flex flex-col">
          {/* Main content: task list/cards, now full width on large screens */}
          <div className="w-full max-w-[600px] lg:max-w-[900px] mx-auto h-full">
            {/* Show welcome message if onboarding not complete AND no tasks exist */}
            <ErrorBoundary>
              {!onboarding_complete && tasks.length === 0 && <WelcomeMessage />}
            </ErrorBoundary>
            <div className="mt-4 space-y-4 h-full">
              {/* Main task list (today's focus or full schedule) */}
              <ErrorBoundary>
                <TaskErrorBoundary>
                  {ui.isLoading ? (
                    <LoadingState message="Loading tasks..." />
                  ) : ui.currentPage === 'schedule' ? (
                    <SchedulePage
                      tasks={assignedTasks}
                      onToggleComplete={handleToggleComplete}
                      onEdit={handleEditTask}
                    />
                  ) : (
                    <TaskList
                      tasks={todayFocusTasks}
                      onToggleComplete={handleToggleComplete}
                      onEdit={handleEditTask}
                    />
                  )}
                </TaskErrorBoundary>
              </ErrorBoundary>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom navigation */}
      <BottomNav
        currentPage={ui.currentPage}
        onToday={handleNavToday}
        onAdd={handleNavAdd}
        onSchedule={handleNavSchedule}
      />

      {/* Task input modal */}
      {isTaskInputExpanded && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
          <div
            ref={modalRef}
            className="bg-white rounded-xl w-full max-w-lg p-4 animate-slide-up overflow-hidden"
            style={{
              maxHeight: 'calc(100vh - 48px)',
              height: 'auto',
            }}
          >
            <TaskInput
              categories={categories}
              onAddTask={handleAddTask}
              onCancel={() => setIsTaskInputExpanded(false)}
              isExpanded={true}
            />
          </div>
        </div>
      )}

      {/* Edit task modal */}
      {editingTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
          <div
            ref={modalRef}
            className="bg-white rounded-xl w-full max-w-lg p-4 animate-slide-up overflow-hidden"
            style={{
              maxHeight: 'calc(100vh - 48px)',
              height: 'auto',
            }}
          >
            <EditTaskModal
              task={editingTask}
              categories={categories}
              onUpdateTask={handleUpdateTask}
              onCancel={() => setEditingTask(null)}
              onDelete={handleDeleteTask}
            />
          </div>
        </div>
      )}

      {/* Recurring task modal */}
      {recurringModal && (
        <RecurringTaskModal
          completedTask={recurringModal.completedTask}
          nextTask={recurringModal.nextTask}
          onClose={() => setRecurringModal(null)}
        />
      )}

      {/* Settings modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div
            className="bg-white rounded-xl w-full max-w-lg p-4 animate-fade-in overflow-hidden"
            style={{
              maxHeight: 'calc(100vh - 48px)',
              height: 'auto',
            }}
          >
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-bold">Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="p-2 text-neutral-600 hover:text-neutral-900 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 overflow-y-auto">
              {/* Settings content will go here */}
              <p className="text-neutral-600">
                Settings options will be added here.
              </p>
            </div>

            <div className="mt-4">
              <Button
                onClick={() => setShowSettings(false)}
                variant="primary"
                className="w-full py-2 text-sm"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Developer Tools */}
      <DevTools />
    </div>
  );
}

// App root with error boundary and context provider
function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppProvider>
          <ProtectedRoute>
            <AppContent />
          </ProtectedRoute>
        </AppProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
