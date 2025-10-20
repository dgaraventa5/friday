import { useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { format, isBefore } from 'date-fns';
import { Task } from '../types/task';
import { TaskCard } from './TaskCard';
import { getDateKey, normalizeDate, getTodayKey } from '../utils/dateUtils';
import { PageLayout } from './PageLayout';

interface SchedulePageProps {
  tasks: Task[];
  onToggleComplete: (taskId: string) => void;
  onEdit?: (task: Task) => void;
}

// Group tasks by startDate
function groupTasksByStartDate(tasks: Task[]): Record<string, Task[]> {
  return tasks.reduce(
    (acc, task) => {
      // Ensure we're always working with a normalized date at the start of day
      const dateKey = getDateKey(task.startDate);

      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(task);
      return acc;
    },
    {} as Record<string, Task[]>,
  );
}

export function SchedulePage({ tasks, onToggleComplete, onEdit }: SchedulePageProps) {
  const grouped = useMemo(() => groupTasksByStartDate(tasks), [tasks]);
  const today = normalizeDate(new Date());
  // Use local date string for today's key to avoid timezone issues
  const todayKey = getTodayKey();

  const sortedDates = useMemo(
    () =>
      Object.keys(grouped)
        .filter((dateKey) => {
          const dateObj = new Date(dateKey + 'T00:00:00');
          return !isBefore(dateObj, today) || dateKey === todayKey;
        })
        .sort(),
    [grouped, today, todayKey],
  );

  const scheduleSections = useMemo(
    () =>
      sortedDates.map((dateKey) => ({
        dateKey,
        tasks: grouped[dateKey] ?? [],
      })),
    [grouped, sortedDates],
  );

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: scheduleSections.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: (index) => {
      const taskCount = scheduleSections[index]?.tasks.length ?? 0;
      return 96 + Math.max(taskCount, 1) * 128;
    },
    overscan: 4,
  });

  return (
    <PageLayout>
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
        <span role="img" aria-label="calendar" className="text-xl sm:text-2xl">
          🗓️
        </span>
        <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">
          Full Schedule
        </h1>
      </div>

      {sortedDates.length === 0 && (
        <div className="text-center py-8 sm:py-12 text-neutral-600">
          No scheduled tasks yet.
        </div>
      )}

      {scheduleSections.length > 0 && (
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto pb-6 pr-1"
        >
          <div
            style={{
              height: virtualizer.getTotalSize(),
              width: '100%',
              position: 'relative',
            }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const section = scheduleSections[virtualRow.index];

              if (!section) {
                return null;
              }

              const dateObj = new Date(section.dateKey + 'T00:00:00');

              return (
                <div
                  key={virtualRow.key}
                  data-index={virtualRow.index}
                  ref={virtualizer.measureElement}
                  className="pb-3 sm:pb-4"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <div className="bg-white rounded-xl sm:rounded-2xl shadow-card p-3 sm:p-4 md:p-6">
                    <h2 className="text-base sm:text-lg font-bold text-neutral-800 mb-2">
                      {format(dateObj, 'EEE, MMM d')}
                    </h2>
                    <div className="space-y-2">
                      {section.tasks.map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          onToggleComplete={onToggleComplete}
                          onEdit={onEdit}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </PageLayout>
  );
}
