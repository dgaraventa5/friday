// Firestore service for task management
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  writeBatch,
  Timestamp,
  DocumentData,
  enableIndexedDbPersistence,
  connectFirestoreEmulator,
  getDoc,
} from 'firebase/firestore';
import { app } from './firebase';
import { Task, Category, UserPreferences } from '../types/task';
import {
  saveTasks,
  loadTasks,
  saveCategories,
  loadCategories,
  savePreferences,
  loadPreferences,
} from './localStorage';

// Initialize Firestore
const db = getFirestore(app);

// Flag to track if Firestore is available
let isFirestoreAvailable = true;

// Enable offline persistence
try {
  console.log('[Firestore] Enabling offline persistence');
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn(
        '[Firestore] Multiple tabs open, persistence can only be enabled in one tab at a time.',
      );
    } else if (err.code === 'unimplemented') {
      console.warn(
        '[Firestore] The current browser does not support all features required for Firestore persistence.',
      );
    }
  });
} catch (error) {
  console.error('[Firestore] Error enabling persistence:', error);
}

// Use emulator in development if configured
if (
  import.meta.env.DEV &&
  import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true'
) {
  const host = import.meta.env.VITE_FIRESTORE_EMULATOR_HOST || 'localhost';
  const port = parseInt(
    import.meta.env.VITE_FIRESTORE_EMULATOR_PORT || '8080',
    10,
  );
  console.log(`[Firestore] Using emulator at ${host}:${port}`);
  connectFirestoreEmulator(db, host, port);
}

// Collection names
const COLLECTIONS = {
  TASKS: 'tasks',
  CATEGORIES: 'categories',
  PREFERENCES: 'preferences',
};

// Helper to convert Firestore timestamp to Date
const convertTimestamps = <T extends DocumentData>(obj: T): T => {
  if (!obj) return obj;

  // Use type assertion to avoid 'any' type
  const result: DocumentData = { ...obj };

  // Convert Timestamp objects to Date objects
  Object.keys(result).forEach((key) => {
    if (result[key] instanceof Timestamp) {
      result[key] = result[key].toDate();
    } else if (result[key] && typeof result[key] === 'object') {
      result[key] = convertTimestamps(result[key] as DocumentData);
    }
  });

  return result as T;
};

// Helper to prepare data for Firestore (handle Date objects)
const prepareForFirestore = <T>(obj: T): DocumentData => {
  if (!obj) return obj as unknown as DocumentData;

  const result = { ...obj } as DocumentData;

  // Convert Date objects to Firestore Timestamps
  Object.keys(result).forEach((key) => {
    if (result[key] instanceof Date) {
      result[key] = Timestamp.fromDate(result[key] as Date);
    } else if (
      result[key] &&
      typeof result[key] === 'object' &&
      !(result[key] instanceof Timestamp)
    ) {
      result[key] = prepareForFirestore(result[key]);
    }
  });

  return result;
};

// Save tasks to Firestore
export async function saveTasksToFirestore(
  userId: string,
  tasks: Task[],
): Promise<void> {
  try {
    if (!isFirestoreAvailable) {
      console.log('[Firestore] Falling back to localStorage for saving tasks');
      saveTasks(tasks, `user_${userId}_`);
      return;
    }

    console.log(`[Firestore] Saving ${tasks.length} tasks for user: ${userId}`);
    const batch = writeBatch(db);

    // Delete existing tasks first
    const tasksRef = collection(db, COLLECTIONS.TASKS);
    const q = query(tasksRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);

    querySnapshot.forEach((document) => {
      batch.delete(document.ref);
    });

    // Add all tasks
    tasks.forEach((task) => {
      const taskRef = doc(collection(db, COLLECTIONS.TASKS));
      const taskWithUser = {
        ...prepareForFirestore(task),
        userId,
      };
      batch.set(taskRef, taskWithUser);
    });

    await batch.commit();
    console.log(`[Firestore] Successfully saved ${tasks.length} tasks`);

    // Save a timestamp of last successful Firestore sync
    localStorage.setItem(
      `user_${userId}_last_firestore_sync`,
      new Date().toISOString(),
    );
  } catch (error) {
    console.error('Error saving tasks to Firestore:', error);
    isFirestoreAvailable = false;
    // Fallback to localStorage only if Firestore fails
    saveTasks(tasks, `user_${userId}_`);
  }
}

