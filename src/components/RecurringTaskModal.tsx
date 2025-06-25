// RecurringTaskModal.tsx
// Modal shown when a recurring task is completed to inform about the next instance

import { Task } from '../types/task';
import { formatTaskDate } from '../utils/dateUtils';
import { Button } from './Button';
import { X } from 'lucide-react';

interface RecurringTaskModalProps {
  completedTask: Task;
  nextTask: Task;
  onClose: () => void;
}

export function RecurringTaskModal({
  completedTask,
  nextTask,
  onClose,
}: RecurringTaskModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
      <div
        className="bg-white rounded-lg shadow-md max-w-xs w-full p-3 animate-slide-up overflow-hidden mx-4"
        style={{
          maxHeight: 'calc(100vh - 48px)',
          height: 'auto',
        }}
      >
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-base font-bold text-neutral-900 font-sans">
            Task Rescheduled
          </h3>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-700 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="mb-2 text-xs text-neutral-800 font-sans">
          You completed "
          <span className="font-medium">{completedTask.name}</span>"
        </p>

        <div className="bg-green-50 border border-green-100 rounded-md p-2 mb-3">
          <p className="text-xs text-green-800 font-sans">
            A new instance has been created for{' '}
            <span className="font-medium">
              {formatTaskDate(nextTask.dueDate)}
            </span>
          </p>
        </div>

        <div className="flex justify-end">
          <Button
            variant="primary"
            onClick={onClose}
            className="py-1 px-3 text-xs"
          >
            Got it
          </Button>
        </div>
      </div>
    </div>
  );
}
