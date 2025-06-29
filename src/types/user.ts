import { User as FirebaseUser } from 'firebase/auth';
import { Category } from './task';

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous: boolean;
  emailVerified: boolean;
  providerId: string;
}

export interface UserPreferences {
  maxDailyTasks: number;
  categories: Category[];
  theme: 'light' | 'dark';
  notifications: boolean;
  defaultView?: string;
  notificationsEnabled?: boolean;
  emailNotifications?: boolean;
  defaultCategory?: string;
  [key: string]: unknown; // Allow for additional preference fields
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export const mapFirebaseUserToUser = (firebaseUser: FirebaseUser): User => {
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: firebaseUser.displayName,
    photoURL: firebaseUser.photoURL,
    isAnonymous: firebaseUser.isAnonymous,
    emailVerified: firebaseUser.emailVerified,
    providerId: firebaseUser.providerId || 'google.com',
  };
};
