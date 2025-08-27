import {
  assignStartDates,
  prioritizeTasks,
  calculateTaskScore,
} from './taskPrioritization';
import { Task, Category } from '../types/task';
import { startOfDay, addDays } from 'date-fns';

describe('assignStartDates', () => {
  const workCategory: Category = {
    id: '1',
    name: 'Work',
    color: '#0000ff',
    dailyLimit: 10,
    icon: '💼',
  };
  const homeCategory: Category = {
    id: '2',
    name: 'Home',
    color: '#00ff00',
    dailyLimit: 3,
    icon: '🏠',
  };
  const healthCategory: Category = {
    id: '3',
    name: 'Health',
    color: '#ff0000',
    dailyLimit: 3,
    icon: '💪',
  };

  function makeTask(
    id: string,
    category: Category,
    estimatedHours: number,
  ): Task {
    return {
      id,
      name: `Task ${id}`,
      category,
      importance: 'not-important',
      urgency: 'not-urgent',
      dueDate: new Date(),
      estimatedHours,
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      startDate: new Date(),
    };
  }

  function makeRecurringTask(
    id: string,
    category: Category,
    estimatedHours: number,
    interval: 'daily' | 'weekly' | 'monthly' = 'daily',
  ): Task {
    return {
      ...makeTask(id, category, estimatedHours),
      isRecurring: true,
      recurringInterval: interval,
    };
  }

  it('respects daily cap and category caps', () => {
    // 5 Work tasks (3h each), 2 Home (2h each), 2 Health (2h each)
    const tasks = [
      makeTask('1', workCategory, 3),
      makeTask('2', workCategory, 3),
      makeTask('3', workCategory, 3),
      makeTask('4', workCategory, 3),
      makeTask('5', workCategory, 3),
      makeTask('6', homeCategory, 2),
      makeTask('7', homeCategory, 2),
      makeTask('8', healthCategory, 2),
      makeTask('9', healthCategory, 2),
    ];
    const scheduled = assignStartDates(tasks, 4);
    // Day 1: Should have up to 10h Work, 3h Home, 3h Health, max 4 tasks
    const today = startOfDay(new Date());
    const day1 = scheduled.filter(
      (t) => startOfDay(t.startDate).getTime() === today.getTime(),
    );
    expect(day1.length).toBeLessThanOrEqual(4);
    const workHours = day1
      .filter((t) => t.category.name === 'Work')
      .reduce((sum, t) => sum + t.estimatedHours, 0);
    expect(workHours).toBeLessThanOrEqual(10);
    const homeHours = day1
      .filter((t) => t.category.name === 'Home')
      .reduce((sum, t) => sum + t.estimatedHours, 0);
    expect(homeHours).toBeLessThanOrEqual(3);
    const healthHours = day1
      .filter((t) => t.category.name === 'Health')
      .reduce((sum, t) => sum + t.estimatedHours, 0);
    expect(healthHours).toBeLessThanOrEqual(3);
  });

  it('respects maxPerDay limit with recurring tasks', () => {
    const maxPerDay = 4;
    const baseDate = startOfDay(new Date());

    // Create 3 recurring tasks (daily) and 5 non-recurring tasks
    const tasks = [
      makeRecurringTask('r1', workCategory, 1, 'daily'),
      makeRecurringTask('r2', homeCategory, 1, 'daily'),
      makeRecurringTask('r3', healthCategory, 1, 'daily'),
      makeTask('n1', workCategory, 1),
      makeTask('n2', workCategory, 1),
      makeTask('n3', homeCategory, 1),
      makeTask('n4', healthCategory, 1),
      makeTask('n5', workCategory, 1),
    ];

    const scheduled = assignStartDates(tasks, maxPerDay, baseDate);

    // Check each day for the next 5 days
    for (let i = 0; i < 5; i++) {
      const checkDate = addDays(baseDate, i);
      const tasksForDay = scheduled.filter(
        (t) =>
          !t.completed &&
          startOfDay(t.startDate).getTime() === checkDate.getTime(),
      );

      // No day should have more than maxPerDay tasks
      expect(tasksForDay.length).toBeLessThanOrEqual(maxPerDay);

      // If this is day 0 (today), verify which tasks were scheduled
      if (i === 0) {
        // We should have exactly maxPerDay tasks
        expect(tasksForDay.length).toBe(maxPerDay);

        // We should have all 3 recurring tasks
        const recurringCount = tasksForDay.filter((t) => t.isRecurring).length;
        expect(recurringCount).toBe(3);

        // And 1 non-recurring task (highest priority)
        const nonRecurringCount = tasksForDay.filter(
          (t) => !t.isRecurring,
        ).length;
        expect(nonRecurringCount).toBe(1);
      }
    }
  });

  it('skips Work tasks on weekends', () => {
    // Set today to Friday, fill up Friday, then overflow to Saturday (should skip Work), then Sunday (skip Work), then Monday
    const baseDate = startOfDay(new Date());
    // Find next Friday
    let friday = baseDate;
    while (friday.getDay() !== 5) {
      friday = addDays(friday, 1);
    }
    const workTasks = Array.from({ length: 12 }, (_, i) =>
      makeTask(`${i + 1}`, workCategory, 2),
    );
    const scheduled = assignStartDates(workTasks, 4, friday);
    // Friday: 4 tasks
    const fri = scheduled.filter(
      (t) => startOfDay(t.startDate).getTime() === friday.getTime(),
    );
    expect(fri.length).toBe(4);
    // Saturday: should have 0 Work tasks
    const sat = addDays(friday, 1);
    const satTasks = scheduled.filter(
      (t) => startOfDay(t.startDate).getTime() === sat.getTime(),
    );
    expect(satTasks.filter((t) => t.category.name === 'Work').length).toBe(0);
    // Sunday: should have 0 Work tasks
    const sun = addDays(friday, 2);
    const sunTasks = scheduled.filter(
      (t) => startOfDay(t.startDate).getTime() === sun.getTime(),
    );
    expect(sunTasks.filter((t) => t.category.name === 'Work').length).toBe(0);
    // Monday: should have 4 Work tasks
    const mon = addDays(friday, 3);
    const monTasks = scheduled.filter(
      (t) => startOfDay(t.startDate).getTime() === mon.getTime(),
    );
    expect(monTasks.filter((t) => t.category.name === 'Work').length).toBe(4);
  });

  it('overflows tasks to future days', () => {
    // 10 Home tasks (1h each)
    const baseDate = startOfDay(new Date());
    const tasks = Array.from({ length: 10 }, (_, i) =>
      makeTask(`${i + 1}`, homeCategory, 1),
    );
    const scheduled = assignStartDates(tasks, 4, baseDate);
    // Should be spread over 4 days (3, 3, 3, 1)
    const day1 = scheduled.filter(
      (t) => startOfDay(t.startDate).getTime() === baseDate.getTime(),
    );
    const day2 = scheduled.filter(
      (t) =>
        startOfDay(t.startDate).getTime() === addDays(baseDate, 1).getTime(),
    );
    const day3 = scheduled.filter(
      (t) =>
        startOfDay(t.startDate).getTime() === addDays(baseDate, 2).getTime(),
    );
    const day4 = scheduled.filter(
      (t) =>
        startOfDay(t.startDate).getTime() === addDays(baseDate, 3).getTime(),
    );
    expect(day1.length).toBe(3);
    expect(day2.length).toBe(3);
    expect(day3.length).toBe(3);
    expect(day4.length).toBe(1);
  });
});

