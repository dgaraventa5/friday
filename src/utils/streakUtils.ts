import { differenceInCalendarDays } from 'date-fns';
import { StreakState } from '../types/streak';
import {
  getDateKey,
  normalizeDate,
  parseLocalDateInput,
} from './dateUtils';

export const STREAK_STORAGE_KEY = 'friday_daily_streak_v1';
export const STREAK_MILESTONES = [3, 7, 14, 21, 30, 60, 100];

export const DEFAULT_STREAK_STATE: StreakState = {
  currentStreak: 0,
  longestStreak: 0,
  freezeTokens: 1,
  lastCompletedDate: null,
  freezeUsedOn: null,
  milestoneCelebration: null,
};

export function loadStreakState(prefix: string = ''): StreakState {
  const stored = localStorage.getItem(`${prefix}${STREAK_STORAGE_KEY}`);
  if (!stored) {
    return { ...DEFAULT_STREAK_STATE };
  }

  try {
    const parsed = JSON.parse(stored) as Partial<StreakState>;
    return {
      ...DEFAULT_STREAK_STATE,
      ...parsed,
      currentStreak: Number(parsed.currentStreak) || 0,
      longestStreak: Number(parsed.longestStreak) || 0,
      freezeTokens:
        typeof parsed.freezeTokens === 'number' && parsed.freezeTokens >= 0
          ? Math.floor(parsed.freezeTokens)
          : DEFAULT_STREAK_STATE.freezeTokens,
      lastCompletedDate:
        typeof parsed.lastCompletedDate === 'string'
          ? parsed.lastCompletedDate
          : null,
      freezeUsedOn:
        typeof parsed.freezeUsedOn === 'string' ? parsed.freezeUsedOn : null,
      milestoneCelebration:
        parsed.milestoneCelebration &&
        typeof parsed.milestoneCelebration === 'object'
          ? parsed.milestoneCelebration
          : null,
    };
  } catch (error) {
    console.warn('[StreakUtils] Failed to parse streak state:', error);
    return { ...DEFAULT_STREAK_STATE };
  }
}

export function saveStreakState(
  state: StreakState,
  prefix: string = '',
): void {
  localStorage.setItem(
    `${prefix}${STREAK_STORAGE_KEY}`,
    JSON.stringify(state),
  );
}

export function getNextMilestone(currentStreak: number): number | null {
  for (const milestone of STREAK_MILESTONES) {
    if (milestone > currentStreak) {
      return milestone;
    }
  }
  return null;
}

export function registerCompletion(
  streakState: StreakState,
  completionDate: Date,
): StreakState {
  const todayKey = getDateKey(completionDate);

  if (streakState.lastCompletedDate === todayKey) {
    // Already counted a completion for today
    return streakState;
  }

  const normalizedCompletion = normalizeDate(completionDate);
  const lastCompletion = streakState.lastCompletedDate
    ? normalizeDate(parseLocalDateInput(streakState.lastCompletedDate))
    : null;

  let currentStreak = streakState.currentStreak;
  let freezeTokens = streakState.freezeTokens;
  let freezeUsedOn = streakState.freezeUsedOn;

  if (!lastCompletion) {
    currentStreak = 1;
    freezeUsedOn = null;
  } else {
    const dayDiff = differenceInCalendarDays(
      normalizedCompletion,
      lastCompletion,
    );

    if (dayDiff <= 0) {
      // Completion that appears to be on or before the last recorded day.
      // Treat it as the first completion of today without changing the streak.
      return {
        ...streakState,
        lastCompletedDate: todayKey,
        freezeUsedOn: null,
      };
    }

    if (dayDiff === 1) {
      currentStreak += 1;
      freezeUsedOn = null;
    } else if (dayDiff === 2 && freezeTokens > 0) {
      currentStreak += 1;
      freezeTokens -= 1;
      freezeUsedOn = todayKey;
    } else {
      currentStreak = 1;
      freezeUsedOn = null;
    }
  }

  const longestStreak = Math.max(streakState.longestStreak, currentStreak);

  if (currentStreak > 0 && currentStreak % 7 === 0) {
    freezeTokens += 1;
  }

  const milestoneCelebration = STREAK_MILESTONES.includes(currentStreak)
    ? {
        streak: currentStreak,
        achievedAt: new Date().toISOString(),
      }
    : streakState.milestoneCelebration;

  return {
    ...streakState,
    currentStreak,
    longestStreak,
    freezeTokens,
    lastCompletedDate: todayKey,
    freezeUsedOn,
    milestoneCelebration,
  };
}

export function clearStreakCelebration(state: StreakState): StreakState {
  if (!state.milestoneCelebration) {
    return state;
  }

  return {
    ...state,
    milestoneCelebration: null,
  };
}
