import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, signInWithGoogle, logoutUser } from '../utils/firebase';
import { User, AuthState, mapFirebaseUserToUser } from '../types/user';

// Create the context with default values
interface AuthContextType {
  authState: AuthState;
  signIn: () => Promise<User | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setAuthState({
          user: user ? mapFirebaseUserToUser(user) : null,
          loading: false,
          error: null,
        });
      },
      (error) => {
        console.error('Auth state change error:', error);
        setAuthState({
          user: null,
          loading: false,
          error: error.message,
        });
      }
    );

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  // Sign in with Google
  const signIn = async (): Promise<User | null> => {
    try {
      setAuthState((prev) => ({ ...prev, loading: true, error: null }));
      const firebaseUser = await signInWithGoogle();
      if (firebaseUser) {
        const user = mapFirebaseUserToUser(firebaseUser);
        setAuthState({
          user,
          loading: false,
          error: null,
        });
        return user;
      }
      return null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during sign-in';
      setAuthState({
        user: null,
        loading: false,
        error: errorMessage,
      });
      return null;
    }
  };

  // Logout
  const logout = async (): Promise<void> => {
    try {
      setAuthState((prev) => ({ ...prev, loading: true }));
      await logoutUser();
      setAuthState({
        user: null,
        loading: false,
        error: null,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during logout';
      setAuthState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
    }
  };

  return (
    <AuthContext.Provider value={{ authState, signIn, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 