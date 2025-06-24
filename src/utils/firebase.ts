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
console.log(
  'API Key value:',
  import.meta.env.VITE_FIREBASE_API_KEY
    ? 'First few chars: ' +
        import.meta.env.VITE_FIREBASE_API_KEY.substring(0, 5) +
        '...'
    : 'undefined',
);
console.log('Auth Domain exists:', !!import.meta.env.VITE_FIREBASE_AUTH_DOMAIN);
console.log('Auth Domain value:', import.meta.env.VITE_FIREBASE_AUTH_DOMAIN);
console.log('Project ID exists:', !!import.meta.env.VITE_FIREBASE_PROJECT_ID);
console.log('Project ID value:', import.meta.env.VITE_FIREBASE_PROJECT_ID);
console.log(
  'Storage Bucket exists:',
  !!import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
);
console.log(
  'Messaging Sender ID exists:',
  !!import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
);
console.log('App ID exists:', !!import.meta.env.VITE_FIREBASE_APP_ID);

// Helper function to strip quotes if they exist
const stripQuotes = (str: string | undefined): string | undefined => {
  if (!str) return str;
  return str.replace(/^["'](.*)["']$/, '$1');
};

// Your web app's Firebase configuration
// NOTE: Replace these with your actual Firebase config values from the Firebase console
const firebaseConfig = {
  apiKey: stripQuotes(import.meta.env.VITE_FIREBASE_API_KEY),
  // Always use the Firebase Auth Domain from environment variables
  authDomain: stripQuotes(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN),
  projectId: stripQuotes(import.meta.env.VITE_FIREBASE_PROJECT_ID),
  storageBucket: stripQuotes(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: stripQuotes(
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  ),
  appId: stripQuotes(import.meta.env.VITE_FIREBASE_APP_ID),
};

// Log the actual configuration being used
console.log('Firebase config being used:', {
  apiKey: firebaseConfig.apiKey
    ? 'First few chars: ' + firebaseConfig.apiKey.substring(0, 5) + '...'
    : 'undefined',
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
  messagingSenderId: firebaseConfig.messagingSenderId,
  appId: firebaseConfig.appId
    ? 'First few chars: ' + firebaseConfig.appId.substring(0, 5) + '...'
    : 'undefined',
});

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
