import {
  assignStartDates,
  DEFAULT_CATEGORY_LIMITS,
  checkCategoryLimits,
  normalizeCategoryLimits,
} from './taskPrioritization';
import { Category, Task } from '../types/task';
import { getDateKey, normalizeDate } from './dateUtils';
import { processRecurringTasks } from './recurringTaskService';
import { SCHEDULE_LOOKAHEAD_DAYS } from './scheduleConfig';
import { addDays } from 'date-fns';

beforeAll(() => {
  (global as any).crypto = {
    ...((global as any).crypto || {}),
    randomUUID: () => 'test-uuid',
  };
});

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

describe('assignStartDates schedule horizon', () => {
  it('surfaces weekly recurring tasks beyond two weeks in the full schedule', () => {
    const baseDate = normalizeDate(new Date('2025-01-06')); // Monday
    const weeklyCategory = {
      id: 'weekly',
      name: 'Work',
      color: 'blue',
      dailyLimit: 4,
      icon: '💼',
    };

    const weeklyTask: Task = {
      id: 'weekly-1',
      name: 'Weekly Review',
      category: weeklyCategory,
      importance: 'important',
      urgency: 'urgent',
      dueDate: baseDate,
      startDate: baseDate,
      createdAt: baseDate,
      updatedAt: baseDate,
      completed: false,
      estimatedHours: 1,
      isRecurring: true,
      recurringInterval: 'weekly',
      recurringDays: [baseDate.getDay()],
      recurringEndType: 'never',
    };

    const processedTasks = processRecurringTasks([weeklyTask], {
      referenceDate: baseDate,
      lookAheadDays: SCHEDULE_LOOKAHEAD_DAYS,
    });

    const scheduled = assignStartDates(
      processedTasks,
      4,
      DEFAULT_CATEGORY_LIMITS,
      baseDate,
    );

    const thirdWeekDate = normalizeDate(addDays(baseDate, 21));
    const thirdWeekOccurrences = scheduled.filter(
      (task) =>
        task.name === 'Weekly Review' &&
        task.startDate &&
        task.startDate.getTime() === thirdWeekDate.getTime(),
    );

    expect(thirdWeekOccurrences).toHaveLength(1);
    expect(thirdWeekOccurrences[0].dueDate.getTime()).toBe(
      thirdWeekDate.getTime(),
    );
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

describe('checkCategoryLimits', () => {
  const category = {
    id: 'work',
    name: 'Work',
    color: '#000000',
    dailyLimit: 2,
    icon: 'briefcase',
  } as const;

  const createTask = (id: string, date: Date): Task => ({
    id,
    name: `Task ${id}`,
    category,
    importance: 'important',
    urgency: 'urgent',
    dueDate: date,
    startDate: date,
    createdAt: date,
    updatedAt: date,
    completed: false,
    estimatedHours: 1,
  });

  it('blocks additional tasks due today when the category limit is reached', () => {
    const today = normalizeDate(new Date());

    const tasks: Task[] = [createTask('1', today), createTask('2', today)];
    const newTask = createTask('3', today);

    const result = checkCategoryLimits(tasks, newTask);

    expect(result.allowed).toBe(false);
    expect(result.message).toContain("daily limit");
  });

  it('allows tasks scheduled for future dates even when today has reached the limit', () => {
    const today = normalizeDate(new Date());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const normalizedTomorrow = normalizeDate(tomorrow);

    const tasks: Task[] = [createTask('1', today), createTask('2', today)];
    const futureTask = createTask('3', normalizedTomorrow);

    const result = checkCategoryLimits(tasks, futureTask);

    expect(result.allowed).toBe(true);
    expect(result.message).toBeUndefined();
  });

  it('allows future due dates even when the start date is today', () => {
    const today = normalizeDate(new Date());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const normalizedTomorrow = normalizeDate(tomorrow);

    const tasks: Task[] = [createTask('1', today), createTask('2', today)];
    const futureTaskWithTodayStart: Task = {
      ...createTask('3', today),
      dueDate: normalizedTomorrow,
    };

    const result = checkCategoryLimits(tasks, futureTaskWithTodayStart);

    expect(result.allowed).toBe(true);
    expect(result.message).toBeUndefined();
    expect(futureTaskWithTodayStart.startDate?.getTime()).toBe(today.getTime());
    expect(futureTaskWithTodayStart.dueDate.getTime()).toBe(
      normalizedTomorrow.getTime(),
    );
  });
});

describe('assignStartDates category limits', () => {
  const baseCategory: Category = {
    id: 'home',
    name: 'Home',
    color: '#00ff00',
    icon: 'home',
    dailyLimit: 3,
  };

  const buildTask = (id: string, dueDate: Date, estimatedHours = 1): Task => ({
    id,
    name: `Task ${id}`,
    category: baseCategory,
    importance: 'important',
    urgency: 'urgent',
    dueDate,
    startDate: dueDate,
    createdAt: dueDate,
    updatedAt: dueDate,
    completed: false,
    estimatedHours,
  });

  it('respects weekend hour limits for future tasks', () => {
    const saturday = normalizeDate(new Date('2025-01-04T12:00:00Z'));
    const sunday = normalizeDate(new Date('2025-01-05T12:00:00Z'));
    const monday = normalizeDate(new Date('2025-01-06T12:00:00Z'));

    const tasks: Task[] = [
      buildTask('1', monday),
      buildTask('2', monday),
      buildTask('3', monday),
    ];

    const customLimits = {
      ...DEFAULT_CATEGORY_LIMITS,
      Home: { weekdayMax: 5, weekendMax: 1 },
    };

    const assigned = assignStartDates(tasks, 4, customLimits, saturday);

    const weekendAssignments = assigned.filter((task) => {
      const key = getDateKey(task.startDate);
      return key === getDateKey(saturday) || key === getDateKey(sunday);
    });

    const hoursByDay = weekendAssignments.reduce<Record<string, number>>(
      (acc, task) => {
        const key = getDateKey(task.startDate);
        acc[key] = (acc[key] || 0) + (task.estimatedHours || 1);
        return acc;
      },
      {},
    );

    expect(hoursByDay[getDateKey(saturday)] || 0).toBeLessThanOrEqual(1);
    expect(hoursByDay[getDateKey(sunday)] || 0).toBeLessThanOrEqual(1);
  });

  it('uses weekday limits on weekdays', () => {
    const monday = normalizeDate(new Date('2025-01-06T12:00:00Z'));
    const tuesday = normalizeDate(new Date('2025-01-07T12:00:00Z'));

    const tasks: Task[] = [
      buildTask('weekday-1', tuesday),
      buildTask('weekday-2', tuesday),
      buildTask('weekday-3', tuesday),
    ];

    const customLimits = {
      ...DEFAULT_CATEGORY_LIMITS,
      Home: { weekdayMax: 2, weekendMax: 0 },
    };

    const assigned = assignStartDates(tasks, 4, customLimits, monday);

    const mondayAssignments = assigned.filter(
      (task) => getDateKey(task.startDate) === getDateKey(monday),
    );

    const totalMondayHours = mondayAssignments.reduce(
      (sum, task) => sum + (task.estimatedHours || 1),
      0,
    );

    expect(totalMondayHours).toBeLessThanOrEqual(2);
    expect(totalMondayHours).toBeGreaterThan(0);
  });

  it('applies custom weekend limits from preferences', () => {
    const saturday = normalizeDate(new Date('2025-01-04T12:00:00Z'));
    const monday = normalizeDate(new Date('2025-01-06T12:00:00Z'));

    const tasks: Task[] = Array.from({ length: 7 }, (_, index) =>
      buildTask(`custom-${index}`, monday),
    );

    const customLimits = {
      ...DEFAULT_CATEGORY_LIMITS,
      Home: { weekdayMax: 4, weekendMax: 5 },
    };

    const assigned = assignStartDates(tasks, 10, customLimits, saturday);

    const saturdayHours = assigned
      .filter((task) => getDateKey(task.startDate) === getDateKey(saturday))
      .reduce((sum, task) => sum + (task.estimatedHours || 1), 0);

    expect(saturdayHours).toBe(5);
  });

  it('parses numeric string limits from persisted data', () => {
    const normalized = normalizeCategoryLimits({
      Home: {
        weekdayMax: '6' as unknown as number,
        weekendMax: '2' as unknown as number,
      },
    });

    expect(normalized.Home.weekdayMax).toBe(6);
    expect(normalized.Home.weekendMax).toBe(2);
  });
});
