// TaskInput.tsx
// Renders the add task form/button. Handles form state, validation, and task creation.

import { useState, ChangeEvent } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from './Button';
import { Task, Category, AddTaskResult } from '../types/task';
import { FormField } from './FormField';
import { validateTask, ValidationError } from '../utils/validation';
import {
  formatDateInput,
  parseLocalDateInput,
  normalizeRecurringDays,
} from '../utils/dateUtils';
import logger from '../utils/logger';

type MaybePromise<T> = T | Promise<T>;

interface TaskInputProps {
  categories: Category[];
  onAddTask: (task: Task) => MaybePromise<AddTaskResult>;
  onCancel?: () => void;
  isExpanded?: boolean;
  submitLabel?: string;
}

export function TaskInput({
  categories,
  onAddTask,
  onCancel,
  isExpanded = false,
  submitLabel = 'Add Task',
}: TaskInputProps) {
  // Local state for task fields
  const [task, setTask] = useState<Partial<Task>>({
    name: '',
    category: undefined,
    dueDate: new Date(),
    estimatedHours: 1,
    importance: 'not-important',
    urgency: 'not-urgent',
    isRecurring: false,
    recurringEndType: 'never',
    recurringEndCount: 1,
    recurringCurrentCount: 0,
    recurringDays: [],
  });

  // Validation errors
  const [errors, setErrors] = useState<ValidationError[]>([]);
  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Error from submitting
  const [submitError, setSubmitError] = useState<string | null>(null);
  // Toggle for additional options section
  const [showRecurrence, setShowRecurrence] = useState(false);

  // Handle field changes and clear errors for that field
  const handleChange = (field: keyof Task, value: Task[keyof Task]) => {
    setTask((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => prev.filter((error) => error.field !== field));
    setSubmitError(null);
  };

  // Handle form submit: validate, create new Task, call onAddTask
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    const validation = validateTask(task);
    if (!validation.isValid) {
      setErrors(validation.errors);
      setIsSubmitting(false);
      return;
    }

    // Determine the appropriate start date based on the selected due date
    const selectedDueDate = new Date(task.dueDate!);
    const now = new Date();
    const isDueToday = selectedDueDate.toDateString() === now.toDateString();
    const isDueInFuture = selectedDueDate.getTime() > now.getTime() && !isDueToday;
    const startDate = isDueInFuture ? selectedDueDate : now;

    const recurringDays = normalizeRecurringDays(task.recurringDays);

    // Create new Task object
    const newTask: Task = {
      id: crypto.randomUUID(),
      recurringSeriesId: task.isRecurring ? crypto.randomUUID() : undefined,
      name: task.name!,
      category: task.category!,
      dueDate: task.dueDate!,
      estimatedHours: task.estimatedHours!,
      importance: task.importance!,
      urgency: task.urgency!,
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      isRecurring: task.isRecurring || false,
      recurringInterval: task.recurringInterval,
      recurringDays: task.isRecurring ? recurringDays : undefined,
      recurringEndType: task.isRecurring ? task.recurringEndType : undefined,
      recurringEndCount:
        task.isRecurring && task.recurringEndType === 'after'
          ? task.recurringEndCount
          : undefined,
      recurringCurrentCount: task.isRecurring ? 1 : undefined, // Start at 1 for the first instance
      startDate,
    };

    try {
      const result = await Promise.resolve(onAddTask(newTask));
    if (!result.success) {
      setSubmitError(result.message || 'Unable to add task');
      return;
    }

      // Reset form state
      setTask({
        name: '',
        category: undefined,
        dueDate: new Date(),
        estimatedHours: 1,
        importance: 'not-important',
        urgency: 'not-urgent',
        isRecurring: false,
        recurringEndType: 'never',
        recurringEndCount: 1,
        recurringCurrentCount: 0,
        recurringDays: [],
      });
      setErrors([]);
      setSubmitError(null);
      setShowRecurrence(false);
    } catch (error) {
      logger.error('Failed to add task', error);
      setSubmitError('Unable to add task');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancel/close
  const handleCancel = () => {
    setTask({
      name: '',
      category: undefined,
      dueDate: new Date(),
      estimatedHours: 1,
      importance: 'not-important',
      urgency: 'not-urgent',
      isRecurring: false,
      recurringEndType: 'never',
      recurringEndCount: 1,
      recurringCurrentCount: 0,
      recurringDays: [],
    });
    setSubmitError(null);
    setShowRecurrence(false);
    onCancel?.();
  };

  // Show add button if not expanded
  if (!isExpanded) {
    return (
      <button
        onClick={onCancel}
        className="w-full flex items-center justify-center gap-2 p-2 sm:p-3 border-2 border-dashed border-neutral-50 rounded-lg text-neutral-600 hover:border-primary-500 hover:text-primary-600 transition-all duration-200 group"
      >
        <Plus className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
        <span className="font-medium">Add a task</span>
      </button>
    );
  }

  // Render the add task form
  return (
    <div className="bg-[#f7f7f7] rounded-lg border border-neutral-50 shadow-card animate-slide-up modal-form">
      <form
        onSubmit={handleSubmit}
        className="w-full flex flex-col max-h-[calc(100vh-4rem)]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-2 sm:p-3 border-b border-neutral-100">
          <h3 className="text-lg sm:text-xl font-bold text-neutral-900">Add New Task</h3>
          <Button
            type="button"
            onClick={handleCancel}
            variant="secondary"
            icon
            aria-label="Cancel"
            className="w-8 h-8 sm:w-9 sm:h-9"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-4 sm:space-y-6">
          {submitError && (
            <div
              role="alert"
              className="p-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded"
            >
              {submitError}
            </div>
          )}
          {/* Basics */}
          <section className="space-y-3">
            <FormField
              label="Task Name"
              type="text"
              value={task.name}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                handleChange('name', e.target.value)
              }
              required
              error={errors.find((e) => e.field === 'name')?.message}
              placeholder="What needs to be done?"
              className="text-base py-2 px-3 h-9 sm:h-11"
            />

            <FormField
              label="Category"
              options={categories.map((cat) => ({
                value: cat.id,
                label: cat.name,
              }))}
              value={task.category?.id}
              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                handleChange(
                  'category',
                  categories.find((c) => c.id === e.target.value),
                )
              }
              required
              error={errors.find((e) => e.field === 'category')?.message}
              className="text-base py-2 px-3 h-9 sm:h-11"
            />
          </section>

          {/* Time */}

          <section className="space-y-3 border-b border-neutral-100 pb-3">
            <h4 className="text-sm font-semibold text-neutral-700">Time</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
              <FormField
                label="Due Date"
                type="date"
                value={task.dueDate ? formatDateInput(new Date(task.dueDate)) : ''}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  handleChange('dueDate', parseLocalDateInput(e.target.value))
                }
                required
                error={errors.find((e) => e.field === 'dueDate')?.message}
                className="text-base py-2 px-3 h-9 sm:h-11"
              />

              <FormField
                label="Estimated Hours"
                type="number"
                value={task.estimatedHours}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  handleChange('estimatedHours', parseFloat(e.target.value))
                }
                min="0.25"
                max="24"
                step="0.25"
                required
                error={errors.find((e) => e.field === 'estimatedHours')?.message}
                className="text-base py-2 px-3 h-9 sm:h-11"
              />
            </div>
          </section>

          {/* Priority */}
          <section className="space-y-3">
            <h4 className="text-sm font-semibold text-neutral-700">Priority</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
              {/* Importance segmented control */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-neutral-700 mb-1">
                  Importance<span className="text-red-500 ml-1">*</span>
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className={`flex-1 px-2 py-1 rounded-md border text-sm transition-colors ${
                      task.importance === 'important'
                        ? 'bg-red-100 border-red-300 text-red-700'
                        : 'bg-white border-neutral-300 text-neutral-600'
                    }`}
                    onClick={() => handleChange('importance', 'important')}
                  >
                    Important
                  </button>
                  <button
                    type="button"
                    className={`flex-1 px-2 py-1 rounded-md border text-sm transition-colors ${
                      task.importance === 'not-important'
                        ? 'bg-green-100 border-green-300 text-green-700'
                        : 'bg-white border-neutral-300 text-neutral-600'
                    }`}
                    onClick={() => handleChange('importance', 'not-important')}
                  >
                    Not Important
                  </button>
                </div>
                {errors.find((e) => e.field === 'importance')?.message && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.find((e) => e.field === 'importance')?.message}
                  </p>
                )}
              </div>

              {/* Urgency segmented control */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-neutral-700 mb-1">
                  Urgency<span className="text-red-500 ml-1">*</span>
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className={`flex-1 px-2 py-1 rounded-md border text-sm transition-colors ${
                      task.urgency === 'urgent'
                        ? 'bg-amber-100 border-amber-300 text-amber-700'
                        : 'bg-white border-neutral-300 text-neutral-600'
                    }`}
                    onClick={() => handleChange('urgency', 'urgent')}
                  >
                    Urgent
                  </button>
                  <button
                    type="button"
                    className={`flex-1 px-2 py-1 rounded-md border text-sm transition-colors ${
                      task.urgency === 'not-urgent'
                        ? 'bg-green-100 border-green-300 text-green-700'
                        : 'bg-white border-neutral-300 text-neutral-600'
                    }`}
                    onClick={() => handleChange('urgency', 'not-urgent')}
                  >
                    Not Urgent
                  </button>
                </div>
                {errors.find((e) => e.field === 'urgency')?.message && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.find((e) => e.field === 'urgency')?.message}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* More options / Recurrence section */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setShowRecurrence((s) => !s)}
              className="text-sm text-primary-600 hover:underline"
            >
              {showRecurrence ? 'Hide options' : 'More options'}
            </button>
          </div>

          {showRecurrence && (
            <section className="space-y-3 border-t border-neutral-200 pt-3">
              <h4 className="text-sm font-semibold text-neutral-700">
                Recurrence
              </h4>
              <label className="flex items-center gap-2 sm:gap-3 min-h-[36px] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={task.isRecurring}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    handleChange('isRecurring', e.target.checked)
                  }
                  className="h-5 w-5 sm:h-4 sm:w-4 text-primary-600 focus:ring-primary-500 border-neutral-50 rounded"
                />
                <span className="text-sm text-neutral-900">
                  Enable recurrence
                </span>
              </label>

              {task.isRecurring && (
                <div className="space-y-3">
                  <FormField
                    label="Recurring Interval"
                    options={[
                      { value: 'daily', label: 'Daily' },
                      { value: 'weekly', label: 'Weekly' },
                      { value: 'monthly', label: 'Monthly' },
                    ]}
                    value={task.recurringInterval}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                      handleChange('recurringInterval', e.target.value)
                    }
                    required
                    error={
                      errors.find((e) => e.field === 'recurringInterval')
                        ?.message
                    }
                    className="text-base py-2 px-3 h-9 sm:h-11"
                  />

                  {task.recurringInterval === 'weekly' && (
                    <div>
                      <label className="block text-sm font-medium text-neutral-600 mb-1">
                        Recurring Days
                      </label>
                      <div className="flex flex-wrap gap-3">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(
                          (day, index) => (
                            <label
                              key={day}
                              className="inline-flex items-center"
                            >
                              <input
                                type="checkbox"
                                checked={
                                  Array.isArray(task.recurringDays) &&
                                  task.recurringDays.includes(index)
                                }
                                onChange={(
                                  e: ChangeEvent<HTMLInputElement>,
                                ) => {
                                  const days = Array.isArray(task.recurringDays)
                                    ? task.recurringDays
                                    : [];
                                  const updated = e.target.checked
                                    ? [...days, index]
                                    : days.filter((d) => d !== index);
                                  const normalized =
                                    normalizeRecurringDays(updated) ?? [];
                                  handleChange('recurringDays', normalized);
                                }}
                                className="h-4 w-4 sm:h-3 sm:w-3 text-primary-600 focus:ring-primary-500 border-neutral-50 rounded"
                              />
                              <span className="ml-2 sm:ml-1 text-sm sm:text-xs text-neutral-600">
                                {day}
                              </span>
                            </label>
                          ),
                        )}
                      </div>
                      {errors.find((e) => e.field === 'recurringDays')
                        ?.message && (
                        <p className="mt-1 text-xs text-red-600">
                          {
                            errors.find((e) => e.field === 'recurringDays')
                              ?.message
                          }
                        </p>
                      )}
                    </div>
                  )}

                  {/* End Repeat Options */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-600 mb-1">
                      End Repeat
                    </label>
                    <div className="space-y-2 sm:space-y-1">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          checked={task.recurringEndType === 'never'}
                          onChange={() =>
                            handleChange('recurringEndType', 'never')
                          }
                          className="h-4 w-4 sm:h-3 sm:w-3 text-primary-600 focus:ring-primary-500 border-neutral-50"
                        />
                        <span className="ml-2 text-sm sm:text-xs text-neutral-600">
                          Never
                        </span>
                      </label>

                      <div className="flex items-center">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            checked={task.recurringEndType === 'after'}
                            onChange={() =>
                              handleChange('recurringEndType', 'after')
                            }
                            className="h-4 w-4 sm:h-3 sm:w-3 text-primary-600 focus:ring-primary-500 border-neutral-50"
                          />
                          <span className="ml-2 text-sm sm:text-xs text-neutral-600">
                            After
                          </span>
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={task.recurringEndCount || 1}
                          onChange={(e) =>
                            handleChange(
                              'recurringEndCount',
                              parseInt(e.target.value, 10),
                            )
                          }
                          disabled={task.recurringEndType !== 'after'}
                          className="ml-2 w-14 h-8 sm:w-12 sm:h-6 border border-neutral-300 rounded text-sm sm:text-xs px-2"
                        />
                        <span className="ml-1 text-sm sm:text-xs text-neutral-600">
                          time(s)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="p-2 sm:p-3 border-t border-neutral-100 bg-[#f7f7f7]">
          <Button
            type="submit"
            disabled={isSubmitting}
            variant="primary"
            className="w-full !px-3 !py-1.5 text-sm sm:!px-4 sm:!py-2"
          >
            {isSubmitting ? 'Adding...' : submitLabel}
          </Button>
        </div>
      </form>
    </div>
  );
}
