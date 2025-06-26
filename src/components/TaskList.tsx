// TaskList.tsx
// Renders a list of tasks, optionally splitting into incomplete and completed sections.
// Used for both Today's Focus (inline mode) and Full Schedule (split mode).

import { CheckCircle2, Sparkles } from 'lucide-react';
import { Task } from '../types/task';
import { TaskCard } from './TaskCard';
import { getTodayKey, getDateKey } from '../utils/dateUtils';
import { PageLayout } from './PageLayout';

interface TaskListProps {
  tasks: Task[];
  onToggleComplete: (taskId: string) => void;
  onEdit?: (task: Task) => void;
  showCompletionCelebration?: boolean;
  showCompletedInline?: boolean; // If true, show completed/incomplete together (Today's Focus)
}

export function TaskList({
  tasks,
  onToggleComplete,
  onEdit,
  showCompletionCelebration = false,
  showCompletedInline = false,
}: TaskListProps) {
  // Split tasks into incomplete and completed
  const incompleteTasks = tasks.filter((task) => !task.completed);

  // Get today's date as a string in YYYY-MM-DD format for comparison
  const todayDateString = getTodayKey();

  // Format current date for display (lowercase)
  const formattedDate = new Date()
    .toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
    .toLowerCase();

  // Add ordinal suffix to day
  const formattedDateWithOrdinal = formattedDate.replace(/(\d+)/, (match) => {
    const num = parseInt(match);
    const suffixes = ['th', 'st', 'nd', 'rd'];
    const v = num % 100;
    return num + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
  });

  // Only show completed tasks for today in full schedule mode
  const completedTasks = showCompletedInline
    ? tasks.filter((task) => task.completed)
    : tasks.filter((task) => {
        if (!task.completed) return false;

        // Use the same string comparison approach for consistency
        const taskStartDateString = getDateKey(task.startDate);
        return taskStartDateString === todayDateString;
      });

  const allTasksCompleted =
    incompleteTasks.length === 0 && completedTasks.length > 0;

  // Debug logging
  console.log('TaskList - Tasks received:', tasks.length);
  console.log('TaskList - Incomplete tasks:', incompleteTasks.length);
  console.log('TaskList - Completed tasks:', completedTasks.length);
  console.log('TaskList - Today date string:', todayDateString);

  // Show empty state if no tasks
  if (tasks.length === 0) {
    return (
      <PageLayout>
        <div className="flex flex-col items-center justify-center h-full">
          <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-4 ">
            <CheckCircle2 className="w-8 h-8 text-neutral-600" />
          </div>
          <h3 className="text-lg font-medium text-neutral-900 mb-2 ">
            No tasks yet
          </h3>
          <p className="text-neutral-600 ">
            Add your first task to get started with focused productivity.
          </p>
        </div>
      </PageLayout>
    );
  }

  // Show celebration if all tasks completed (optional)
  if (allTasksCompleted && showCompletionCelebration) {
    return (
      <PageLayout>
        <div className="flex flex-col items-center justify-center h-full">
          <div className="w-20 h-20 bg-success-500/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce-gentle ">
            <Sparkles className="w-10 h-10 text-success-500" />
          </div>
          <h3 className="text-xl font-bold text-neutral-900 mb-2 ">
            All done! 🎉
          </h3>
          <p className="text-base text-neutral-600 mb-3 ">
            You've completed all your tasks for today.
          </p>
          <div className="bg-gradient-to-r from-success-500/10 to-primary-100 rounded-lg p-3 max-w-md mx-auto ">
            <p className="text-sm text-neutral-600 italic ">
              "The secret of getting ahead is getting started. The secret of
              getting started is breaking your complex overwhelming tasks into
              small manageable tasks."
            </p>
            <p className="text-xs text-neutral-500 mt-2 ">
              — Mark Twain
            </p>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-neutral-900 ">
          {formattedDateWithOrdinal}
        </h2>
      </div>

      <div className="mt-4 overflow-y-auto pb-4">
        {/* Inline mode: show all tasks in order, completed and incomplete (Today's Focus) */}
        {showCompletedInline ? (
          <div className="space-y-3">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggleComplete={onToggleComplete}
                onEdit={onEdit}
              />
            ))}
          </div>
        ) : (
          <>
            {/* Incomplete Tasks (Full Schedule) */}
            {incompleteTasks.length > 0 && (
              <div className="space-y-3">
                {incompleteTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggleComplete={onToggleComplete}
                    onEdit={onEdit}
                  />
                ))}
              </div>
            )}

            {/* Completed Tasks (Full Schedule) */}
            {completedTasks.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-neutral-600 mb-3 ">
                  completed ({completedTasks.length})
                </h3>
                <div className="space-y-3 opacity-75">
                  {completedTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onToggleComplete={onToggleComplete}
                      onEdit={onEdit}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </PageLayout>
  );
}
