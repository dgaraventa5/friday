// Firebase configuration and authentication services
import { initializeApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
  Auth,
} from 'firebase/auth';

import logger from './logger';

if (import.meta.env.DEV) {
  logger.log('Firebase environment variables:', {
    hasApiKey: !!import.meta.env.VITE_FIREBASE_API_KEY,
    hasAuthDomain: !!import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    hasProjectId: !!import.meta.env.VITE_FIREBASE_PROJECT_ID,
    hasStorageBucket: !!import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    hasMessagingSenderId: !!import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    hasAppId: !!import.meta.env.VITE_FIREBASE_APP_ID,
  });
}

// Helper function to strip quotes if they exist
const stripQuotes = (str: string): string => {
  return str.replace(/^["'](.*)["']$/, '$1');
};

// Helper function to get environment variables with fallbacks
const isTestEnvironment =
  typeof process !== 'undefined' && process.env.NODE_ENV === 'test';

const getEnvVar = (key: string): string => {
  const metaEnv = typeof import.meta !== 'undefined' ? import.meta.env : undefined;
  const envVar = (metaEnv && metaEnv[key]) ||
    (typeof process !== 'undefined' ? process.env[key] : undefined);

  if (!envVar) {
    if (isTestEnvironment) {
      logger.warn(`Using placeholder Firebase config for ${key} in test environment`);
      return `test-${key.toLowerCase()}`;
    }

    logger.error(`Required environment variable ${key} is not defined`);
    throw new Error(`Missing Firebase configuration value for ${key}`);
  }

  return stripQuotes(String(envVar));
};

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: getEnvVar('VITE_FIREBASE_API_KEY'),
  authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnvVar('VITE_FIREBASE_APP_ID'),
};

if (import.meta.env.DEV) {
  logger.log('Firebase config being used:', {
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId,
    storageBucket: firebaseConfig.storageBucket,
  });
}

// Initialize Firebase
let app: FirebaseApp;
let auth: Auth;
let googleProvider: GoogleAuthProvider;

try {
  logger.log('[Firebase] Initializing Firebase app with config');
  app = initializeApp(firebaseConfig);
  logger.log('[Firebase] Firebase app initialized successfully');
  auth = getAuth(app);
  logger.log('[Firebase] Firebase auth initialized');
  googleProvider = new GoogleAuthProvider();

  // Configure Google provider for enhanced security
  googleProvider.setCustomParameters({
    prompt: 'select_account',
  });

  logger.log('[Firebase] Firebase setup complete');
} catch (error) {
  logger.error('[Firebase] Error initializing Firebase:', error);
  throw error;
}

// Sign in with Google popup
export const signInWithGoogle = async () => {
  try {
    logger.log('Starting Google sign-in with popup...');
    const result = await signInWithPopup(auth, googleProvider);
    logger.log('Sign-in successful');
    return result.user;
  } catch (error) {
    logger.error('Error signing in with Google:', error);
    throw error;
  }
};

// Sign out
export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    logger.error('Error signing out:', error);
    throw error;
  }
};

// Get current user
export const getCurrentUser = (): Promise<User | null> => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
};

// Reset user data for testing onboarding
export const resetUserData = (userId: string): void => {
  const userPrefix = `user_${userId}_`;

  // Get all localStorage keys
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith(userPrefix)) {
      localStorage.removeItem(key);
    }
  });

  logger.log(`Reset user data for user ID: ${userId}`);

  // Force reload to restart the app
  window.location.reload();
};

export { auth, app };
