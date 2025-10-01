import { Timestamp } from 'firebase/firestore';
import { convertTimestamps, prepareForFirestore } from './firestoreTransforms';

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
