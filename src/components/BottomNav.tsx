import { Calendar, Plus, List } from 'lucide-react';

interface BottomNavProps {
  onToday: () => void;
  onAdd: () => void;
  onSchedule: () => void;
  currentPage?: 'today' | 'schedule';
}

export function BottomNav({ onToday, onAdd, onSchedule, currentPage = 'today' }: BottomNavProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-neutral-100 flex justify-around items-center h-16 px-2 shadow-card font-sans"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)',
      }}
    >
      {/* Today */}
      <button
        className={`flex flex-col items-center justify-center ${currentPage === 'today' ? 'text-primary-500' : 'text-neutral-600'} hover:text-primary-600 focus:outline-none`}
        onClick={onToday}
        aria-label="Go to Today"
      >
        <List className="w-6 h-6 mb-1" />
        <span className="text-xs font-medium">Today</span>
      </button>
      {/* Add (FAB style) */}
      <button
        className="relative -mt-6 bg-primary-500 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-card hover:bg-primary-600 focus:outline-none border-4 border-white"
        onClick={onAdd}
        aria-label="Add Task"
      >
        <Plus className="w-7 h-7" />
      </button>
      {/* Schedule */}
      <button
        className={`flex flex-col items-center justify-center ${currentPage === 'schedule' ? 'text-primary-500' : 'text-neutral-600'} hover:text-primary-600 focus:outline-none`}
        onClick={onSchedule}
        aria-label="Go to Schedule"
      >
        <Calendar className="w-6 h-6 mb-1" />
        <span className="text-xs font-medium">Schedule</span>
      </button>
    </nav>
  );
} 