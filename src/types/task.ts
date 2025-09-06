export interface Task {
  id: string;
  name: string;
  category: Category;
  importance: 'important' | 'not-important';
  urgency: 'urgent' | 'not-urgent';
  dueDate: Date;
  estimatedHours: number;
  completed: boolean;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  isRecurring?: boolean;
  recurringInterval?: 'daily' | 'weekly' | 'monthly';
  recurringDays?: number[]; // For weekly: 0-6 (Sun-Sat)
  nextDueDate?: Date;
  startDate: Date;
  recurringEndType?: 'never' | 'after'; // Type of end repeat
  recurringEndCount?: number; // Number of occurrences if 'after' is selected
  recurringCurrentCount?: number; // Current count of occurrences (for tracking)
}

export interface Category {
  id: string;
  name: string;
  color: string;
  dailyLimit: number;
  icon: string;
}

export interface UserPreferences {
  maxDailyTasks: number;
  categories: Category[];
  theme: 'light' | 'dark';
  notifications: boolean;
  categoryLimits?: Record<string, { max: number }>;
  defaultView?: string;
  notificationsEnabled?: boolean;
  emailNotifications?: boolean;
  defaultCategory?: string;
  [key: string]: unknown; // Allow for additional preference fields
}

export type EisenhowerQuadrant =
  | 'urgent-important'
  | 'not-urgent-important'
  | 'urgent-not-important'
  | 'not-urgent-not-important';

export interface TaskScore {
  taskId: string;
  score: number;
  quadrant: EisenhowerQuadrant;
  daysOverdue: number;
  priority: number;
}
