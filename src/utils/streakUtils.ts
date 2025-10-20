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
  lastCompletedDate: null,
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
      lastCompletedDate:
        typeof parsed.lastCompletedDate === 'string'
          ? parsed.lastCompletedDate
          : null,
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

function normalizeStoredDate(dateString: string | null): Date | null {
  if (!dateString) {
    return null;
  }

  const parsed = parseLocalDateInput(dateString);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return normalizeDate(parsed);
}

function mergeMilestone(
  preferred: StreakState,
  fallback: StreakState,
): StreakState['milestoneCelebration'] {
  if (preferred.milestoneCelebration) {
    return preferred.milestoneCelebration;
  }

  return fallback.milestoneCelebration;
}

export function mergeStreakStates(
  current: StreakState,
  incoming: StreakState,
): StreakState {
  const currentDate = normalizeStoredDate(current.lastCompletedDate);
  const incomingDate = normalizeStoredDate(incoming.lastCompletedDate);

  if (!currentDate) {
    // Nothing tracked yet locally - prefer the incoming data while keeping any
    // locally recorded highs.
    return {
      ...DEFAULT_STREAK_STATE,
      ...current,
      ...incoming,
      currentStreak: Math.max(current.currentStreak, incoming.currentStreak),
      longestStreak: Math.max(current.longestStreak, incoming.longestStreak),
      milestoneCelebration: mergeMilestone(incoming, current),
    };
  }

  if (!incomingDate) {
    const mergedLongestStreak = Math.max(
      current.longestStreak,
      incoming.longestStreak,
    );

    return {
      ...current,
      longestStreak: mergedLongestStreak,
      milestoneCelebration: mergeMilestone(current, incoming),
    };
  }

  const dateDiff = differenceInCalendarDays(incomingDate, currentDate);

  if (Number.isNaN(dateDiff)) {
    return { ...current };
  }

  if (dateDiff > 0) {
    // Incoming streak is more recent than what we currently have - prefer it
    return {
      ...current,
      ...incoming,
      longestStreak: Math.max(current.longestStreak, incoming.longestStreak),
      milestoneCelebration: mergeMilestone(incoming, current),
    };
  }

  if (dateDiff < 0) {
    // Local state already has a more recent completion - keep it while preserving
    // historical highs recorded in the incoming data.
    const mergedLongestStreak = Math.max(
      current.longestStreak,
      incoming.longestStreak,
    );

    return {
      ...current,
      longestStreak: mergedLongestStreak,
      milestoneCelebration: mergeMilestone(current, incoming),
    };
  }

  // Same completion day - merge the metadata while keeping the highest streak values
  return {
    ...current,
    ...incoming,
    currentStreak: Math.max(current.currentStreak, incoming.currentStreak),
    longestStreak: Math.max(current.longestStreak, incoming.longestStreak),
    milestoneCelebration: mergeMilestone(incoming, current),
  };
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

  if (!lastCompletion) {
    currentStreak = 1;
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
      };
    }

    if (dayDiff === 1) {
      currentStreak += 1;
    } else {
      currentStreak = 1;
    }
  }

  const longestStreak = Math.max(streakState.longestStreak, currentStreak);

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
    lastCompletedDate: todayKey,
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
