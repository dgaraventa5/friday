import { addDays } from 'date-fns';
import { registerCompletion, DEFAULT_STREAK_STATE } from './streakUtils';
import { parseLocalDateInput } from './dateUtils';
import { StreakState } from '../types/streak';

describe('registerCompletion', () => {
  const baseDate = parseLocalDateInput('2025-01-01');

  it('starts a new streak on first completion', () => {
    const updated = registerCompletion(
      { ...DEFAULT_STREAK_STATE, freezeTokens: 0 },
      addDays(baseDate, 0),
    );

    expect(updated.currentStreak).toBe(1);
    expect(updated.longestStreak).toBe(1);
    expect(updated.lastCompletedDate).toBe('2025-01-01');
  });

  it('increments streak on consecutive day completions', () => {
    let state: StreakState = { ...DEFAULT_STREAK_STATE, freezeTokens: 0 };
    state = registerCompletion(state, addDays(baseDate, 0));
    state = registerCompletion(state, addDays(baseDate, 1));

    expect(state.currentStreak).toBe(2);
    expect(state.longestStreak).toBe(2);
  });

  it('resets streak when a day is missed without tokens', () => {
    let state: StreakState = { ...DEFAULT_STREAK_STATE, freezeTokens: 0 };
    state = registerCompletion(state, addDays(baseDate, 0));
    state = registerCompletion(state, addDays(baseDate, 1));
    state = registerCompletion(state, addDays(baseDate, 3));

    expect(state.currentStreak).toBe(1);
    expect(state.freezeTokens).toBe(0);
  });

  it('consumes a freeze token to preserve streak after a missed day', () => {
    let state: StreakState = { ...DEFAULT_STREAK_STATE, freezeTokens: 1 };
    state = registerCompletion(state, addDays(baseDate, 0));
    state = registerCompletion(state, addDays(baseDate, 2));

    expect(state.currentStreak).toBe(2);
    expect(state.freezeTokens).toBe(0);
    expect(state.freezeUsedOn).toBe('2025-01-03');
  });

  it('awards a freeze token every 7-day milestone', () => {
    let state: StreakState = { ...DEFAULT_STREAK_STATE, freezeTokens: 0 };

    for (let i = 0; i < 7; i += 1) {
      state = registerCompletion(state, addDays(baseDate, i));
    }

    expect(state.currentStreak).toBe(7);
    expect(state.freezeTokens).toBe(1);
    expect(state.longestStreak).toBe(7);
  });
});
