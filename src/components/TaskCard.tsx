// TaskCard.tsx
// Renders a single task card with completion toggle, details, and priority info.

import { Check, Clock, Calendar, AlertTriangle, RefreshCw } from 'lucide-react';
import { Task } from '../types/task';
import { formatTaskDate } from '../utils/dateUtils';
import { calculateTaskScore } from '../utils/taskPrioritization';
import { isPast, isToday } from 'date-fns';

interface TaskCardProps {
  task: Task;
  onToggleComplete: (taskId: string) => void;
  onEdit?: (task: Task) => void;
}

export function TaskCard({ task, onToggleComplete, onEdit }: TaskCardProps) {
  // Calculate score and status for display
  const taskScore = calculateTaskScore(task);
  const isOverdue = isPast(task.dueDate) && !isToday(task.dueDate);
  const isDueToday = isToday(task.dueDate);

  // Helper for priority color
  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1: return 'text-error-600 bg-error-50 border-error-200';
      case 2: return 'text-warning-700 bg-warning-50 border-warning-200';
      case 3: return 'text-primary-600 bg-primary-50 border-primary-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Helper for priority label
  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 1: return 'Critical';
      case 2: return 'High';
      case 3: return 'Medium';
      default: return 'Low';
    }
  };

  // Format recurring task info
  const getRecurringInfo = () => {
    let baseText = '';
    if (task.recurringInterval === 'daily') baseText = 'Repeats daily';
    else if (task.recurringInterval === 'weekly' && task.recurringDays?.length) {
      baseText = `Repeats weekly on ${task.recurringDays.map(d => 
        ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]
      ).join(', ')}`;
    }
    else if (task.recurringInterval === 'weekly') baseText = 'Repeats weekly';
    else if (task.recurringInterval === 'monthly') baseText = 'Repeats monthly';
    
    // Add end repeat info
    if (task.recurringEndType === 'after' && task.recurringEndCount) {
      return `${baseText}, ${task.recurringCurrentCount || 1} of ${task.recurringEndCount} times`;
    }
    
    return baseText;
  };

  // Handle card click for editing
  const handleCardClick = (e: React.MouseEvent) => {
    // Only trigger edit if not clicking on the completion toggle
    if (onEdit && !e.defaultPrevented) {
      onEdit(task);
    }
  };

  return (
    <div 
      className={`bg-white rounded-lg border p-4 shadow-card transition-all duration-600 hover:shadow-card-hover hover:scale-[1.015] font-sans cursor-pointer
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

        <div className="flex-1 min-w-0">
          {/* Task Name (strikethrough if completed) */}
          <h3 className={`text-lg font-semibold mb-2 font-sans ${
            task.completed ? 'text-neutral-600 line-through' : 'text-neutral-900'
          }`}>
            {task.name}
          </h3>

          {/* Task Details: category, due date, estimated time */}
          <div className="flex flex-wrap gap-3 mb-3">
            {/* Category */}
            <div className="flex items-center gap-1">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: task.category.color }}
              />
              <span className="text-sm text-neutral-600">{task.category.name}</span>
            </div>

            {/* Due Date (with overdue/today coloring) */}
            <div className={`flex items-center gap-1 ${
              isOverdue ? 'text-warning-500' : isDueToday ? 'text-primary-600' : 'text-neutral-600'
            }`}>
              <Calendar className="w-4 h-4" />
              <span className="text-sm">{formatTaskDate(task.dueDate)}</span>
              {isOverdue && <AlertTriangle className="w-4 h-4" />}
            </div>

            {/* Estimated Time */}
            <div className="flex items-center gap-1 text-neutral-600">
              <Clock className="w-4 h-4" />
              <span className="text-sm">
                {task.estimatedHours === 1 ? '1 hour' : `${task.estimatedHours} hours`}
              </span>
            </div>
          </div>

          {/* Priority & Eisenhower Quadrant */}
          {!task.completed && (
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(taskScore.priority)}`}>
                {getPriorityLabel(taskScore.priority)}
              </span>
              
              <span className="text-xs text-neutral-600">
                {taskScore.quadrant.split('-').map(word => 
                  word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ')}
              </span>
            </div>
          )}

          {/* Recurring Indicator */}
          {task.isRecurring && (
            <div className="mt-2">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-accent-100 text-accent-700">
                <RefreshCw className="w-3 h-3" />
                {getRecurringInfo()}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}