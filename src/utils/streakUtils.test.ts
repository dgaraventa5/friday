import { addDays } from 'date-fns';
import { registerCompletion, DEFAULT_STREAK_STATE } from './streakUtils';
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
