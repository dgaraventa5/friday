import { Timestamp } from 'firebase/firestore';
import { convertTimestamps, prepareForFirestore } from './firestoreTransforms';
import {
  MAX_BATCH_WRITE_OPERATIONS,
  TaskWriteOperation,
  commitTaskOperationsInChunks,
} from './firestoreBatching';
import type { Task, Category } from '../types/task';

describe('firestoreService timestamp and array handling', () => {
  it('keeps Firestore array fields intact when converting timestamps', () => {
    const now = new Date();
    const firestoreTask = {
      recurringDays: ['Monday', 'Wednesday'],
      dueDate: Timestamp.fromDate(now),
      history: [
        {
          completedAt: Timestamp.fromDate(now),
        },
      ],
    } as const;

    const converted = convertTimestamps(firestoreTask);

    expect(Array.isArray(converted.recurringDays)).toBe(true);
    expect(converted.recurringDays.includes('Monday')).toBe(true);
    expect(converted.dueDate).toBeInstanceOf(Date);
    expect(converted.history[0].completedAt).toBeInstanceOf(Date);
  });

  it('keeps arrays intact when preparing data for Firestore', () => {
    const task = {
      recurringDays: ['Tuesday', 'Thursday'],
      dueDate: new Date(),
      history: [
        {
          completedAt: new Date(),
        },
      ],
    };

    const prepared = prepareForFirestore(task);

    expect(Array.isArray(prepared.recurringDays)).toBe(true);
    expect(prepared.recurringDays.includes('Tuesday')).toBe(true);
    expect(prepared.dueDate).toBeInstanceOf(Timestamp);
    expect(prepared.history[0].completedAt).toBeInstanceOf(Timestamp);
  });
});

describe('commitTaskOperationsInChunks', () => {
  const baseCategory: Category = {
    id: 'cat',
    name: 'Category',
    color: '#000000',
    dailyLimit: 1,
    icon: 'icon',
  };

  const createTask = (index: number): Task => ({
    id: `task-${index}`,
    name: `Task ${index}`,
    category: baseCategory,
    importance: 'important',
    urgency: 'urgent',
    dueDate: new Date('2024-01-01T00:00:00.000Z'),
    estimatedHours: 1,
    completed: false,
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    startDate: new Date('2024-01-01T00:00:00.000Z'),
  });

  it('splits operations into multiple batches when exceeding Firestore limits', async () => {
    const operations: TaskWriteOperation[] = Array.from(
      { length: MAX_BATCH_WRITE_OPERATIONS + 100 },
      (_, index) => ({ type: 'set', task: createTask(index) }),
    );

    const batches: Array<{
      delete: jest.Mock;
      set: jest.Mock;
      commit: jest.Mock;
    }> = [];

    const createBatch = jest.fn(() => {
      const batch = {
        delete: jest.fn(),
        set: jest.fn(),
        commit: jest.fn().mockResolvedValue(undefined),
      };
      batches.push(batch);
      return batch;
    });

    await commitTaskOperationsInChunks(operations, {
      createBatch,
      getDeleteRef: (docId) => ({ docId }),
      getSetRef: (taskId) => ({ taskId }),
      toFirestoreTask: (task) => ({ task }),
    });

    expect(createBatch).toHaveBeenCalledTimes(2);
    expect(batches).toHaveLength(2);
    expect(batches[0].commit).toHaveBeenCalledTimes(1);
    expect(batches[1].commit).toHaveBeenCalledTimes(1);
    expect(batches[0].set.mock.calls).toHaveLength(MAX_BATCH_WRITE_OPERATIONS);
    expect(batches[1].set.mock.calls).toHaveLength(100);
  });
});
