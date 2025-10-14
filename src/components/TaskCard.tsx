// TaskCard.tsx
// Renders a single task card with completion toggle, details, and priority info.

import { Check, Clock, Calendar, AlertTriangle, RefreshCw } from 'lucide-react';
import { Task } from '../types/task';
import { formatTaskDate } from '../utils/dateUtils';
import { isPast, isToday } from 'date-fns';

interface TaskCardProps {
  task: Task;
  onToggleComplete: (taskId: string) => void;
  onEdit?: (task: Task) => void;
}

export function TaskCard({ task, onToggleComplete, onEdit }: TaskCardProps) {
  // Calculate status for display
  const isOverdue = isPast(task.dueDate) && !isToday(task.dueDate);
  const isDueToday = isToday(task.dueDate);

  // Handle card click for editing
  const handleCardClick = (e: React.MouseEvent) => {
    // Only trigger edit if not clicking on the completion toggle
    if (onEdit && !e.defaultPrevented) {
      onEdit(task);
    }
  };

  return (
    <div
      className={`bg-white rounded-xl border p-2.5 sm:p-3 shadow-card transition-all duration-600
        ${task.completed ? 'border-success-500 bg-success-50/30 opacity-60 translate-y-1.5' : isOverdue ? 'border-warning-500 bg-warning-50/20' : 'border-neutral-100'}
        ${onEdit ? 'cursor-pointer hover:shadow-card-hover hover:scale-[1.01]' : ''}
      `}
      onClick={handleCardClick}
    >
      <div className="flex items-start gap-2 sm:gap-3">
        {/* Completion Toggle Button */}
        <button
          onClick={(e) => {
            e.preventDefault(); // Prevent card click from triggering
            e.stopPropagation(); // Stop event from bubbling up
            onToggleComplete(task.id);
          }}
          className={`flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
            task.completed
              ? 'bg-success-500 border-success-500 text-white'
              : 'border-gray-300 hover:border-primary-400 hover:bg-primary-50'
          }`}
        >
          {task.completed && <Check className="w-3 h-3 sm:w-4 sm:h-4" />}
        </button>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Top row with task name and recurring icon */}
          <div className="flex items-center gap-1.5 mb-1">
            <h3
              className={`text-sm sm:text-base font-semibold truncate ${
                task.completed
                  ? 'text-neutral-600 line-through'
                  : 'text-neutral-900'
              }`}
            >
              {task.name}
            </h3>
            {task.isRecurring && (
              <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 text-accent-700 flex-shrink-0" />
            )}
          </div>

          {/* Metadata - compact badges */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs leading-4">
            {/* Category */}
            <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100/80 text-neutral-600 px-2 py-0.5">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: task.category.color }}
              />
              {task.category.name}
            </span>

            {/* Due Date (with overdue/today coloring) */}
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${
                isOverdue
                  ? 'bg-warning-100 text-warning-600'
                  : isDueToday
                    ? 'bg-primary-50 text-primary-600'
                    : 'bg-neutral-50 text-neutral-600'
              }`}
            >
              <Calendar className="w-3 h-3 flex-shrink-0" />
              {formatTaskDate(task.dueDate)}
              {isOverdue && (
                <AlertTriangle className="w-3 h-3 flex-shrink-0" />
              )}
            </span>

            {/* Estimated Time */}
            <span className="inline-flex items-center gap-1 rounded-full bg-neutral-50 text-neutral-600 px-2 py-0.5">
              <Clock className="w-3 h-3 flex-shrink-0" />
              {task.estimatedHours === 1
                ? '1h'
                : `${task.estimatedHours}h`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
