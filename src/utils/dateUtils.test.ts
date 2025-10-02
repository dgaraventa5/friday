import {
  formatTaskDate,
  getDateKey,
  getTodayKey,
  getTomorrowKey,
  normalizeDate,
  isSameNormalizedDay,
  getNextRecurringDate,
  formatDateInput,
  parseLocalDateInput,
} from './dateUtils';
import { addDays, subDays } from 'date-fns';

describe('dateUtils', () => {
  describe('formatTaskDate', () => {
    it('should format today as "Today"', () => {
      const today = new Date();
      expect(formatTaskDate(today)).toBe('Today');
    });

    it('should format tomorrow as "Tomorrow"', () => {
      const tomorrow = addDays(new Date(), 1);
      expect(formatTaskDate(tomorrow)).toBe('Tomorrow');
    });

    it('should format yesterday as "Yesterday"', () => {
      const yesterday = subDays(new Date(), 1);
      expect(formatTaskDate(yesterday)).toBe('Yesterday');
    });

    it('should format other dates in MMM d, yyyy format', () => {
      const date = new Date(2023, 0, 15); // Jan 15, 2023
      expect(formatTaskDate(date)).toBe('Jan 15, 2023');
    });
  });

  describe('getDateKey', () => {
    it('should return a date in YYYY-MM-DD format', () => {
      const date = new Date(2023, 0, 15); // Jan 15, 2023
      expect(getDateKey(date)).toBe('2023-01-15');
    });

    it('should normalize dates to start of day', () => {
      const morning = new Date(2023, 0, 15, 9, 30); // Jan 15, 2023, 9:30 AM
      const evening = new Date(2023, 0, 15, 21, 45); // Jan 15, 2023, 9:45 PM

      expect(getDateKey(morning)).toBe(getDateKey(evening));
    });
  });

  describe('normalizeDate', () => {
    it('should set time to 00:00:00.000', () => {
      const date = new Date(2023, 0, 15, 14, 30, 45, 500);
      const normalized = normalizeDate(date);

      expect(normalized.getHours()).toBe(0);
      expect(normalized.getMinutes()).toBe(0);
      expect(normalized.getSeconds()).toBe(0);
      expect(normalized.getMilliseconds()).toBe(0);
    });

    it('should create a new date object', () => {
      const original = new Date();
      const normalized = normalizeDate(original);

      expect(normalized).not.toBe(original);
    });
  });

  describe('isSameNormalizedDay', () => {
    it('should return true for same day with different times', () => {
      const morning = new Date(2023, 0, 15, 9, 30);
      const evening = new Date(2023, 0, 15, 21, 45);

      expect(isSameNormalizedDay(morning, evening)).toBe(true);
    });

    it('should return false for different days', () => {
      const today = new Date();
      const tomorrow = addDays(today, 1);

      expect(isSameNormalizedDay(today, tomorrow)).toBe(false);
    });
  });

  describe('getTodayKey and getTomorrowKey', () => {
    it('should return keys one day apart', () => {
      const todayKey = getTodayKey();
      const tomorrowKey = getTomorrowKey();

      const today = new Date(todayKey + 'T00:00:00');
      const tomorrow = new Date(tomorrowKey + 'T00:00:00');

      const diffTime = tomorrow.getTime() - today.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);

      expect(diffDays).toBe(1);
    });
  });

  describe('getNextRecurringDate', () => {
    it('should return next day for daily recurrence', () => {
      const date = new Date(2023, 0, 15);
      const next = getNextRecurringDate(date, 'daily');

      expect(next.getDate()).toBe(16);
      expect(next.getMonth()).toBe(0);
      expect(next.getFullYear()).toBe(2023);
    });

    it('should return next week for weekly recurrence', () => {
      const date = new Date(2023, 0, 15);
      const next = getNextRecurringDate(date, 'weekly');

      expect(next.getDate()).toBe(22);
      expect(next.getMonth()).toBe(0);
      expect(next.getFullYear()).toBe(2023);
    });

    it('should handle weekly recurrence with specific days', () => {
      // Sunday, Jan 15, 2023
      const date = new Date(2023, 0, 15);

      // Next Tuesday (day 2)
      const next = getNextRecurringDate(date, 'weekly', [2]);

      expect(next.getDate()).toBe(17);
      expect(next.getMonth()).toBe(0);
      expect(next.getFullYear()).toBe(2023);
      expect(next.getDay()).toBe(2); // Tuesday
    });

    it('should return next month for monthly recurrence', () => {
      const date = new Date(2023, 0, 15);
      const next = getNextRecurringDate(date, 'monthly');

      expect(next.getDate()).toBe(15);
      expect(next.getMonth()).toBe(1); // February
      expect(next.getFullYear()).toBe(2023);
    });
  });

  describe('parseLocalDateInput', () => {
    it('parses a YYYY-MM-DD string using the local timezone', () => {
      const result = parseLocalDateInput('2024-09-06');

      expect(Number.isNaN(result.getTime())).toBe(false);
      expect(result.getFullYear()).toBe(2024);
      expect(result.getMonth()).toBe(8);
      expect(result.getDate()).toBe(6);
    });

    it('preserves the calendar day regardless of timezone offset', () => {
      const result = parseLocalDateInput('2024-09-06');
      const normalizedUtc = new Date(
        result.getTime() + result.getTimezoneOffset() * 60 * 1000,
      );

      expect(formatDateInput(result)).toBe('2024-09-06');
      expect(normalizedUtc.getUTCFullYear()).toBe(2024);
      expect(normalizedUtc.getUTCMonth()).toBe(8);
      expect(normalizedUtc.getUTCDate()).toBe(6);
    });

    it('returns an invalid date for malformed input', () => {
      const result = parseLocalDateInput('invalid');

      expect(Number.isNaN(result.getTime())).toBe(true);
    });

    it('returns an invalid date for empty input', () => {
      const result = parseLocalDateInput('');

      expect(Number.isNaN(result.getTime())).toBe(true);
    });
  });
});
