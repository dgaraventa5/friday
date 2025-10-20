// TaskList.tsx
// Renders a list of tasks, optionally splitting into incomplete and completed sections.
// Used for both Today's Focus (inline mode) and Full Schedule (split mode).

import { CheckCircle2, Sparkles } from 'lucide-react';
import { useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
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

type TaskListItem =
  | { type: 'task'; task: Task }
  | { type: 'header'; label: string };

export function TaskList({
  tasks,
  onToggleComplete,
  onEdit,
  showCompletionCelebration = false,
  showCompletedInline = false,
}: TaskListProps) {
  // Split tasks into incomplete and completed
  const incompleteTasks = useMemo(
    () => tasks.filter((task) => !task.completed),
    [tasks],
  );

  // Get today's date as a string in YYYY-MM-DD format for comparison
  const todayDateString = getTodayKey();

  // Format current date for display - simplified for mobile
  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short', // 'short' instead of 'long'
    month: 'short', // 'short' instead of 'long'
    day: 'numeric',
    year: 'numeric',
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

  const listItems = useMemo(() => {
    if (showCompletedInline) {
      return tasks.map<TaskListItem>((task) => ({ type: 'task', task }));
    }

    const items: TaskListItem[] = incompleteTasks.map((task) => ({
      type: 'task',
      task,
    }));

    if (completedTasks.length > 0) {
      items.push({
        type: 'header',
        label: `completed (${completedTasks.length})`,
      });
      completedTasks.forEach((task) => {
        items.push({ type: 'task', task });
      });
    }

    return items;
  }, [showCompletedInline, tasks, incompleteTasks, completedTasks]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: listItems.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: (index) =>
      listItems[index]?.type === 'header' ? 48 : 124,
    overscan: 8,
  });

  // Show empty state if no tasks
  if (tasks.length === 0) {
    return (
      <PageLayout>
        <div className="flex flex-col items-center justify-center h-full">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <CheckCircle2 className="w-7 h-7 sm:w-8 sm:h-8 text-neutral-600" />
          </div>
          <h3 className="text-base sm:text-lg font-medium text-neutral-900 mb-1 sm:mb-2">
            No tasks yet
          </h3>
          <p className="text-sm sm:text-base text-neutral-600">
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
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-success-500/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 animate-bounce-gentle">
            <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-success-500" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-neutral-900 mb-1 sm:mb-2">
            All done! 🎉
          </h3>
          <p className="text-sm sm:text-base text-neutral-600 mb-2 sm:mb-3">
            You've completed all your tasks for today.
          </p>
          <div className="bg-gradient-to-r from-success-500/10 to-primary-100 rounded-lg p-2 sm:p-3 max-w-md mx-auto">
            <p className="text-xs sm:text-sm text-neutral-600 italic">
              "The secret of getting ahead is getting started. The secret of
              getting started is breaking your complex overwhelming tasks into
              small manageable tasks."
            </p>
            <p className="text-xs text-neutral-500 mt-1 sm:mt-2">
              — Mark Twain
            </p>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="flex flex-col flex-1 min-h-0">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-xl font-bold text-neutral-900">
            {formattedDate}
          </h2>
        </div>

        <div
          ref={scrollContainerRef}
          className="mt-2 sm:mt-3 flex-1 min-h-0 overflow-y-auto pb-4 pr-1"
        >
          <div
            style={{
              height: virtualizer.getTotalSize(),
              width: '100%',
              position: 'relative',
            }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const item = listItems[virtualRow.index];
              if (!item) {
                return null;
              }

              const baseClassName = (() => {
                if (item.type === 'header') {
                  return 'pt-2 sm:pt-3 border-t border-neutral-100';
                }

                return [
                  'pb-2 sm:pb-3',
                  !showCompletedInline && item.task.completed
                    ? 'opacity-75'
                    : null,
                ]
                  .filter(Boolean)
                  .join(' ');
              })();

              return (
                <div
                  key={virtualRow.key}
                  data-index={virtualRow.index}
                  ref={virtualizer.measureElement}
                  className={baseClassName}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  {item.type === 'header' ? (
                    <h3 className="text-xs uppercase tracking-wide text-neutral-500 mb-1.5 sm:text-sm">
                      {item.label}
                    </h3>
                  ) : (
                    <TaskCard
                      task={item.task}
                      onToggleComplete={onToggleComplete}
                      onEdit={onEdit}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