// Load tasks from Firestore
export async function loadTasksFromFirestore(userId: string): Promise<Task[]> {
  try {
    if (!isFirestoreAvailable) {
      console.log('[Firestore] Falling back to localStorage for loading tasks');
      return loadTasks(`user_${userId}_`);
    }

    console.log(`[Firestore] Loading tasks for user: ${userId}`);
    const tasksRef = collection(db, COLLECTIONS.TASKS);
    const q = query(tasksRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);

    console.log(`[Firestore] Found ${querySnapshot.size} tasks`);
    const tasks: Task[] = [];
    querySnapshot.forEach((document) => {
      const taskData = convertTimestamps(document.data());
      // Remove userId field as it's not part of the Task interface
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { userId: _taskUserId, ...taskWithoutUserId } = taskData;
      tasks.push(taskWithoutUserId as Task);
    });

    console.log(`[Firestore] Returning ${tasks.length} tasks`);

    // Update last sync timestamp
    localStorage.setItem(
      `user_${userId}_last_firestore_sync`,
      new Date().toISOString(),
    );

    // Only use localStorage as fallback if no tasks found in Firestore
    if (tasks.length === 0) {
      const localTasks = loadTasks(`user_${userId}_`);
      if (localTasks.length > 0) {
        console.log(
          `[Firestore] No tasks in Firestore, using ${localTasks.length} tasks from localStorage`,
        );

        // If we found tasks in localStorage but not in Firestore, save them to Firestore
        // This helps with cross-device synchronization
        saveTasksToFirestore(userId, localTasks).catch((err) =>
          console.error(
            '[Firestore] Error syncing local tasks to Firestore:',
            err,
          ),
        );

        return localTasks;
      }
    }

    return tasks;
  } catch (error) {
    console.error('Error loading tasks from Firestore:', error);
    isFirestoreAvailable = false;
    // Fallback to localStorage
    return loadTasks(`user_${userId}_`);
  }
}

// Save categories to Firestore
export async function saveCategoriesToFirestore(
  userId: string,
  categories: Category[],
): Promise<void> {
  try {
    if (!isFirestoreAvailable) {
      console.log(
        '[Firestore] Falling back to localStorage for saving categories',
      );
      saveCategories(categories, `user_${userId}_`);
      return;
    }

    console.log(
      `[Firestore] Saving ${categories.length} categories for user: ${userId}`,
    );

    // Save all categories in a single document
    const categoriesRef = doc(db, COLLECTIONS.CATEGORIES, userId);
    await setDoc(categoriesRef, {
      categories: categories.map(prepareForFirestore),
      userId,
    });

    console.log(
      `[Firestore] Successfully saved ${categories.length} categories`,
    );

    // Update last sync timestamp
    localStorage.setItem(
      `user_${userId}_categories_sync`,
      new Date().toISOString(),
    );
  } catch (error) {
    console.error('Error saving categories to Firestore:', error);
    isFirestoreAvailable = false;
    // Fallback to localStorage only if Firestore fails
    saveCategories(categories, `user_${userId}_`);
  }
}

