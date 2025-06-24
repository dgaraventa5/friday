// Firebase configuration and authentication services
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';

// Debug: Log environment variables
console.log('Firebase environment variables:');
console.log('API Key exists:', !!import.meta.env.VITE_FIREBASE_API_KEY);
console.log('Auth Domain exists:', !!import.meta.env.VITE_FIREBASE_AUTH_DOMAIN);
console.log('Project ID exists:', !!import.meta.env.VITE_FIREBASE_PROJECT_ID);
console.log(
  'Storage Bucket exists:',
  !!import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
);
console.log(
  'Messaging Sender ID exists:',
  !!import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
);
console.log('App ID exists:', !!import.meta.env.VITE_FIREBASE_APP_ID);

// Your web app's Firebase configuration
// NOTE: Replace these with your actual Firebase config values from the Firebase console
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  // Always use the Firebase Auth Domain from environment variables
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Log the actual configuration being used
console.log('Using authDomain:', firebaseConfig.authDomain);

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Configure Google provider for enhanced security
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Sign in with Google popup
export const signInWithGoogle = async () => {
  try {
    console.log('Starting Google sign-in with popup...');
    const result = await signInWithPopup(auth, googleProvider);
    console.log('Sign-in successful');
    return result.user;
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
};

// Sign out
export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
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

  console.log(`Reset user data for user ID: ${userId}`);

  // Force reload to restart the app
  window.location.reload();
};

export { auth };
