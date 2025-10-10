import { addDays } from 'date-fns';
import {
  registerCompletion,
  DEFAULT_STREAK_STATE,
  mergeStreakStates,
} from './streakUtils';
import { parseLocalDateInput } from './dateUtils';

describe('registerCompletion', () => {
  const baseDate = parseLocalDateInput('2025-01-01');

  it('starts a new streak on first completion', () => {
    const updated = registerCompletion(
      { ...DEFAULT_STREAK_STATE },
      addDays(baseDate, 0),
    );

    expect(updated.currentStreak).toBe(1);
    expect(updated.longestStreak).toBe(1);
    expect(updated.lastCompletedDate).toBe('2025-01-01');
  });

  it('increments streak on consecutive day completions', () => {
    let state = { ...DEFAULT_STREAK_STATE };
    state = registerCompletion(state, addDays(baseDate, 0));
    state = registerCompletion(state, addDays(baseDate, 1));

    expect(state.currentStreak).toBe(2);
    expect(state.longestStreak).toBe(2);
  });

  it('resets streak when a day is missed without tokens', () => {
    let state = { ...DEFAULT_STREAK_STATE };
    state = registerCompletion(state, addDays(baseDate, 0));
    state = registerCompletion(state, addDays(baseDate, 1));
    state = registerCompletion(state, addDays(baseDate, 3));

    expect(state.currentStreak).toBe(1);
    expect(state.longestStreak).toBe(2);
  });

  it('triggers milestone celebrations at configured streak lengths', () => {
    let state = { ...DEFAULT_STREAK_STATE };

    for (let i = 0; i < 3; i += 1) {
      state = registerCompletion(state, addDays(baseDate, i));
    }

    expect(state.currentStreak).toBe(3);
    expect(state.milestoneCelebration?.streak).toBe(3);
    expect(state.longestStreak).toBe(3);
  });
});

describe('mergeStreakStates', () => {
  const yesterday = '2025-01-01';
  const today = '2025-01-02';

  it('prefers the state with the more recent completion date', () => {
    const current = {
      ...DEFAULT_STREAK_STATE,
      currentStreak: 2,
      longestStreak: 3,
      lastCompletedDate: today,
    };

    const incoming = {
      ...DEFAULT_STREAK_STATE,
      currentStreak: 5,
      longestStreak: 5,
      lastCompletedDate: yesterday,
    };

    const result = mergeStreakStates(current, incoming);

    expect(result.currentStreak).toBe(2);
    expect(result.lastCompletedDate).toBe(today);
    expect(result.longestStreak).toBe(5);
  });

  it('preserves milestone metadata from older state when local progress is newer', () => {
    const milestone = {
      streak: 7,
      achievedAt: new Date().toISOString(),
    };

    const current = {
      ...DEFAULT_STREAK_STATE,
      currentStreak: 1,
      longestStreak: 2,
      lastCompletedDate: today,
      milestoneCelebration: null,
    };

    const incoming = {
      ...DEFAULT_STREAK_STATE,
      currentStreak: 4,
      longestStreak: 7,
      lastCompletedDate: yesterday,
      milestoneCelebration: milestone,
    };

    const result = mergeStreakStates(current, incoming);

    expect(result.longestStreak).toBe(7);
    expect(result.milestoneCelebration).toEqual(milestone);
  });

  it('adopts the incoming state when it contains newer progress', () => {
    const current = {
      ...DEFAULT_STREAK_STATE,
      currentStreak: 2,
      longestStreak: 3,
      lastCompletedDate: yesterday,
    };

    const incoming = {
      ...DEFAULT_STREAK_STATE,
      currentStreak: 4,
      longestStreak: 4,
      lastCompletedDate: today,
    };

    const result = mergeStreakStates(current, incoming);

    expect(result.currentStreak).toBe(4);
    expect(result.lastCompletedDate).toBe(today);
    expect(result.longestStreak).toBe(4);
  });

  it('keeps the highest streak values when the completion dates match', () => {
    const current = {
      ...DEFAULT_STREAK_STATE,
      currentStreak: 3,
      longestStreak: 4,
      lastCompletedDate: today,
      milestoneCelebration: null,
    };

    const incoming = {
      ...DEFAULT_STREAK_STATE,
      currentStreak: 5,
      longestStreak: 6,
      lastCompletedDate: today,
      milestoneCelebration: {
        streak: 5,
        achievedAt: new Date().toISOString(),
      },
    };

    const result = mergeStreakStates(current, incoming);

    expect(result.currentStreak).toBe(5);
    expect(result.longestStreak).toBe(6);
    expect(result.milestoneCelebration?.streak).toBe(5);
  });
});
