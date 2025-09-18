import { assignStartDates, DEFAULT_CATEGORY_LIMITS } from './taskPrioritization';
import { Task } from '../types/task';
import { normalizeDate } from './dateUtils';

describe('assignStartDates with recurring tasks', () => {
  it('does not roll over unfinished recurring tasks to future days', () => {
    const baseDate = normalizeDate(new Date('2025-09-04')); // Thursday

    const recurringTaskSep3: Task = {
      id: '1',
      name: 'Work out',
      category: {
        id: '1',
        name: 'Health',
        color: 'blue',
        dailyLimit: 4,
        icon: '💪',
      },
      importance: 'important',
      urgency: 'urgent',
      dueDate: normalizeDate(new Date('2025-09-03')), // Wednesday
      startDate: normalizeDate(new Date('2025-09-03')),
      createdAt: normalizeDate(new Date('2025-09-01')),
      updatedAt: normalizeDate(new Date('2025-09-01')),
      isRecurring: true,
      recurringInterval: 'daily',
      completed: false,
      estimatedHours: 1,
    };

    const recurringTaskSep4: Task = {
      ...recurringTaskSep3,
      id: '2',
      dueDate: normalizeDate(new Date('2025-09-04')),
      startDate: normalizeDate(new Date('2025-09-04')),
    };

    const result = assignStartDates(
      [recurringTaskSep3, recurringTaskSep4],
      4,
      DEFAULT_CATEGORY_LIMITS,
      baseDate,
    );

    const tasksOnSep4 = result.filter(
      (t) => t.startDate && t.startDate.getTime() === baseDate.getTime(),
    );

    expect(tasksOnSep4).toHaveLength(1);
    expect(tasksOnSep4[0].dueDate.getTime()).toBe(baseDate.getTime());
  });
});

describe('assignStartDates category limits', () => {
  it('allows due tasks even when completed task hours meet the daily category limit', () => {
    const baseDate = normalizeDate(new Date('2025-09-04'));
    const homeCategory = {
      id: 'home',
      name: 'Home',
      color: 'green',
      dailyLimit: 4,
      icon: '🏠',
    };

    const completedHomeTask: Task = {
      id: '1',
      name: 'Completed home task',
      category: homeCategory,
      importance: 'important',
      urgency: 'urgent',
      dueDate: baseDate,
      startDate: baseDate,
      createdAt: baseDate,
      updatedAt: baseDate,
      completed: true,
      estimatedHours: 3,
    };

    const pendingHomeTask: Task = {
      id: '2',
      name: 'Pending home task',
      category: homeCategory,
      importance: 'important',
      urgency: 'urgent',
      dueDate: baseDate,
      startDate: baseDate,
      createdAt: baseDate,
      updatedAt: baseDate,
      completed: false,
      estimatedHours: 1,
    };

    const workCategory = {
      id: 'work',
      name: 'Work',
      color: 'blue',
      dailyLimit: 4,
      icon: '💼',
    };

    const workTask: Task = {
      id: '3',
      name: 'Work task',
      category: workCategory,
      importance: 'important',
      urgency: 'urgent',
      dueDate: baseDate,
      startDate: baseDate,
      createdAt: baseDate,
      updatedAt: baseDate,
      completed: false,
      estimatedHours: 1,
    };

    const result = assignStartDates(
      [completedHomeTask, pendingHomeTask, workTask],
      4,
      DEFAULT_CATEGORY_LIMITS,
      baseDate,
    );

    const scheduledPendingTask = result.find((t) => t.id === '2')!;
    expect(scheduledPendingTask.startDate.getTime()).toBe(
      baseDate.getTime(),
    );
  });
});

describe('assignStartDates due tasks vs future high priority tasks', () => {
  it('prioritizes tasks due on the current day before higher-scoring future tasks', () => {
    const baseDate = normalizeDate(new Date('2025-09-01')); // Monday
    const tomorrowDate = new Date(baseDate);
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const normalizedTomorrow = normalizeDate(tomorrowDate);
    const dayAfterTomorrowDate = new Date(baseDate);
    dayAfterTomorrowDate.setDate(dayAfterTomorrowDate.getDate() + 2);
    const normalizedDayAfterTomorrow = normalizeDate(dayAfterTomorrowDate);
    const nextWeekDate = new Date(baseDate);
    nextWeekDate.setDate(nextWeekDate.getDate() + 7);
    const normalizedNextWeek = normalizeDate(nextWeekDate);

    const workCategory = {
      id: 'work',
      name: 'Work',
      color: 'blue',
      dailyLimit: 4,
      icon: '💼',
    };

    const completedBlocker: Task = {
      id: 'completed-blocker',
      name: 'Completed task',
      category: workCategory,
      importance: 'important',
      urgency: 'urgent',
      dueDate: baseDate,
      startDate: baseDate,
      createdAt: baseDate,
      updatedAt: baseDate,
      completed: true,
      estimatedHours: 1,
    };

    const lowImportanceDueTomorrow: Task = {
      id: 'low-tomorrow',
      name: 'Low importance due tomorrow',
      category: workCategory,
      importance: 'not-important',
      urgency: 'not-urgent',
      dueDate: normalizedTomorrow,
      startDate: normalizedTomorrow,
      createdAt: baseDate,
      updatedAt: baseDate,
      completed: false,
      estimatedHours: 1,
    };

    const highImportanceNextWeek: Task = {
      id: 'high-next-week',
      name: 'High importance due next week',
      category: workCategory,
      importance: 'important',
      urgency: 'urgent',
      dueDate: normalizedNextWeek,
      startDate: normalizedNextWeek,
      createdAt: baseDate,
      updatedAt: baseDate,
      completed: false,
      estimatedHours: 1,
    };

    const result = assignStartDates(
      [completedBlocker, lowImportanceDueTomorrow, highImportanceNextWeek],
      1,
      DEFAULT_CATEGORY_LIMITS,
      baseDate,
    );

    const lowAssignment = result.find((t) => t.id === 'low-tomorrow')!;
    const highAssignment = result.find((t) => t.id === 'high-next-week')!;

    expect(lowAssignment.startDate.getTime()).toBe(
      normalizedTomorrow.getTime(),
    );
    expect(highAssignment.startDate.getTime()).toBe(
      normalizedDayAfterTomorrow.getTime(),
    );
    expect(lowAssignment.startDate.getTime()).toBeLessThan(
      highAssignment.startDate.getTime(),
    );
  });
});