// Load categories from Firestore
export async function loadCategoriesFromFirestore(
  userId: string,
): Promise<Category[]> {
  try {
    if (!isFirestoreAvailable) {
      console.log(
        '[Firestore] Falling back to localStorage for loading categories',
      );
      return loadCategories(`user_${userId}_`);
    }

    console.log(`[Firestore] Loading categories for user: ${userId}`);
    const categoriesRef = doc(db, COLLECTIONS.CATEGORIES, userId);
    const docSnap = await getDoc(categoriesRef);

    if (!docSnap.exists()) {
      console.log('[Firestore] No categories found');

      // Check if we have local categories to sync to Firestore
      const localCategories = loadCategories(`user_${userId}_`);
      if (localCategories.length > 0) {
        console.log(
          `[Firestore] Using ${localCategories.length} categories from localStorage`,
        );

        // Sync local categories to Firestore for cross-device access
        saveCategoriesToFirestore(userId, localCategories).catch((err) =>
          console.error(
            '[Firestore] Error syncing local categories to Firestore:',
            err,
          ),
        );

        return localCategories;
      }

      return [];
    }

    const data = docSnap.data();
    const categoriesData = data.categories || [];

    // Convert the categories array
    const categories: Category[] = Array.isArray(categoriesData)
      ? categoriesData.map(
          (category: DocumentData) => convertTimestamps(category) as Category,
        )
      : [];

    console.log(`[Firestore] Loaded ${categories.length} categories`);

    // Update last sync timestamp
    localStorage.setItem(
      `user_${userId}_categories_sync`,
      new Date().toISOString(),
    );

    return categories;
  } catch (error) {
    console.error('Error loading categories from Firestore:', error);
    isFirestoreAvailable = false;
    // Fallback to localStorage
    return loadCategories(`user_${userId}_`);
  }
}

// Save preferences to Firestore
export async function savePreferencesToFirestore(
  userId: string,
  preferences: UserPreferences,
): Promise<void> {
  try {
    if (!isFirestoreAvailable) {
      console.log(
        '[Firestore] Falling back to localStorage for saving preferences',
      );
      savePreferences(preferences, `user_${userId}_`);
      return;
    }

    console.log(`[Firestore] Saving preferences for user: ${userId}`);
    const userPreferencesRef = doc(db, COLLECTIONS.PREFERENCES, userId);
    await setDoc(userPreferencesRef, {
      ...prepareForFirestore(preferences),
      userId,
    });
    console.log('[Firestore] Preferences saved successfully');

    // Also save to localStorage as backup
    savePreferences(preferences, `user_${userId}_`);
  } catch (error) {
    console.error('Error saving preferences to Firestore:', error);
    isFirestoreAvailable = false;
    // Fallback to localStorage
    savePreferences(preferences, `user_${userId}_`);
  }
}

// Load preferences from Firestore
export async function loadPreferencesFromFirestore(
  userId: string,
): Promise<UserPreferences | null> {
  try {
    if (!isFirestoreAvailable) {
      console.log(
        '[Firestore] Falling back to localStorage for loading preferences',
      );
      return loadPreferences(`user_${userId}_`);
    }

    console.log(`[Firestore] Loading preferences for user: ${userId}`);
    const userPreferencesRef = doc(db, COLLECTIONS.PREFERENCES, userId);
    const docSnap = await getDoc(userPreferencesRef);

    if (!docSnap.exists()) {
      console.log('[Firestore] No preferences found');
      // Try localStorage
      const localPreferences = loadPreferences(`user_${userId}_`);
      if (localPreferences) {
        console.log('[Firestore] Using preferences from localStorage');
        return localPreferences;
      }
      return null;
    }

    const data = convertTimestamps(docSnap.data());
    console.log('[Firestore] Preferences found');
    // Remove userId field as it's not part of the UserPreferences interface
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { userId: _prefUserId, ...preferencesWithoutUserId } = data;
    return preferencesWithoutUserId as UserPreferences;
  } catch (error) {
    console.error('Error loading preferences from Firestore:', error);
    isFirestoreAvailable = false;
    // Fallback to localStorage
    return loadPreferences(`user_${userId}_`);
  }
}

