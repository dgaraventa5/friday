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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] animate-fade-in">
      <div
        className="bg-white rounded-lg shadow-sm max-w-[260px] w-full p-2 animate-slide-up overflow-hidden mx-2"
        style={{
          maxHeight: 'min-content',
        }}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-neutral-900 ">
            Task Rescheduled
          </h3>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-700"
            aria-label="Close"
          >
            <X className="w-3 h-3" />
          </button>
        </div>

        <div className="bg-green-50 border border-green-100 rounded p-1.5 my-1.5">
          <p className="text-xs text-green-800  leading-tight">
            <span className="font-medium">{completedTask.name}</span> completed.
            <br />
            Next:{' '}
            <span className="font-medium">
              {formatTaskDate(nextTask.dueDate)}
            </span>
          </p>
        </div>

        <div className="flex justify-end">
          <Button
            variant="primary"
            onClick={onClose}
            className="py-0.5 px-2 text-xs"
          >
            OK
          </Button>
        </div>
      </div>
    </div>
  );
}
