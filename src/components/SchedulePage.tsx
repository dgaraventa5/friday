import { Task } from '../types/task';
import { TaskCard } from './TaskCard';
import { format, isBefore } from 'date-fns';
import { getDateKey, normalizeDate, getTodayKey } from '../utils/dateUtils';

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

export function SchedulePage({
  tasks,
  onToggleComplete,
  onEdit,
}: SchedulePageProps) {
  // Group and sort dates
  const grouped = groupTasksByStartDate(tasks);
  const today = normalizeDate(new Date());
  // Use local date string for today's key to avoid timezone issues
  const todayKey = getTodayKey();

  // Debug logging to help diagnose issues
  console.log('SchedulePage - Today key:', todayKey);
  console.log('SchedulePage - Available date keys:', Object.keys(grouped));
  console.log('SchedulePage - Tasks for today:', grouped[todayKey] || []);

  const sortedDates = Object.keys(grouped)
    .filter((dateKey) => {
      // Parse the date in local time to avoid timezone issues
      const dateObj = new Date(dateKey + 'T00:00:00');
      return !isBefore(dateObj, today) || dateKey === todayKey;
    })
    .sort();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-neutral-900 mb-4 font-sans flex items-center gap-2">
        <span role="img" aria-label="calendar">
          🗓️
        </span>{' '}
        Full Task Schedule
      </h1>
      {sortedDates.length === 0 && (
        <div className="text-center py-12 text-neutral-600 font-sans">
          No scheduled tasks yet.
        </div>
      )}
      {sortedDates.map((dateKey) => {
        // Create a date object directly from the local date string
        // Add T00:00:00 to ensure it's parsed as local time
        const dateObj = new Date(dateKey + 'T00:00:00');

        // Debug log to see what date we're working with
        console.log(
          'Rendering date:',
          dateKey,
          'as Date object:',
          dateObj,
          'formatted:',
          format(dateObj, 'EEE MMM d yyyy'),
        );

        return (
          <div
            key={dateKey}
            className="bg-white rounded-2xl shadow-card p-4 md:p-6"
          >
            <h2 className="text-lg font-bold text-neutral-800 mb-2 font-sans">
              {format(dateObj, 'EEE MMM d yyyy')}
            </h2>
            <div className="space-y-2">
              {grouped[dateKey].map((task) => (
                <div key={task.id}>
                  <TaskCard
                    task={task}
                    onToggleComplete={onToggleComplete}
                    onEdit={onEdit}
                  />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