// Save onboarding status to Firestore
export async function saveOnboardingStatusToFirestore(
  userId: string,
  completed: boolean,
): Promise<void> {
  try {
    if (!isFirestoreAvailable) {
      console.log(
        '[Firestore] Falling back to localStorage for saving onboarding status',
      );
      localStorage.setItem(
        `user_${userId}_onboarding_complete`,
        String(completed),
      );
      console.log(
        `[Firestore] Saved onboarding status to localStorage: ${completed}`,
      );
      return;
    }

    console.log(
      `[Firestore] Saving onboarding status for user: ${userId}, value: ${completed}`,
    );
    const userPreferencesRef = doc(db, COLLECTIONS.PREFERENCES, userId);
    await setDoc(
      userPreferencesRef,
      {
        onboarding_complete: completed,
        userId,
        last_updated: Timestamp.now(),
      },
      { merge: true },
    );
    console.log(
      '[Firestore] Onboarding status saved successfully to Firestore',
    );

    // Update sync timestamp in localStorage
    localStorage.setItem(
      `user_${userId}_onboarding_sync`,
      new Date().toISOString(),
    );

    // Keep a minimal copy in localStorage for quick access on page load
    localStorage.setItem(
      `user_${userId}_onboarding_complete`,
      String(completed),
    );
  } catch (error) {
    console.error('Error saving onboarding status to Firestore:', error);
    isFirestoreAvailable = false;
    // Fallback to localStorage
    localStorage.setItem(
      `user_${userId}_onboarding_complete`,
      String(completed),
    );
    console.log(
      `[Firestore] Fallback saved onboarding status to localStorage: ${completed}`,
    );
  }
}

// Load onboarding status from Firestore
export async function loadOnboardingStatusFromFirestore(
  userId: string,
): Promise<boolean> {
  try {
    if (!isFirestoreAvailable) {
      console.log(
        '[Firestore] Falling back to localStorage for loading onboarding status',
      );
      const localStatus =
        localStorage.getItem(`user_${userId}_onboarding_complete`) === 'true';
      console.log(`[Firestore] Local onboarding status: ${localStatus}`);
      return localStatus;
    }

    console.log(`[Firestore] Loading onboarding status for user: ${userId}`);
    const userPreferencesRef = doc(db, COLLECTIONS.PREFERENCES, userId);
    const docSnap = await getDoc(userPreferencesRef);

    if (!docSnap.exists()) {
      console.log(
        '[Firestore] No preferences document found, checking localStorage',
      );
      // Try localStorage
      const localOnboardingComplete =
        localStorage.getItem(`user_${userId}_onboarding_complete`) === 'true';
      console.log(
        `[Firestore] Using onboarding status from localStorage: ${localOnboardingComplete}`,
      );

      // If we have a local value, save it to Firestore for cross-device access
      if (localOnboardingComplete) {
        saveOnboardingStatusToFirestore(userId, localOnboardingComplete).catch(
          (err) =>
            console.error(
              '[Firestore] Error syncing local onboarding status to Firestore:',
              err,
            ),
        );
      }

      return localOnboardingComplete;
    }

    const data = docSnap.data();
    // Check if onboarding_complete exists and is a boolean
    if (data.onboarding_complete !== undefined) {
      const onboardingComplete = data.onboarding_complete === true;
      console.log(
        `[Firestore] Onboarding status found in preferences: ${onboardingComplete}`,
      );

      // Update local copy for quick access
      localStorage.setItem(
        `user_${userId}_onboarding_complete`,
        String(onboardingComplete),
      );
      localStorage.setItem(
        `user_${userId}_onboarding_sync`,
        new Date().toISOString(),
      );

      return onboardingComplete;
    } else {
      console.log(
        '[Firestore] No onboarding status in preferences, checking localStorage',
      );
      // If not in Firestore, try localStorage
      const localOnboardingComplete =
        localStorage.getItem(`user_${userId}_onboarding_complete`) === 'true';
      console.log(
        `[Firestore] Using onboarding status from localStorage: ${localOnboardingComplete}`,
      );

      // Sync to Firestore if we have a local value
      if (localOnboardingComplete) {
        saveOnboardingStatusToFirestore(userId, localOnboardingComplete).catch(
          (err) =>
            console.error(
              '[Firestore] Error syncing local onboarding status to Firestore:',
              err,
            ),
        );
      }

      return localOnboardingComplete;
    }
  } catch (error) {
    console.error('Error loading onboarding status from Firestore:', error);
    isFirestoreAvailable = false;
    // Fallback to localStorage
    const localStatus =
      localStorage.getItem(`user_${userId}_onboarding_complete`) === 'true';
    console.log(
      `[Firestore] Error fallback, using localStorage: ${localStatus}`,
    );
    return localStatus;
  }
}

