import { useAuth } from '../context/AuthContext';
import { Button } from './Button';
import { LoadingSpinner } from './LoadingSpinner';
import { Settings, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { forceSyncFromFirestore } from '../utils/firestoreService';
import { Task } from '../types/task';

interface UserProfileProps {
  onOpenSettings?: () => void;
}

export function UserProfile({ onOpenSettings }: UserProfileProps) {
  const { authState, logout } = useAuth();
  const { user, loading } = authState;
  const { dispatch } = useApp();
  const [syncingData, setSyncingData] = useState(false);

  // Function to force sync data from Firestore
  const handleForceSync = async () => {
    if (!user) return;

    setSyncingData(true);
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      // Use the forceSyncFromFirestore function from firestoreService
      const tasks: Task[] = await forceSyncFromFirestore(user.uid);

      // Update state with server data
      dispatch({ type: 'SET_TASKS', payload: tasks });

      console.log(`[Force Sync] Synced ${tasks.length} tasks from server`);
      alert('Successfully synced tasks from server');
    } catch (error) {
      console.error('Error during force sync:', error);
      alert('Error syncing tasks. Please try again later.');
    } finally {
      setSyncingData(false);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  if (loading || syncingData) {
    return (
      <div className="flex justify-center items-center p-4">
        <LoadingSpinner size="sm" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center space-x-4">
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName || 'User'}
            className="w-12 h-12 rounded-full"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
            {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
          </div>
        )}
        <div className="flex-1">
          <h3 className="font-medium">{user.displayName || 'User'}</h3>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <Button
          onClick={handleForceSync}
          variant="secondary"
          className="w-full flex items-center justify-center"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Force Sync
        </Button>

        {onOpenSettings && (
          <Button
            onClick={onOpenSettings}
            variant="secondary"
            className="w-full flex items-center justify-center"
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        )}

        <Button onClick={logout} variant="secondary" className="w-full">
          Sign Out
        </Button>
      </div>
    </div>
  );
}
