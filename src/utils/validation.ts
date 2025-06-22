import { Task, Category } from '../types/task';

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Task validation rules
export function validateTask(task: Partial<Task>): ValidationResult {
  const errors: ValidationError[] = [];

  // Name validation
  if (!task.name) {
    errors.push({ field: 'name', message: 'Task name is required' });
  } else if (task.name.length < 3) {
    errors.push({ field: 'name', message: 'Task name must be at least 3 characters' });
  } else if (task.name.length > 100) {
    errors.push({ field: 'name', message: 'Task name must be less than 100 characters' });
  }

  // Category validation
  if (!task.category) {
    errors.push({ field: 'category', message: 'Category is required' });
  }

  // Due date validation
  if (!task.dueDate) {
    errors.push({ field: 'dueDate', message: 'Due date is required' });
  } else {
    const dueDate = new Date(task.dueDate);
    if (isNaN(dueDate.getTime())) {
      errors.push({ field: 'dueDate', message: 'Invalid due date' });
    }
  }

  // Estimated hours validation
  if (task.estimatedHours === undefined || task.estimatedHours === null) {
    errors.push({ field: 'estimatedHours', message: 'Estimated hours is required' });
  } else if (task.estimatedHours < 0.25) {
    errors.push({ field: 'estimatedHours', message: 'Estimated hours must be at least 15 minutes' });
  } else if (task.estimatedHours > 24) {
    errors.push({ field: 'estimatedHours', message: 'Estimated hours cannot exceed 24 hours' });
  }

  // Importance and urgency validation
  if (!task.importance) {
    errors.push({ field: 'importance', message: 'Importance level is required' });
  }
  if (!task.urgency) {
    errors.push({ field: 'urgency', message: 'Urgency level is required' });
  }

  // Recurring task validation
  if (task.isRecurring) {
    if (!task.recurringInterval) {
      errors.push({ field: 'recurringInterval', message: 'Recurring interval is required for recurring tasks' });
    }
    if (task.recurringInterval === 'weekly' && (!task.recurringDays || task.recurringDays.length === 0)) {
      errors.push({ field: 'recurringDays', message: 'Recurring days are required for weekly tasks' });
    }
    
    // End repeat validation
    if (task.recurringEndType === 'after') {
      if (!task.recurringEndCount) {
        errors.push({ field: 'recurringEndCount', message: 'Number of occurrences is required' });
      } else if (task.recurringEndCount < 1) {
        errors.push({ field: 'recurringEndCount', message: 'Number of occurrences must be at least 1' });
      } else if (task.recurringEndCount > 100) {
        errors.push({ field: 'recurringEndCount', message: 'Number of occurrences cannot exceed 100' });
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Category validation rules
export function validateCategory(category: Partial<Category>): ValidationResult {
  const errors: ValidationError[] = [];

  // Name validation
  if (!category.name) {
    errors.push({ field: 'name', message: 'Category name is required' });
  } else if (category.name.length < 2) {
    errors.push({ field: 'name', message: 'Category name must be at least 2 characters' });
  } else if (category.name.length > 50) {
    errors.push({ field: 'name', message: 'Category name must be less than 50 characters' });
  }

  // Color validation
  if (!category.color) {
    errors.push({ field: 'color', message: 'Color is required' });
  } else if (!/^#[0-9A-F]{6}$/i.test(category.color)) {
    errors.push({ field: 'color', message: 'Invalid color format. Use hex color (e.g., #FF0000)' });
  }

  // Daily limit validation
  if (category.dailyLimit === undefined || category.dailyLimit === null) {
    errors.push({ field: 'dailyLimit', message: 'Daily limit is required' });
  } else if (category.dailyLimit < 1) {
    errors.push({ field: 'dailyLimit', message: 'Daily limit must be at least 1' });
  } else if (category.dailyLimit > 20) {
    errors.push({ field: 'dailyLimit', message: 'Daily limit cannot exceed 20' });
  }

  // Icon validation
  if (!category.icon) {
    errors.push({ field: 'icon', message: 'Icon is required' });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Helper function to get error message for a specific field
export function getFieldError(field: string, errors: ValidationError[]): string | undefined {
  return errors.find(error => error.field === field)?.message;
} 