// Migrate data from localStorage to Firestore
export async function migrateLocalStorageToFirestore(
  userId: string,
): Promise<void> {
  try {
    if (!isFirestoreAvailable) {
      console.log('[Firestore] Firestore not available, skipping migration');
      return;
    }

    console.log(`[Firestore] Starting migration for user: ${userId}`);
    const userPrefix = `user_${userId}_`;

    // Check if we've already migrated
    const migrationKey = `${userPrefix}migration_completed`;
    if (localStorage.getItem(migrationKey) === 'true') {
      console.log('[Firestore] Migration already completed for this user');
      return;
    }

    // Load data from localStorage
    const localTasks = JSON.parse(
      localStorage.getItem(`${userPrefix}friday_tasks`) || '[]',
    );
    const localCategories = JSON.parse(
      localStorage.getItem(`${userPrefix}friday_categories`) || '[]',
    );
    const localPreferences = JSON.parse(
      localStorage.getItem(`${userPrefix}friday_preferences`) || 'null',
    );
    const localOnboardingComplete =
      localStorage.getItem(`${userPrefix}onboarding_complete`) === 'true';

    console.log(`[Firestore] Found ${localTasks.length} tasks in localStorage`);
    console.log(
      `[Firestore] Found ${localCategories.length} categories in localStorage`,
    );
    console.log(
      `[Firestore] Found preferences in localStorage: ${!!localPreferences}`,
    );
    console.log(
      `[Firestore] Found onboarding status in localStorage: ${localOnboardingComplete}`,
    );

    // Convert date strings to Date objects in tasks
    const parsedTasks = localTasks.map((task: Record<string, unknown>) => ({
      ...task,
      dueDate: new Date(task.dueDate as string),
      createdAt: new Date(task.createdAt as string),
      updatedAt: new Date(task.updatedAt as string),
      completedAt: task.completedAt
        ? new Date(task.completedAt as string)
        : undefined,
      nextDueDate: task.nextDueDate
        ? new Date(task.nextDueDate as string)
        : undefined,
      startDate: new Date(task.startDate as string),
    }));

    // Save data to Firestore
    if (parsedTasks.length > 0) {
      console.log(
        `[Firestore] Saving ${parsedTasks.length} tasks to Firestore`,
      );
      await saveTasksToFirestore(userId, parsedTasks as Task[]);
    }

    if (localCategories.length > 0) {
      console.log(
        `[Firestore] Saving ${localCategories.length} categories to Firestore`,
      );
      await saveCategoriesToFirestore(userId, localCategories as Category[]);
    }

    if (localPreferences) {
      console.log('[Firestore] Saving preferences to Firestore');
      await savePreferencesToFirestore(
        userId,
        localPreferences as UserPreferences,
      );
    }

    console.log('[Firestore] Saving onboarding status to Firestore');
    await saveOnboardingStatusToFirestore(userId, localOnboardingComplete);

    // Mark migration as completed
    localStorage.setItem(migrationKey, 'true');

    console.log('[Firestore] Migration completed successfully');
  } catch (error) {
    console.error('[Firestore] Error during migration:', error);
    isFirestoreAvailable = false;
    // No need to throw, we'll just keep using localStorage
  }
}
