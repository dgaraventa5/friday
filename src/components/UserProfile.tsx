import { useAuth } from '../context/AuthContext';
import { Button } from './Button';
import { LoadingSpinner } from './LoadingSpinner';
import { Settings } from 'lucide-react';

interface UserProfileProps {
  onOpenSettings?: () => void;
}

export function UserProfile({ onOpenSettings }: UserProfileProps) {
  const { authState, logout } = useAuth();
  const { user, loading } = authState;

  if (loading) {
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
        <Button 
          onClick={logout} 
          variant="secondary"
          className="w-full"
        >
          Sign Out
        </Button>
      </div>
    </div>
  );
} 