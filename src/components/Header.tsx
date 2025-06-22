// Header.tsx
// App header: shows app name, date, progress circle for Today's Focus, and settings button.

import { Calendar, RefreshCw, User } from 'lucide-react';
import { format } from 'date-fns';
import { ProgressCircle } from './ProgressCircle';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserProfile } from './UserProfile';

interface HeaderProps {
  onOpenSettings: () => void;
  todayTaskCount: number;
  totalTaskCount: number;
  todayTasksCompleted: number;
  onProcessRecurring?: () => void;
}

export function Header({ 
  onOpenSettings,
  todayTaskCount,
  todayTasksCompleted,
  onProcessRecurring
}: HeaderProps) {
  // Get today's date and day name
  const today = new Date();
  const dayName = format(today, 'EEEE');
  const dateStr = format(today, 'MMMM d, yyyy');
  const [showUserProfile, setShowUserProfile] = useState(false);
  const { authState } = useAuth();
  const { user } = authState;

  return (
    <header
      className="bg-white border-b border-neutral-50 px-4 md:px-6 py-4 font-sans"
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)',
      }}
    >
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          {/* App name and date */}
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 mb-1 font-sans">
              Friday
            </h1>
            <div className="flex items-center gap-2 text-neutral-600 font-sans">
              <Calendar className="w-4 h-4" />
              <span className="text-sm font-medium">{dayName}</span>
              <span className="text-sm text-neutral-500">{dateStr}</span>
            </div>
          </div>

          {/* Progress circle and user profile */}
          <div className="flex items-center gap-6">
            {/* Progress Circle for Today's Focus */}
            <div className="flex flex-col items-center">
              {/* Shows percent of today's focus tasks completed */}
              <ProgressCircle completed={todayTasksCompleted} total={todayTaskCount || 1} size={48} />
              <span className="text-xs text-neutral-500 mt-1 font-sans">Today's Focus</span>
            </div>
            
            {/* Process recurring tasks button (for testing) */}
            {onProcessRecurring && (
              <button
                onClick={onProcessRecurring}
                className="w-10 h-10 flex items-center justify-center text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 rounded-lg transition-colors duration-200 font-sans"
                title="Process Recurring Tasks"
              >
                <RefreshCw className="w-6 h-6" />
              </button>
            )}

            {/* User profile button */}
            <div className="relative">
              <button
                onClick={() => setShowUserProfile(!showUserProfile)}
                className="w-10 h-10 flex items-center justify-center text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 rounded-lg transition-colors duration-200 font-sans"
                title="User Profile"
              >
                {user?.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt={user.displayName || 'User'} 
                    className="w-7 h-7 rounded-full"
                  />
                ) : (
                  <User className="w-6 h-6" />
                )}
              </button>
              
              {/* User profile dropdown */}
              {showUserProfile && (
                <div className="absolute right-0 mt-2 z-10 w-64">
                  <UserProfile onOpenSettings={onOpenSettings} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}