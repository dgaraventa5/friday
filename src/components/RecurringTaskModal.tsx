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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full p-4 animate-slide-up overflow-hidden"
        style={{
          maxHeight: 'calc(100vh - 48px)',
          height: 'auto',
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-bold text-neutral-900 font-sans">
            Task Rescheduled
          </h3>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-700 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="mb-3 text-sm text-neutral-800 font-sans">
          You completed "
          <span className="font-medium">{completedTask.name}</span>"
        </p>

        <div className="bg-green-50 border border-green-100 rounded-md p-3 mb-4">
          <p className="text-xs text-green-800 font-sans">
            Since this is a recurring task, a new instance has been created for{' '}
            <span className="font-medium">
              {formatTaskDate(nextTask.dueDate)}
            </span>
            .
          </p>
        </div>

        <div className="flex justify-end">
          <Button variant="primary" onClick={onClose} className="py-2 text-sm">
            Got it
          </Button>
        </div>
      </div>
    </div>
  );
}
