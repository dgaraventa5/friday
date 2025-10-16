import { collection, query, where, getDocs } from 'firebase/firestore';
import { Task } from '../types/task';
import {
  getFirestoreDb,
  COLLECTIONS,
  convertTimestamps,
} from './firestoreService';
import { saveTasks, loadTasks } from './localStorage';

/**
 * Force syncs tasks from Firestore for a specific user
 * Includes duplicate detection to prevent duplicate tasks
 */
export async function forceSyncTasksFromFirestore(
  userId: string,
): Promise<Task[]> {
  console.log('[Firestore] Force syncing tasks for user:', userId);

  try {
    const database = await getFirestoreDb();
    // Fetch the latest tasks from Firestore
    const tasksRef = collection(database, COLLECTIONS.TASKS);
    const q = query(tasksRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);

    console.log(`[Firestore] Found ${querySnapshot.size} tasks from server`);

    // Process the results with duplicate detection
    const tasks: Task[] = [];
    const taskIds = new Set<string>(); // Track task IDs to prevent duplicates

    querySnapshot.forEach((document) => {
      const taskData = convertTimestamps(document.data());
      // Remove userId field as it's not part of the Task interface
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { userId: _taskUserId, ...taskWithoutUserId } = taskData;

      // Only add the task if we haven't seen this ID before
      if (!taskIds.has(taskWithoutUserId.id)) {
        taskIds.add(taskWithoutUserId.id);
        tasks.push(taskWithoutUserId as Task);
      } else {
        console.warn(
          `[Firestore] Duplicate task ID detected: ${taskWithoutUserId.id}, skipping`,
        );
      }
    });

    console.log(
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
    console.error('[Firestore] Force sync failed:', error);

    // Fall back to local storage if Firestore fails
    const userPrefix = `user_${userId}_`;
    const localTasks = loadTasks(userPrefix);
    console.log(`[Firestore] Falling back to ${localTasks.length} local tasks`);
    return localTasks;
  }
}
