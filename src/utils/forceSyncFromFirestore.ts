import { getDocs } from 'firebase/firestore';
import { Task } from '../types/task';
import {
  getFirestoreDb,
  convertTimestamps,
} from './firestoreService';
import { saveTasks, loadTasks } from './localStorage';
import logger from './logger';
import { tasksQueryForUser } from '../lib/tasksRef';

/**
 * Force syncs tasks from Firestore for a specific user
 * Includes duplicate detection to prevent duplicate tasks
 */
export async function forceSyncTasksFromFirestore(
  userId: string,
): Promise<Task[]> {
  logger.log('[Firestore] Force syncing tasks for user:', userId);

  try {
    const database = await getFirestoreDb();
    // Fetch the latest tasks from Firestore
    const querySnapshot = await getDocs(tasksQueryForUser(userId, database));

    logger.log(`[Firestore] Found ${querySnapshot.size} tasks from server`);

    // Process the results with duplicate detection
    const tasks: Task[] = [];
    const taskIds = new Set<string>(); // Track task IDs to prevent duplicates

    querySnapshot.forEach((document) => {
      const taskData = convertTimestamps(document.data());
      // Remove user identifiers as they're not part of the Task interface
      const {
        userId: taskUserId,
        ownerUid: taskOwnerUid,
        ...taskWithoutOwner
      } = taskData;
      void taskUserId;
      void taskOwnerUid;

      // Only add the task if we haven't seen this ID before
      if (!taskIds.has(taskWithoutOwner.id)) {
        taskIds.add(taskWithoutOwner.id);
        tasks.push(taskWithoutOwner as Task);
      } else {
        logger.warn(
          `[Firestore] Duplicate task ID detected: ${taskWithoutOwner.id}, skipping`,
        );
      }
    });

    logger.log(
      `[Firestore] Returning ${tasks.length} unique tasks (filtered from ${querySnapshot.size})`,
    );

    // Update local storage with the latest data
    const userPrefix = `user_${userId}_`;
    saveTasks(tasks, userPrefix);

    // Save a timestamp of last successful Firestore sync
    localStorage.setItem(
      `${userPrefix}last_firestore_sync`,
      new Date().toISOString(),
    );

    return tasks;
  } catch (error) {
    logger.error('[Firestore] Force sync failed:', error);

    // Fall back to local storage if Firestore fails
    const userPrefix = `user_${userId}_`;
    const localTasks = loadTasks(userPrefix);
    logger.log(`[Firestore] Falling back to ${localTasks.length} local tasks`);
    return localTasks;
  }
}
