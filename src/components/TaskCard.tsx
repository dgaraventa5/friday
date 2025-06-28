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
      className={`bg-white rounded-lg border p-4 shadow-card transition-all duration-600 hover:shadow-card-hover hover:scale-[1.015]  cursor-pointer
        ${task.completed ? 'border-success-500 bg-success-50/30 opacity-60 translate-y-2' : isOverdue ? 'border-warning-500 bg-warning-50/20' : 'border-neutral-100'}
      `}
      onClick={handleCardClick}
    >
      <div className="flex items-start gap-3">
        {/* Completion Toggle Button */}
        <button
          onClick={(e) => {
            e.preventDefault(); // Prevent card click from triggering
            e.stopPropagation(); // Stop event from bubbling up
            onToggleComplete(task.id);
          }}
          className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
            task.completed
              ? 'bg-success-500 border-success-500 text-white'
              : 'border-gray-300 hover:border-primary-400 hover:bg-primary-50'
          }`}
        >
          {task.completed && <Check className="w-4 h-4" />}
        </button>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Top row with task name and metadata */}
          <div className="flex items-center justify-between mb-2">
            {/* Task Name with recurring icon if applicable (strikethrough if completed) */}
            <div className="flex items-center gap-1">
              <h3
                className={`text-lg font-semibold  ${
                  task.completed
                    ? 'text-neutral-600 line-through'
                    : 'text-neutral-900'
                }`}
              >
                {task.name}
              </h3>
              {task.isRecurring && (
                <RefreshCw className="w-4 h-4 text-accent-700" />
              )}
            </div>

            {/* Right side info - inline */}
            <div className="flex items-center gap-3 ml-4">
              {/* Category */}
              <div className="flex items-center gap-1">
                <span className="text-sm text-neutral-600">
                  {task.category.name}
                </span>
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: task.category.color }}
                />
              </div>

              {/* Due Date (with overdue/today coloring) */}
              <div
                className={`flex items-center gap-1 ${
                  isOverdue
                    ? 'text-warning-500'
                    : isDueToday
                      ? 'text-primary-600'
                      : 'text-neutral-600'
                }`}
              >
                <span className="text-sm">{formatTaskDate(task.dueDate)}</span>
                <Calendar className="w-4 h-4" />
                {isOverdue && <AlertTriangle className="w-4 h-4" />}
              </div>

              {/* Estimated Time */}
              <div className="flex items-center gap-1 text-neutral-600">
                <span className="text-sm">
                  {task.estimatedHours === 1
                    ? '1 hour'
                    : `${task.estimatedHours} hours`}
                </span>
                <Clock className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Removed recurring indicator text */}
        </div>
      </div>
    </div>
  );
}
