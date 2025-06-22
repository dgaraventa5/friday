import { format, isToday, isTomorrow, isYesterday, addDays, addWeeks, addMonths } from 'date-fns';

export function formatTaskDate(date: Date): string {
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  if (isYesterday(date)) return 'Yesterday';
  
  return format(date, 'MMM d, yyyy');
}

export function formatDateInput(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function getNextRecurringDate(date: Date, interval: 'daily' | 'weekly' | 'monthly', recurringDays?: number[]): Date {
  switch (interval) {
    case 'daily':
      return addDays(date, 1);
    case 'weekly':
      if (recurringDays && recurringDays.length > 0) {
        // Find next occurrence based on selected days
        const currentDay = date.getDay();
        const sortedDays = [...recurringDays].sort((a, b) => a - b);
        
        // Find next day in the current week
        const nextDay = sortedDays.find(day => day > currentDay);
        if (nextDay !== undefined) {
          const daysToAdd = nextDay - currentDay;
          return addDays(date, daysToAdd);
        }
        
        // If no day found in current week, go to first day of next week
        const daysToNextWeek = 7 - currentDay + sortedDays[0];
        return addDays(date, daysToNextWeek);
      }
      return addWeeks(date, 1);
    case 'monthly':
      return addMonths(date, 1);
    default:
      return addDays(date, 1);
  }
}