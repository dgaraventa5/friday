// Header.tsx
// App header: shows app name, date, progress circle for Today's Focus, and settings button.

import { User, Settings } from 'lucide-react';
import { ProgressCircle } from './ProgressCircle';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserProfile } from './UserProfile';
import { CategoryLimitMenu } from './CategoryLimitMenu';

interface HeaderProps {
  todayTaskCount: number;
  totalTaskCount: number;
  todayTasksCompleted: number;
}

export function Header({
  todayTaskCount,
  todayTasksCompleted,
}: HeaderProps) {
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { authState } = useAuth();
  const { user } = authState;

  useEffect(() => {
    if (user) {
      console.log('User info in Header:', {
        displayName: user.displayName,
        photoURL: user.photoURL,
        email: user.email?.substring(0, 5) + '...', // Only log part of the email for privacy
      });
    }
  }, [user]);

  const iconSize = 40;
  const sunIconSize = 36;

  return (
    <header
      className="bg-white border-b border-neutral-50"
      style={{
        height: '60px',
        padding: '6px',
        paddingTop: 'max(6px, env(safe-area-inset-top, 6px))',
        paddingLeft: 'max(6px, env(safe-area-inset-left, 6px))',
        paddingRight: 'max(6px, env(safe-area-inset-right, 6px))',
      }}
    >
      <div className="max-w-4xl mx-auto h-full">
        <div className="flex items-center justify-between h-full">
          {/* App logo */}
          <div className="flex items-center">
            <svg
              width={sunIconSize}
              height={sunIconSize}
              viewBox="0 0 200 200"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="100" cy="100" r="65" fill="#FFB800" />
              <path d="M100 0L110 40L100 30L90 40Z" fill="#FFB800" />
              <path d="M100 200L110 160L100 170L90 160Z" fill="#FFB800" />
              <path d="M0 100L40 110L30 100L40 90Z" fill="#FFB800" />
              <path d="M200 100L160 110L170 100L160 90Z" fill="#FFB800" />
              <path
                d="M29.3 29.3L58.6 58.6L48.5 48.5L58.6 48.5Z"
                fill="#FFB800"
              />
              <path
                d="M170.7 170.7L141.4 141.4L151.5 151.5L141.4 151.5Z"
                fill="#FFB800"
              />
              <path
                d="M29.3 170.7L58.6 141.4L48.5 151.5L58.6 151.5Z"
                fill="#FFB800"
              />
              <path
                d="M170.7 29.3L141.4 58.6L151.5 48.5L141.4 48.5Z"
                fill="#FFB800"
              />
            </svg>
          </div>

          {/* Progress circle and user profile */}
          <div className="flex items-center gap-4">
            {/* Progress Circle */}
            <div className="flex items-center">
              <ProgressCircle
                completed={todayTasksCompleted}
                total={todayTaskCount || 1}
                size={iconSize}
              />
            </div>

            {/* Settings button */}
            <div className="relative">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="flex items-center justify-center text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 rounded-lg transition-colors duration-200"
                title="Settings"
                style={{ width: iconSize, height: iconSize }}
              >
                <Settings className="w-6 h-6" />
              </button>
              {showSettings && (
                <CategoryLimitMenu onClose={() => setShowSettings(false)} />
              )}
            </div>

            {/* User profile button */}
            <div className="relative">
              <button
                onClick={() => setShowUserProfile(!showUserProfile)}
                className={`flex items-center justify-center text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 rounded-lg transition-colors duration-200`}
                title="User Profile"
                style={{ width: iconSize, height: iconSize }}
              >
                {user?.photoURL && !imageError ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="rounded-full"
                    style={{ width: iconSize - 12, height: iconSize - 12 }}
                    onError={() => {
                      console.error(
                        'Failed to load user profile image:',
                        user.photoURL,
                      );
                      setImageError(true);
                    }}
                  />
                ) : (
                  <div
                    className="rounded-full bg-blue-500 flex items-center justify-center text-white"
                    style={{ width: iconSize - 12, height: iconSize - 12 }}
                  >
                    {user?.displayName?.charAt(0) || user?.email?.charAt(0) || (
                      <User className="w-6 h-6" />
                    )}
                  </div>
                )}
              </button>

              {/* User profile dropdown */}
              {showUserProfile && (
                <div className="absolute right-0 mt-2 z-10 w-64">
                  <UserProfile />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
