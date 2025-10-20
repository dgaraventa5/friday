import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { resetUserData } from '../utils/firebase';
import { Button } from './Button';
import { assignStartDates } from '../utils/taskPrioritization';
import { getTodayKey, getTomorrowKey, getDateKey } from '../utils/dateUtils';

export function DevTools() {
  const [isOpen, setIsOpen] = useState(false);
  const { state, testMode, toggleTestMode } = useApp();
  const { authState } = useAuth();
  const { user } = authState;
  const { tasks, preferences } = state;
  const [showDebug, setShowDebug] = useState(false);

  // Get assigned tasks
  const assignedTasks = assignStartDates(
    tasks,
    4,
    preferences.categoryLimits,
    preferences.dailyMaxHours,
  );

  // Get today's and tomorrow's date keys
  const todayKey = getTodayKey();
  const tomorrowKey = getTomorrowKey();

  // Count tasks by day
  const todayTasks = assignedTasks.filter(
    (t) => getDateKey(t.startDate) === todayKey,
  );
  const tomorrowTasks = assignedTasks.filter(
    (t) => getDateKey(t.startDate) === tomorrowKey,
  );

  const todayCompleted = todayTasks.filter((t) => t.completed).length;
  const tomorrowCompleted = tomorrowTasks.filter((t) => t.completed).length;

  if (!user) return null;

  return (
    <div className="fixed bottom-20 right-4 z-50">
      {/* Developer menu toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gray-800 text-white p-2 rounded-full shadow-lg"
        title="Developer Tools"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 22h6"></path>
          <path d="M2 13h20"></path>
          <path d="M10 17l-2-2-2-2"></path>
          <path d="M14 17l2-2 2-2"></path>
          <rect x="9" y="2" width="6" height="11" rx="3"></rect>
        </svg>
      </button>

      {/* Developer menu panel */}
      {isOpen && (
        <div className="bg-white p-4 rounded-lg shadow-lg mt-2 border border-gray-200 w-64">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium">Developer Tools</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Test Mode</span>
              <button
                onClick={toggleTestMode}
                className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                  testMode ? 'bg-blue-500' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    testMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="pt-2">
              <p className="text-xs text-gray-500 mb-2">
                {testMode
                  ? 'Test mode active: Onboarding will be shown'
                  : 'Test mode inactive: Normal app behavior'}
              </p>
              <p className="text-xs text-gray-500 mb-2">
                Shortcut: Ctrl+Shift+O
              </p>
            </div>

            <div className="border-t border-gray-200 pt-3">
              <Button
                onClick={() => user && resetUserData(user.uid)}
                variant="secondary"
                className="w-full text-sm"
              >
                Reset User Data
              </Button>
              <p className="text-xs text-gray-500 mt-1">
                Clears all user data and reloads the app
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col space-y-2">
        <button
          onClick={() => setShowDebug(!showDebug)}
          className="bg-neutral-800 text-white p-2 rounded-full shadow-lg"
          title="Toggle Debug Panel"
        >
          🐞
        </button>

        {showDebug && (
          <div className="bg-white border border-neutral-200 rounded-lg shadow-lg p-4 w-80 text-xs">
            <h3 className="font-bold mb-2">Debug Info</h3>

            <div className="mb-2">
              <div className="font-medium">Test Mode</div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={testMode}
                  onChange={toggleTestMode}
                  className="mr-2"
                />
                <span>{testMode ? 'Enabled' : 'Disabled'}</span>
              </div>
            </div>

            <div className="mb-2">
              <div className="font-medium">Task Allocation</div>
              <div className="grid grid-cols-2 gap-2">
                <div>Today ({todayKey}):</div>
                <div>
                  {todayTasks.length} tasks ({todayCompleted} completed)
                </div>
                <div>Tomorrow ({tomorrowKey}):</div>
                <div>
                  {tomorrowTasks.length} tasks ({tomorrowCompleted} completed)
                </div>
              </div>
            </div>

            <div className="mb-2">
              <div className="font-medium">Today's Tasks</div>
              <ul className="list-disc pl-4">
                {todayTasks.map((task) => (
                  <li
                    key={task.id}
                    className={task.completed ? 'line-through' : ''}
                  >
                    {task.name}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mb-2">
              <div className="font-medium">Tomorrow's Tasks</div>
              <ul className="list-disc pl-4">
                {tomorrowTasks.map((task) => (
                  <li
                    key={task.id}
                    className={task.completed ? 'line-through' : ''}
                  >
                    {task.name}
                  </li>
                ))}
              </ul>
            </div>

            <div className="text-right mt-2">
              <button
                onClick={() => setShowDebug(false)}
                className="text-neutral-500 hover:text-neutral-700"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
