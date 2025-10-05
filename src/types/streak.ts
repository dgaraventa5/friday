export interface StreakCelebration {
  streak: number;
  achievedAt: string; // ISO timestamp for when the celebration triggered
}

export interface StreakState {
  currentStreak: number;
  longestStreak: number;
  freezeTokens: number;
  lastCompletedDate: string | null; // YYYY-MM-DD in local time
  freezeUsedOn: string | null; // YYYY-MM-DD when a freeze was last consumed
  milestoneCelebration: StreakCelebration | null;
}