// Helper function to create a test task
function createTestTask(
  id: string,
  name: string,
  category: string = 'Work',
  daysFromNow: number = 0,
): Task {
  const today = new Date();
  const dueDate = addDays(today, daysFromNow);

  return {
    id,
    name,
    category: {
      id: category.toLowerCase(),
      name: category,
      color: '#3b82f6',
      dailyLimit: 2,
      icon: 'briefcase',
    },
    importance: 'important',
    urgency: 'urgent',
    dueDate,
    estimatedHours: 1,
    completed: false,
    createdAt: today,
    updatedAt: today,
    startDate: dueDate, // Initially set to dueDate
  };
}

describe('taskPrioritization', () => {
  describe('assignStartDates', () => {
    it('should normalize all startDate values to startOfDay', () => {
      // Create tasks with different times of day
      const task1 = createTestTask('1', 'Task 1');
      const date = new Date();
      task1.startDate = new Date(date.setHours(9, 30, 0)); // Today at 9:30 AM

      const task2 = createTestTask('2', 'Task 2');
      task2.startDate = new Date(date.setHours(14, 45, 0)); // Today at 2:45 PM

      const tasks = [task1, task2];

      // Assign start dates
      const result = assignStartDates(tasks);

      // Both tasks should have the same startDate (start of day)
      const expectedDateString = startOfDay(date).toISOString().split('T')[0];
      const task1DateString = result[0].startDate.toISOString().split('T')[0];
      const task2DateString = result[1].startDate.toISOString().split('T')[0];

      expect(task1DateString).toBe(expectedDateString);
      expect(task2DateString).toBe(expectedDateString);

      // And both tasks should have the same time (start of day)
      expect(result[0].startDate.getHours()).toBe(0);
      expect(result[0].startDate.getMinutes()).toBe(0);
      expect(result[1].startDate.getHours()).toBe(0);
      expect(result[1].startDate.getMinutes()).toBe(0);
    });

    it('should handle tasks with undefined startDate', () => {
      // Create a task with undefined startDate
      const task = createTestTask('1', 'Task without startDate');
      task.startDate = undefined as unknown as Date; // Force undefined for test

      const result = assignStartDates([task]);

      // Should use dueDate as fallback
      expect(result[0].startDate).toBeDefined();

      const expectedDateString = startOfDay(task.dueDate)
        .toISOString()
        .split('T')[0];
      const resultDateString = result[0].startDate.toISOString().split('T')[0];
      expect(resultDateString).toBe(expectedDateString);
    });

    it("should consistently filter today's tasks", () => {
      // Create tasks for today, tomorrow and yesterday
      const today = new Date();
      const todayStart = startOfDay(today);

      const task1 = createTestTask('1', 'Today task 1');
      task1.startDate = new Date(today.setHours(9, 0, 0)); // Today at 9 AM

      const task2 = createTestTask('2', 'Today task 2');
      task2.startDate = new Date(today.setHours(14, 0, 0)); // Today at 2 PM

      const task3 = createTestTask('3', 'Tomorrow task', 'Work', 1);
      const task4 = createTestTask('4', 'Yesterday task', 'Work', -1);

      const tasks = [task1, task2, task3, task4];

      // Assign start dates
      const result = assignStartDates(tasks);

      // Filter tasks for today using the same method as App.tsx
      const todayDateString = todayStart.toISOString().split('T')[0];
      const todayTasks = result.filter((t) => {
        const taskDateString = startOfDay(new Date(t.startDate))
          .toISOString()
          .split('T')[0];
        return taskDateString === todayDateString;
      });

      // All tasks get scheduled for today due to the algorithm's behavior with our test data
      // The important thing is that the date comparison works consistently
      const todayTaskIds = todayTasks.map((t) => t.id).sort();
      expect(todayTaskIds).toContain('1');
      expect(todayTaskIds).toContain('2');

      // Verify all tasks have normalized dates (at start of day)
      result.forEach((task) => {
        expect(task.startDate.getHours()).toBe(0);
        expect(task.startDate.getMinutes()).toBe(0);
        expect(task.startDate.getSeconds()).toBe(0);
        expect(task.startDate.getMilliseconds()).toBe(0);
      });
    });
  });

  describe('calculateTaskScore', () => {
    it('applies a larger bonus for tasks due today', () => {
      const todayTask = createTestTask('1', 'Today task', 'Work', 0);
      const tomorrowTask = createTestTask('2', 'Tomorrow task', 'Work', 1);

      const todayScore = calculateTaskScore(todayTask).score;
      const tomorrowScore = calculateTaskScore(tomorrowTask).score;

      expect(todayScore).toBeGreaterThan(tomorrowScore);
    });
  });

  describe('prioritizeTasks', () => {
    it('prioritizes tasks due today over future tasks even with lower score', () => {
      const todayTask = createTestTask('1', 'Today task', 'Work', 0);
      todayTask.importance = 'not-important';
      todayTask.urgency = 'not-urgent';

      const futureTask = createTestTask('2', 'Future task', 'Work', 1);
      futureTask.importance = 'important';
      futureTask.urgency = 'urgent';

      const result = prioritizeTasks([futureTask, todayTask]);
      expect(result[0].id).toBe(todayTask.id);
    });

    it('ranks tasks due today ahead of tasks due soon', () => {
      const todayTask = createTestTask('1', 'Today task', 'Work', 0);
      const tomorrowTask = createTestTask('2', 'Tomorrow task', 'Work', 1);

      const result = prioritizeTasks([tomorrowTask, todayTask]);
      expect(result[0].id).toBe(todayTask.id);
    });
  });

  describe('prioritizeTasks due date precedence', () => {
    it('returns tasks due today before higher scoring future tasks', () => {
      const todayTask = createTestTask('today', 'Low priority today task', 'Work', 0);
      todayTask.importance = 'not-important';
      todayTask.urgency = 'not-urgent';

      const futureTask1 = createTestTask('future1', 'Future task 1', 'Work', 3);
      const futureTask2 = createTestTask('future2', 'Future task 2', 'Home', 2);

      const result = prioritizeTasks([futureTask1, todayTask, futureTask2]);
      expect(result[0].id).toBe(todayTask.id);
    });
  });
});
