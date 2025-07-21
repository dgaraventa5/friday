// TaskInput.tsx
// Renders the add task form/button. Handles form state, validation, and task creation.

import { useState, ChangeEvent } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from './Button';
import { Task, Category } from '../types/task';
import { FormField } from './FormField';
import { validateTask, ValidationError } from '../utils/validation';

interface TaskInputProps {
  categories: Category[];
  onAddTask: (task: Task) => void;
  onCancel?: () => void;
  isExpanded?: boolean;
}

export function TaskInput({
  categories,
  onAddTask,
  onCancel,
  isExpanded = false,
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
  });

  // Validation errors
  const [errors, setErrors] = useState<ValidationError[]>([]);
  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle field changes and clear errors for that field
  const handleChange = (field: keyof Task, value: Task[keyof Task]) => {
    setTask((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => prev.filter((error) => error.field !== field));
  };

  // Handle form submit: validate, create new Task, call onAddTask
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const validation = validateTask(task);
    if (!validation.isValid) {
      setErrors(validation.errors);
      setIsSubmitting(false);
      return;
    }

    // Create new Task object
    const newTask: Task = {
      id: crypto.randomUUID(),
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
      recurringDays: task.recurringDays,
      recurringEndType: task.isRecurring ? task.recurringEndType : undefined,
      recurringEndCount:
        task.isRecurring && task.recurringEndType === 'after'
          ? task.recurringEndCount
          : undefined,
      recurringCurrentCount: task.isRecurring ? 1 : undefined, // Start at 1 for the first instance
      startDate: new Date(), // Set startDate to current date instead of undefined
    };

    onAddTask(newTask);
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
    });
    setErrors([]);
    setIsSubmitting(false);
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
    });
    onCancel?.();
  };

  // Show add button if not expanded
  if (!isExpanded) {
    return (
      <button
        onClick={onCancel}
        className="w-full flex items-center justify-center gap-2 p-3 sm:p-4 border-2 border-dashed border-neutral-50 rounded-lg text-neutral-600 hover:border-primary-500 hover:text-primary-600 transition-all duration-200 group"
      >
        <Plus className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
        <span className="font-medium">Add a task</span>
      </button>
    );
  }

  // Render the add task form
  return (
    <div className="bg-[#f7f7f7] rounded-lg border border-neutral-50 shadow-card animate-slide-up modal-form">
      <form onSubmit={handleSubmit} className="w-full">
        <div className="flex items-center justify-between p-3 border-b border-neutral-100">
          <h3 className="text-lg sm:text-xl font-bold text-neutral-900">
            Add New Task
          </h3>
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
        
        <div className="p-3 space-y-4">
        {/* Task Name Field */}
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
          className="text-base py-2 px-3 h-10 sm:h-12"
        />

        {/* Category Field */}
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
          className="text-base py-2 px-3 h-10 sm:h-12"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {/* Due Date Field */}
          <FormField
            label="Due Date"
            type="date"
            value={task.dueDate?.toISOString().split('T')[0]}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              handleChange('dueDate', new Date(e.target.value))
            }
            required
            error={errors.find((e) => e.field === 'dueDate')?.message}
            className="text-base py-2 px-3 h-10 sm:h-12"
          />

          {/* Estimated Hours Field */}
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
            className="text-base py-2 px-3 h-10 sm:h-12"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {/* Importance Field */}
          <FormField
            label="Importance"
            options={[
              { value: 'important', label: 'Important' },
              { value: 'not-important', label: 'Not Important' },
            ]}
            value={task.importance}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              handleChange('importance', e.target.value)
            }
            required
            error={errors.find((e) => e.field === 'importance')?.message}
            className="text-base py-2 px-3 h-10 sm:h-12"
          />

          {/* Urgency Field */}
          <FormField
            label="Urgency"
            options={[
              { value: 'urgent', label: 'Urgent' },
              { value: 'not-urgent', label: 'Not Urgent' },
            ]}
            value={task.urgency}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              handleChange('urgency', e.target.value)
            }
            required
            error={errors.find((e) => e.field === 'urgency')?.message}
            className="text-base py-2 px-3 h-10 sm:h-12"
          />
        </div>

        {/* Recurring Task Checkbox - larger touch target */}
        <label className="flex items-center gap-2 sm:gap-3 min-h-[36px] cursor-pointer select-none">
          <input
            type="checkbox"
            checked={task.isRecurring}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              handleChange('isRecurring', e.target.checked)
            }
            className="h-5 w-5 sm:h-4 sm:w-4 text-primary-600 focus:ring-primary-500 border-neutral-50 rounded"
          />
          <span className="text-sm text-neutral-900 text-left">
            This is a recurring task
          </span>
        </label>

        {/* Recurring Task Details */}
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
                errors.find((e) => e.field === 'recurringInterval')?.message
              }
              className="text-base py-2 px-3 h-10 sm:h-12"
            />

            {/* Weekly Recurring Days - better spacing for touch */}
            {task.recurringInterval === 'weekly' && (
              <div>
                <label className="block text-sm font-medium text-neutral-600 mb-1">
                  Recurring Days
                </label>
                <div className="flex flex-wrap gap-3">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(
                    (day, index) => (
                      <label key={day} className="inline-flex items-center">
                        <input
                          type="checkbox"
                          checked={task.recurringDays?.includes(index)}
                          onChange={(e: ChangeEvent<HTMLInputElement>) => {
                            const days = task.recurringDays || [];
                            const newDays = e.target.checked
                              ? [...days, index]
                              : days.filter((d) => d !== index);
                            handleChange('recurringDays', newDays);
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
                {errors.find((e) => e.field === 'recurringDays')?.message && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.find((e) => e.field === 'recurringDays')?.message}
                  </p>
                )}
              </div>
            )}

            {/* End Repeat Options - better spacing for touch */}
            <div>
              <label className="block text-sm font-medium text-neutral-600 mb-1">
                End Repeat
              </label>
              <div className="space-y-2 sm:space-y-1">
                {/* Never option */}
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={task.recurringEndType === 'never'}
                    onChange={() => handleChange('recurringEndType', 'never')}
                    className="h-4 w-4 sm:h-3 sm:w-3 text-primary-600 focus:ring-primary-500 border-neutral-50"
                  />
                  <span className="ml-2 text-sm sm:text-xs text-neutral-600">
                    Never
                  </span>
                </label>

                {/* After option with count input */}
                <div className="flex items-center">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={task.recurringEndType === 'after'}
                      onChange={() => handleChange('recurringEndType', 'after')}
                      className="h-4 w-4 sm:h-3 sm:w-3 text-primary-600 focus:ring-primary-500 border-neutral-50"
                    />
                    <span className="ml-2 text-sm sm:text-xs text-neutral-600">
                      After
                    </span>
                  </label>

                  {/* Count input - only enabled when 'after' is selected */}
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

        {/* Submit Button */}
        <div className="flex justify-center mt-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            variant="primary"
            className="w-full py-2 text-sm"
          >
            {isSubmitting ? 'Adding...' : 'Add Task'}
          </Button>
        </div>
        </div>
      </form>
    </div>
  );
}
