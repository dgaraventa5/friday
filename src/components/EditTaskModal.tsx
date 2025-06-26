// EditTaskModal.tsx
// Renders a modal for editing existing tasks. Handles form state, validation, and task updates.

import { useState, ChangeEvent } from 'react';
import { X, Trash2 } from 'lucide-react';
import { Button } from './Button';
import { Task, Category } from '../types/task';
import { FormField } from './FormField';
import { validateTask, ValidationError } from '../utils/validation';

interface EditTaskModalProps {
  task: Task;
  categories: Category[];
  onUpdateTask: (updatedTask: Task) => void;
  onCancel: () => void;
  onDelete?: (taskId: string) => void;
}

export function EditTaskModal({
  task,
  categories,
  onUpdateTask,
  onCancel,
  onDelete,
}: EditTaskModalProps) {
  // Local state for task fields, initialized with the existing task
  const [editedTask, setEditedTask] = useState<Task>({ ...task });

  // Validation errors
  const [errors, setErrors] = useState<ValidationError[]>([]);
  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle field changes and clear errors for that field
  const handleChange = (field: keyof Task, value: Task[keyof Task]) => {
    setEditedTask((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => prev.filter((error) => error.field !== field));
  };

  // Handle form submit: validate, update Task, call onUpdateTask
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const validation = validateTask(editedTask);
    if (!validation.isValid) {
      setErrors(validation.errors);
      setIsSubmitting(false);
      return;
    }

    // Update the task with current timestamp
    const updatedTask: Task = {
      ...editedTask,
      updatedAt: new Date(),
    };

    onUpdateTask(updatedTask);
    setIsSubmitting(false);
  };

  // Handle delete task
  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      onDelete?.(task.id);
    }
  };

  return (
    <div className="bg-[#f7f7f7] rounded-lg border border-neutral-50 shadow-card p-4 animate-slide-up  max-h-[calc(100vh-48px)] overflow-y-auto">
      <form onSubmit={handleSubmit} className="space-y-3 w-full">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-bold text-neutral-900 ">
            Edit Task
          </h3>
          <Button
            type="button"
            onClick={onCancel}
            variant="secondary"
            icon
            aria-label="Cancel"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Task Name Field */}
        <FormField
          label="Task Name"
          type="text"
          value={editedTask.name}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            handleChange('name', e.target.value)
          }
          required
          error={errors.find((e) => e.field === 'name')?.message}
          placeholder="What needs to be done?"
          className="text-base py-2 px-3 h-12"
        />

        {/* Category Field */}
        <FormField
          label="Category"
          options={categories.map((cat) => ({
            value: cat.id,
            label: cat.name,
          }))}
          value={editedTask.category?.id}
          onChange={(e: ChangeEvent<HTMLSelectElement>) =>
            handleChange(
              'category',
              categories.find((c) => c.id === e.target.value),
            )
          }
          required
          error={errors.find((e) => e.field === 'category')?.message}
          className="text-base py-2 px-3 h-12"
        />

        <div className="grid grid-cols-2 gap-4">
          {/* Due Date Field */}
          <FormField
            label="Due Date"
            type="date"
            value={new Date(editedTask.dueDate).toLocaleDateString('en-CA')}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              handleChange('dueDate', new Date(e.target.value))
            }
            required
            error={errors.find((e) => e.field === 'dueDate')?.message}
            className="text-base py-2 px-3 h-12"
          />

          {/* Estimated Hours Field */}
          <FormField
            label="Estimated Hours"
            type="number"
            value={editedTask.estimatedHours}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              handleChange('estimatedHours', parseFloat(e.target.value))
            }
            min="0.25"
            max="24"
            step="0.25"
            required
            error={errors.find((e) => e.field === 'estimatedHours')?.message}
            className="text-base py-2 px-3 h-12"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Importance Field */}
          <FormField
            label="Importance"
            options={[
              { value: 'important', label: 'Important' },
              { value: 'not-important', label: 'Not Important' },
            ]}
            value={editedTask.importance}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              handleChange('importance', e.target.value)
            }
            required
            error={errors.find((e) => e.field === 'importance')?.message}
            className="text-base py-2 px-3 h-12"
          />

          {/* Urgency Field */}
          <FormField
            label="Urgency"
            options={[
              { value: 'urgent', label: 'Urgent' },
              { value: 'not-urgent', label: 'Not Urgent' },
            ]}
            value={editedTask.urgency}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              handleChange('urgency', e.target.value)
            }
            required
            error={errors.find((e) => e.field === 'urgency')?.message}
            className="text-base py-2 px-3 h-12"
          />
        </div>

        {/* Recurring Task Checkbox */}
        <label className="flex items-center gap-3 min-h-[36px] cursor-pointer select-none">
          <input
            type="checkbox"
            checked={editedTask.isRecurring}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              handleChange('isRecurring', e.target.checked)
            }
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-50 rounded"
          />
          <span className="text-sm text-neutral-900  text-left">
            This is a recurring task
          </span>
        </label>

        {/* Recurring Task Details */}
        {editedTask.isRecurring && (
          <div className="space-y-3">
            <FormField
              label="Recurring Interval"
              options={[
                { value: 'daily', label: 'Daily' },
                { value: 'weekly', label: 'Weekly' },
                { value: 'monthly', label: 'Monthly' },
              ]}
              value={editedTask.recurringInterval}
              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                handleChange('recurringInterval', e.target.value)
              }
              required
              error={
                errors.find((e) => e.field === 'recurringInterval')?.message
              }
              className="text-base py-2 px-3 h-12"
            />

            {/* Weekly Recurring Days */}
            {editedTask.recurringInterval === 'weekly' && (
              <div>
                <label className="block text-sm font-medium text-neutral-600 mb-1 ">
                  Recurring Days
                </label>
                <div className="flex flex-wrap gap-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(
                    (day, index) => (
                      <label key={day} className="inline-flex items-center">
                        <input
                          type="checkbox"
                          checked={editedTask.recurringDays?.includes(index)}
                          onChange={(e: ChangeEvent<HTMLInputElement>) => {
                            const days = editedTask.recurringDays || [];
                            const newDays = e.target.checked
                              ? [...days, index]
                              : days.filter((d) => d !== index);
                            handleChange('recurringDays', newDays);
                          }}
                          className="h-3 w-3 text-primary-600 focus:ring-primary-500 border-neutral-50 rounded"
                        />
                        <span className="ml-1 text-xs text-neutral-600 ">
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

            {/* End Repeat Options */}
            <div>
              <label className="block text-sm font-medium text-neutral-600 mb-1 ">
                End Repeat
              </label>
              <div className="space-y-1">
                {/* Never option */}
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={
                      editedTask.recurringEndType === 'never' ||
                      !editedTask.recurringEndType
                    }
                    onChange={() => handleChange('recurringEndType', 'never')}
                    className="h-3 w-3 text-primary-600 focus:ring-primary-500 border-neutral-50"
                  />
                  <span className="ml-2 text-xs text-neutral-600 ">
                    Never
                  </span>
                </label>

                {/* After option with count input */}
                <div className="flex items-center">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={editedTask.recurringEndType === 'after'}
                      onChange={() => handleChange('recurringEndType', 'after')}
                      className="h-3 w-3 text-primary-600 focus:ring-primary-500 border-neutral-50"
                    />
                    <span className="ml-2 text-xs text-neutral-600 ">
                      After
                    </span>
                  </label>

                  {/* Count input - only enabled when 'after' is selected */}
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={editedTask.recurringEndCount || 1}
                    onChange={(e) =>
                      handleChange(
                        'recurringEndCount',
                        parseInt(e.target.value, 10),
                      )
                    }
                    disabled={editedTask.recurringEndType !== 'after'}
                    className="ml-2 w-12 h-6 border border-neutral-300 rounded text-xs px-2"
                  />
                  <span className="ml-1 text-xs text-neutral-600 ">
                    time(s)
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between items-center mt-4">
          {/* Delete Button */}
          {onDelete && (
            <Button
              type="button"
              onClick={handleDelete}
              variant="secondary"
              className="py-2 text-sm text-red-500 border-red-500 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
          )}

          {/* Update Button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            variant="primary"
            className={`py-2 text-sm ${onDelete ? 'w-2/3' : 'w-full'}`}
          >
            {isSubmitting ? 'Updating...' : 'Update Task'}
          </Button>
        </div>
      </form>
    </div>
  );
}
