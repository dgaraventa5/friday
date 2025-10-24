import {
  CollectionReference,
  Firestore,
  collection,
  doc,
  query,
  where,
} from 'firebase/firestore';
import type { Task } from '../types/task';
import { db as sharedDb } from './firebase';

type TaskDocument = Task & { userId: string; ownerUid: string };

export const tasksCollection = (
  uid: string,
  database: Firestore = sharedDb,
): CollectionReference<TaskDocument> => {
  if (!uid) {
    throw new Error('Cannot create a tasks reference without a uid');
  }

  return collection(
    doc(collection(database, 'users'), uid),
    'tasks',
  ) as CollectionReference<TaskDocument>;
};

export const tasksQueryForUser = (
  uid: string,
  database: Firestore = sharedDb,
) => query(tasksCollection(uid, database), where('ownerUid', '==', uid));
