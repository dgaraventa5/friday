export interface StreakCelebration {
  streak: number;
  achievedAt: string; // ISO timestamp for when the celebration triggered
}

export interface StreakState {
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string | null; // YYYY-MM-DD in local time
  milestoneCelebration: StreakCelebration | null;
}
