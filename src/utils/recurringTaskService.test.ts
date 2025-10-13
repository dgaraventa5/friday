import {
  generateNextRecurringTask,
  handleRecurringTaskCompletion,
  hasReachedEndOfRecurrence,
  processRecurringTasks,
} from './recurringTaskService';
import { Task, Category } from '../types/task';
import { addDays, addMonths } from 'date-fns';
import { SCHEDULE_LOOKAHEAD_DAYS } from './scheduleConfig';
import { normalizeDate, getDateKey } from './dateUtils';

// Mock category for testing
const mockCategory: Category = {
  id: 'work',
  name: 'Work',
  color: '#3b82f6',
  dailyLimit: 2,
  icon: 'briefcase',
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
      
      // The next due date should be the next day in the recurringDays array
      // Since today is Thursday (index 4), the next day should be Monday (index 1)
      // which is 4 days later
      expect(nextTask?.dueDate).toEqual(addDays(weeklyTask.dueDate, 4));
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

  describe('processRecurringTasks', () => {
    it('generates weekly recurrences across the full schedule horizon without duplicates', () => {
      const baseDate = normalizeDate(new Date('2025-01-06')); // Monday
      const weeklyTask = createMockTask({
        id: 'weekly-task-id',
        name: 'Weekly Planning',
        recurringInterval: 'weekly',
        recurringDays: [baseDate.getDay()],
        dueDate: baseDate,
        startDate: baseDate,
        recurringEndType: 'never',
        recurringCurrentCount: undefined,
      });

      const processed = processRecurringTasks([weeklyTask], {
        referenceDate: baseDate,
      });

      const occurrences = processed.filter((task) => task.name === 'Weekly Planning');
      expect(occurrences.length).toBeGreaterThan(3);

      const threeWeeksOut = normalizeDate(addDays(baseDate, 21));
      const hasThirdWeek = occurrences.some(
        (task) => getDateKey(task.dueDate) === getDateKey(threeWeeksOut),
      );
      expect(hasThirdWeek).toBe(true);

      // Running the processor again should not create duplicates within the horizon
      const reprocessed = processRecurringTasks(processed, {
        referenceDate: baseDate,
        lookAheadDays: SCHEDULE_LOOKAHEAD_DAYS,
      });

      const occurrenceKeys = reprocessed
        .filter((task) => task.name === 'Weekly Planning')
        .map((task) => `${task.name}_${getDateKey(task.dueDate)}`);

      const uniqueKeys = new Set(occurrenceKeys);
      expect(uniqueKeys.size).toBe(occurrenceKeys.length);
    });

    it('assigns a stable series id to legacy weekly tasks before generating new instances', () => {
      const baseDate = normalizeDate(new Date('2025-02-03')); // Monday
      const legacyInstances: Task[] = Array.from({ length: 3 }).map((_, index) => {
        const dueDate = addDays(baseDate, index * 7);
        return createMockTask({
          id: `legacy-instance-${index}`,
          name: 'Legacy Workout',
          dueDate,
          startDate: dueDate,
          createdAt: addDays(dueDate, -2),
          updatedAt: addDays(dueDate, -2),
          recurringInterval: 'weekly',
          recurringDays: [dueDate.getDay()],
          recurringSeriesId: undefined,
        });
      });

      const processed = processRecurringTasks(legacyInstances, {
        referenceDate: baseDate,
      });

      const workoutTasks = processed.filter((task) => task.name === 'Legacy Workout');
      const seriesIds = new Set(
        workoutTasks.map((task) => task.recurringSeriesId).filter(Boolean),
      );

      expect(seriesIds.size).toBe(1);

      const occurrencesByDate = workoutTasks.reduce<Record<string, number>>(
        (acc, task) => {
          const key = getDateKey(task.dueDate);
          acc[key] = (acc[key] ?? 0) + 1;
          return acc;
        },
        {},
      );

      Object.values(occurrencesByDate).forEach((count) => {
        expect(count).toBe(1);
      });
    });

    it('keeps separate series ids for legacy tasks that share the same recurrence pattern', () => {
      const baseDate = normalizeDate(new Date('2025-03-10')); // Monday

      const makeLegacyTask = (offsetWeeks: number, suffix: string): Task => {
        const dueDate = addDays(baseDate, offsetWeeks * 7);
        return createMockTask({
          id: `${suffix}-${offsetWeeks}`,
          name: 'Morning Workout',
          dueDate,
          startDate: dueDate,
          createdAt: addDays(dueDate, -1),
          updatedAt: addDays(dueDate, -1),
          recurringInterval: 'weekly',
          recurringDays: [dueDate.getDay()],
          recurringSeriesId: undefined,
        });
      };

      const legacySeriesA = Array.from({ length: 2 }).map((_, index) =>
        makeLegacyTask(index, 'series-a'),
      );
      const legacySeriesB = Array.from({ length: 2 }).map((_, index) =>
        makeLegacyTask(index, 'series-b'),
      );

      const processed = processRecurringTasks(
        [...legacySeriesA, ...legacySeriesB],
        { referenceDate: baseDate },
      );

      const mondayKey = getDateKey(baseDate);
      const mondayOccurrences = processed.filter(
        (task) =>
          task.name === 'Morning Workout' && getDateKey(task.dueDate) === mondayKey,
      );

      const mondaySeriesIds = new Set(
        mondayOccurrences.map((task) => task.recurringSeriesId).filter(Boolean),
      );

      expect(mondaySeriesIds.size).toBe(2);
    });
  });
});
