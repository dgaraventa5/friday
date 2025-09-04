import { assignStartDates } from './taskPrioritization';
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
      baseDate,
    );

    const tasksOnSep4 = result.filter(
      (t) => t.startDate && t.startDate.getTime() === baseDate.getTime(),
    );

    expect(tasksOnSep4).toHaveLength(1);
    expect(tasksOnSep4[0].dueDate.getTime()).toBe(baseDate.getTime());
  });
});
