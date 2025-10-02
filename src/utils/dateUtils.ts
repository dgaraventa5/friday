import {
  format,
  isToday,
  isTomorrow,
  isYesterday,
  addDays,
  addWeeks,
  addMonths,
  startOfDay,
  getDay,
} from 'date-fns';

const DAY_OF_WEEK_MIN = 0;
const DAY_OF_WEEK_MAX = 6;

const parseRecurringDay = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.trunc(value);
  }

  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? null : parsed;
  }

  return null;
};

export function normalizeRecurringDays(
  input: unknown,
): number[] | undefined {
  if (input === null || input === undefined) {
    return undefined;
  }

  const values: number[] = [];

  if (Array.isArray(input)) {
    input.forEach((item) => {
      const parsed = parseRecurringDay(item);
      if (parsed !== null) {
        values.push(parsed);
      }
    });
  } else if (typeof input === 'object') {
    Object.entries(input as Record<string, unknown>).forEach(
      ([key, value]) => {
        if (!value) return;
        const parsed = parseRecurringDay(key);
        if (parsed !== null) {
          values.push(parsed);
        }
      },
    );
  } else {
    return undefined;
  }

  const normalized = Array.from(new Set(values))
    .filter(
      (day) =>
        Number.isInteger(day) && day >= DAY_OF_WEEK_MIN && day <= DAY_OF_WEEK_MAX,
    )
    .sort((a, b) => a - b);

  return normalized;
}

export function formatTaskDate(date: Date): string {
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  if (isYesterday(date)) return 'Yesterday';

  return format(date, 'MMM d, yyyy');
}

export function formatDateInput(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

// Standard function to get a normalized date key in YYYY-MM-DD format
export function getDateKey(date: Date): string {
  return startOfDay(new Date(date)).toLocaleDateString('en-CA');
}

// Get today's date key
export function getTodayKey(): string {
  return getDateKey(new Date());
}

// Get tomorrow's date key
export function getTomorrowKey(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return getDateKey(tomorrow);
}

// Normalize a date to start of day
export function normalizeDate(date: Date): Date {
  return startOfDay(new Date(date));
}

// Check if two dates are the same day (normalized comparison)
export function isSameNormalizedDay(date1: Date, date2: Date): boolean {
  return getDateKey(date1) === getDateKey(date2);
}

// Get next recurring date based on interval and days
export function getNextRecurringDate(
  baseDate: Date,
  interval: 'daily' | 'weekly' | 'monthly',
  recurringDays?: number[],
): Date {
  const normalizedDate = normalizeDate(baseDate);

  switch (interval) {
    case 'daily':
      return addDays(normalizedDate, 1);
    case 'weekly':
      if (recurringDays && recurringDays.length > 0) {
        // Find the next day of week that matches one in recurringDays
        const currentDayOfWeek = getDay(normalizedDate);
        const nextDays = recurringDays
          .map((day) =>
            day > currentDayOfWeek
              ? day - currentDayOfWeek
              : 7 + day - currentDayOfWeek,
          )
          .filter((days) => days > 0)
          .sort((a, b) => a - b);

        return nextDays.length > 0
          ? addDays(normalizedDate, nextDays[0])
          : addDays(normalizedDate, 7); // Default to one week later
      }
      return addWeeks(normalizedDate, 1);
    case 'monthly':
      return addMonths(normalizedDate, 1);
    default:
      return addDays(normalizedDate, 1);
  }
}
