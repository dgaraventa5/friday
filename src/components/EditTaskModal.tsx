// EditTaskModal.tsx
// Renders a modal for editing existing tasks. Handles form state, validation, and task updates.

import { useState, ChangeEvent, useEffect } from 'react';
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

export function EditTaskModal({ task, categories, onUpdateTask, onCancel, onDelete }: EditTaskModalProps) {
  // Local state for task fields, initialized with the existing task
  const [editedTask, setEditedTask] = useState<Task>({...task});

  // Validation errors
  const [errors, setErrors] = useState<ValidationError[]>([]);
  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle field changes and clear errors for that field
  const handleChange = (field: keyof Task, value: Task[keyof Task]) => {
    setEditedTask(prev => ({ ...prev, [field]: value }));
    setErrors(prev => prev.filter(error => error.field !== field));
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
    <div className="bg-[#f7f7f7] rounded-lg border border-neutral-50 shadow-card p-6 animate-slide-up font-sans">
      <form onSubmit={handleSubmit} className="space-y-6 w-full">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-neutral-900 font-sans">Edit Task</h3>
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
          onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange('name', e.target.value)}
          required
          error={errors.find(e => e.field === 'name')?.message}
          placeholder="What needs to be done?"
          className="text-lg py-3 px-4 h-14"
        />

        {/* Category Field */}
        <FormField
          label="Category"
          options={categories.map(cat => ({
            value: cat.id,
            label: cat.name,
          }))}
          value={editedTask.category?.id}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => 
            handleChange('category', categories.find(c => c.id === e.target.value))
          }
          required
          error={errors.find(e => e.field === 'category')?.message}
          className="text-lg py-3 px-4 h-14"
        />

        <div className="grid grid-cols-2 gap-6">
          {/* Due Date Field */}
          <FormField
            label="Due Date"
            type="date"
            value={new Date(editedTask.dueDate).toLocaleDateString('en-CA')}
            onChange={(e: ChangeEvent<HTMLInputElement>) => 
              handleChange('dueDate', new Date(e.target.value))
            }
            required
            error={errors.find(e => e.field === 'dueDate')?.message}
            className="text-lg py-3 px-4 h-14"
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
            error={errors.find(e => e.field === 'estimatedHours')?.message}
            className="text-lg py-3 px-4 h-14"
          />
        </div>

        <div className="grid grid-cols-2 gap-6">
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
            error={errors.find(e => e.field === 'importance')?.message}
            className="text-lg py-3 px-4 h-14"
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
            error={errors.find(e => e.field === 'urgency')?.message}
            className="text-lg py-3 px-4 h-14"
          />
        </div>

        {/* Recurring Task Checkbox */}
        <label className="flex items-center gap-4 min-h-[44px] cursor-pointer select-none">
          <input
            type="checkbox"
            checked={editedTask.isRecurring}
            onChange={(e: ChangeEvent<HTMLInputElement>) => 
              handleChange('isRecurring', e.target.checked)
            }
            className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-neutral-50 rounded"
          />
          <span className="text-sm text-neutral-900 font-sans text-left">This is a recurring task</span>
        </label>

        {/* Recurring Task Details */}
        {editedTask.isRecurring && (
          <div className="space-y-4">
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
              error={errors.find(e => e.field === 'recurringInterval')?.message}
              className="text-lg py-3 px-4 h-14"
            />
            
            {/* Weekly Recurring Days */}
            {editedTask.recurringInterval === 'weekly' && (
              <div>
                <label className="block text-sm font-medium text-neutral-600 mb-2 font-sans">
                  Recurring Days
                </label>
                <div className="flex flex-wrap gap-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                    <label key={day} className="inline-flex items-center">
                      <input
                        type="checkbox"
                        checked={editedTask.recurringDays?.includes(index)}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                          const days = editedTask.recurringDays || [];
                          const newDays = e.target.checked
                            ? [...days, index]
                            : days.filter(d => d !== index);
                          handleChange('recurringDays', newDays);
                        }}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-50 rounded"
                      />
                      <span className="ml-2 text-sm text-neutral-600 font-sans">{day}</span>
                    </label>
                  ))}
                </div>
                {errors.find(e => e.field === 'recurringDays')?.message && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.find(e => e.field === 'recurringDays')?.message}
                  </p>
                )}
              </div>
            )}
            
            {/* End Repeat Options */}
            <div>
              <label className="block text-sm font-medium text-neutral-600 mb-2 font-sans">
                End Repeat
              </label>
              <div className="space-y-2">
                {/* Never option */}
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={editedTask.recurringEndType === 'never' || !editedTask.recurringEndType}
                    onChange={() => handleChange('recurringEndType', 'never')}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-50"
                  />
                  <span className="ml-2 text-sm text-neutral-600 font-sans">Never</span>
                </label>
                
                {/* After option with count input */}
                <div className="flex items-center">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={editedTask.recurringEndType === 'after'}
                      onChange={() => handleChange('recurringEndType', 'after')}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-50"
                    />
                    <span className="ml-2 text-sm text-neutral-600 font-sans">After</span>
                  </label>
                  
                  {/* Count input - only enabled when 'after' is selected */}
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={editedTask.recurringEndCount || 1}
                    onChange={(e) => handleChange('recurringEndCount', parseInt(e.target.value, 10))}
                    disabled={editedTask.recurringEndType !== 'after'}
                    className="ml-2 w-16 h-8 border border-neutral-300 rounded text-sm px-2"
                  />
                  <span className="ml-2 text-sm text-neutral-600 font-sans">time(s)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-neutral-100 mt-4">
          {onDelete && (
            <Button
              type="button"
              onClick={handleDelete}
              variant="secondary"
              className="text-red-500 border-red-500 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            <Button
              type="button"
              onClick={onCancel}
              variant="secondary"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
} 