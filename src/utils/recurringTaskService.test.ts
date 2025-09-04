import { generateNextRecurringTask, handleRecurringTaskCompletion, hasReachedEndOfRecurrence } from './recurringTaskService';
import { Task, Category } from '../types/task';
import { addDays, addMonths } from 'date-fns';

// Mock category for testing
const mockCategory: Category = {
  id: 'work',
  name: 'Work',
  color: '#3b82f6',
  dailyLimit: 2,
  icon: 'briefcase'
};

// Helper to create a task for testing
function createMockTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'test-task-id',
    name: 'Test Task',
    category: mockCategory,
    importance: 'important',
    urgency: 'urgent',
    dueDate: new Date('2023-06-15'),
    estimatedHours: 1,
    completed: false,
    createdAt: new Date('2023-06-10'),
    updatedAt: new Date('2023-06-10'),
    isRecurring: true,
    recurringInterval: 'daily',
    startDate: new Date('2023-06-15'),
    recurringEndType: 'never',
    ...overrides
  };
}

describe('Recurring Task Service', () => {
  beforeEach(() => {
    // Mock crypto.randomUUID
    global.crypto = {
      ...global.crypto,
      randomUUID: () => 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'
    };
  });

  describe('hasReachedEndOfRecurrence', () => {
    it('should return false for non-recurring tasks', () => {
      const nonRecurringTask = createMockTask({ isRecurring: false });
      expect(hasReachedEndOfRecurrence(nonRecurringTask)).toBe(false);
    });

    it('should return false for tasks with no end type', () => {
      const task = createMockTask({ recurringEndType: undefined });
      expect(hasReachedEndOfRecurrence(task)).toBe(false);
    });

    it('should return false for tasks with "never" end type', () => {
      const task = createMockTask({ recurringEndType: 'never' });
      expect(hasReachedEndOfRecurrence(task)).toBe(false);
    });

    it('should return false for tasks with "after" end type but current count < end count', () => {
      const task = createMockTask({ 
        recurringEndType: 'after',
        recurringEndCount: 5,
        recurringCurrentCount: 3
      });
      expect(hasReachedEndOfRecurrence(task)).toBe(false);
    });

    it('should return true for tasks with "after" end type and current count >= end count', () => {
      const task = createMockTask({ 
        recurringEndType: 'after',
        recurringEndCount: 5,
        recurringCurrentCount: 5
      });
      expect(hasReachedEndOfRecurrence(task)).toBe(true);

      const exceededTask = createMockTask({ 
        recurringEndType: 'after',
        recurringEndCount: 5,
        recurringCurrentCount: 6
      });
      expect(hasReachedEndOfRecurrence(exceededTask)).toBe(true);
    });
  });

  describe('generateNextRecurringTask', () => {
    it('should throw an error for non-recurring tasks', () => {
      const nonRecurringTask = createMockTask({ isRecurring: false });
      expect(() => generateNextRecurringTask(nonRecurringTask)).toThrow();
    });

    it('should generate next daily task correctly', () => {
      const dailyTask = createMockTask({
        dueDate: new Date('2023-06-15'),
        recurringInterval: 'daily'
      });
      
      const nextTask = generateNextRecurringTask(dailyTask);
      
      expect(nextTask?.id).not.toBe(dailyTask.id);
      expect(nextTask?.dueDate).toEqual(addDays(dailyTask.dueDate, 1));
      expect(nextTask?.completed).toBe(false);
      expect(nextTask?.isRecurring).toBe(true);
      expect(nextTask?.recurringInterval).toBe('daily');
    });

    it('should generate next weekly task correctly', () => {
      const weeklyTask = createMockTask({
        dueDate: new Date('2023-06-15'), // A Thursday
        recurringInterval: 'weekly',
        recurringDays: [1, 4] // Monday and Thursday
      });

      const nextTask = generateNextRecurringTask(weeklyTask);

      const currentDay = weeklyTask.dueDate.getDay();
      const diffs = (weeklyTask.recurringDays || [])
        .map((day) => (day + 7 - currentDay) % 7)
        .filter((diff) => diff > 0);
      const daysToNext = diffs.length > 0 ? Math.min(...diffs) : 7;
      const expectedDate = addDays(weeklyTask.dueDate, daysToNext);

      expect(nextTask?.dueDate).toEqual(expectedDate);
    });

    it('should handle weekly tasks where the next occurrence is the same weekday next week', () => {
      const weeklyTask = createMockTask({
        dueDate: new Date('2023-06-12'), // A Monday
        recurringInterval: 'weekly',
        recurringDays: [1] // Only Monday
      });

      const nextTask = generateNextRecurringTask(weeklyTask);

      const currentDay = weeklyTask.dueDate.getDay();
      const diffs = (weeklyTask.recurringDays || [])
        .map((day) => (day + 7 - currentDay) % 7)
        .filter((diff) => diff > 0);
      const daysToNext = diffs.length > 0 ? Math.min(...diffs) : 7;
      const expectedDate = addDays(weeklyTask.dueDate, daysToNext);

      expect(nextTask?.dueDate).toEqual(expectedDate);
    });

    it('should generate next monthly task correctly', () => {
      const monthlyTask = createMockTask({
        dueDate: new Date('2023-06-15'),
        recurringInterval: 'monthly'
      });
      
      const nextTask = generateNextRecurringTask(monthlyTask);
      
      expect(nextTask?.dueDate).toEqual(addMonths(monthlyTask.dueDate, 1));
    });

    it('should increment the recurringCurrentCount for tasks with "after" end type', () => {
      const task = createMockTask({
        recurringEndType: 'after',
        recurringEndCount: 5,
        recurringCurrentCount: 2
      });
      
      const nextTask = generateNextRecurringTask(task);
      
      expect(nextTask?.recurringCurrentCount).toBe(3);
    });

    it('should return null for tasks that have reached their end count', () => {
      const task = createMockTask({
        recurringEndType: 'after',
        recurringEndCount: 5,
        recurringCurrentCount: 5
      });
      
      const nextTask = generateNextRecurringTask(task);
      
      expect(nextTask).toBeNull();
    });
  });

  describe('handleRecurringTaskCompletion', () => {
    it('should return null for non-recurring tasks', () => {
      const nonRecurringTask = createMockTask({ isRecurring: false });
      const result = handleRecurringTaskCompletion(nonRecurringTask);
      expect(result).toBeNull();
    });

    it('should generate next task instance for recurring tasks', () => {
      const recurringTask = createMockTask();
      const result = handleRecurringTaskCompletion(recurringTask);
      
      expect(result).not.toBeNull();
      expect(result?.dueDate).toEqual(addDays(recurringTask.dueDate, 1));
    });

    it('should return null for tasks that have reached their end count', () => {
      const task = createMockTask({
        recurringEndType: 'after',
        recurringEndCount: 3,
        recurringCurrentCount: 3
      });
      
      const result = handleRecurringTaskCompletion(task);
      
      expect(result).toBeNull();
    });
  });
}); 