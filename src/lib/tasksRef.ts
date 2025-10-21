import {
  CollectionReference,
  Firestore,
  collection,
  query,
  where,
} from 'firebase/firestore';
import type { Task } from '../types/task';

type TaskWithUserId = Task & { userId: string };

export const tasksCollection = (
  db: Firestore,
  uid: string,
): CollectionReference<TaskWithUserId> => {
  if (!uid) {
    throw new Error('Cannot create a tasks reference without a uid');
  }

  return collection(db, 'tasks') as CollectionReference<TaskWithUserId>;
};

export const tasksQueryForUser = (db: Firestore, uid: string) =>
  query(tasksCollection(db, uid), where('userId', '==', uid));
