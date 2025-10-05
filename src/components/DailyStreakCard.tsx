import { useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Flame, ShieldCheck, Sparkles, Snowflake } from 'lucide-react';
import { StreakState } from '../types/streak';
import { getNextMilestone, STREAK_MILESTONES } from '../utils/streakUtils';
import { getTodayKey } from '../utils/dateUtils';

interface DailyStreakCardProps {
  streak: StreakState;
  onDismissCelebration: () => void;
}

const CELEBRATION_DURATION = 4200;

const milestoneMessages: Record<number, string> = {
  3: 'Three days strong! Momentum unlocked.',
  7: 'A full week! Lucky number seven.',
  14: 'Two weeks and counting—amazing consistency.',
  21: 'Three weeks! You are unstoppable.',
  30: 'A month of wins. Legendary.',
  60: 'Two months of focus. Incredible.',
  100: 'Triple digits! A streak for the history books.',
};

export function DailyStreakCard({
  streak,
  onDismissCelebration,
}: DailyStreakCardProps) {
  const todayKey = getTodayKey();
  const nextMilestone = getNextMilestone(streak.currentStreak);
  const daysToNext = nextMilestone ? nextMilestone - streak.currentStreak : 0;
  const progressToNext = useMemo(() => {
    if (!nextMilestone) return 1;
    const capped = Math.min(streak.currentStreak / nextMilestone, 1);
    return Math.max(capped, 0);
  }, [nextMilestone, streak.currentStreak]);

  useEffect(() => {
    if (!streak.milestoneCelebration) return;

    const timer = window.setTimeout(() => {
      onDismissCelebration();
    }, CELEBRATION_DURATION);

    return () => window.clearTimeout(timer);
  }, [streak.milestoneCelebration, onDismissCelebration]);

  const celebrationMessage = streak.milestoneCelebration
    ? milestoneMessages[streak.milestoneCelebration.streak] ||
      `You hit a ${streak.milestoneCelebration.streak}-day streak!`
    : null;

  const freezeSavedStreak = streak.freezeUsedOn === todayKey;
  const hasStreakStarted = streak.currentStreak > 0;

  return (
    <div className="mb-4">
      <div className="relative overflow-hidden rounded-2xl bg-white border border-orange-100 shadow-sm">
        <div className="p-4 sm:p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                <Flame className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-orange-600 uppercase tracking-wide">
                  Daily streak
                </p>
                <p className="text-3xl font-semibold text-neutral-900">
                  {streak.currentStreak}
                  <span className="ml-1 text-sm font-normal text-neutral-500">
                    day{streak.currentStreak === 1 ? '' : 's'}
                  </span>
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-neutral-500">Freeze tokens</p>
              <p className="mt-1 flex items-center justify-end gap-1 text-lg font-semibold text-sky-600">
                <Snowflake className="h-5 w-5" />
                {streak.freezeTokens}
              </p>
            </div>
          </div>

          <div className="mt-4">
            <div className="relative h-2 overflow-hidden rounded-full bg-neutral-200">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-300"
                style={{ width: `${progressToNext * 100}%` }}
                aria-hidden
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-neutral-500">
              <span>Longest streak: {streak.longestStreak} days</span>
              {nextMilestone ? (
                <span>
                  {daysToNext === 1
                    ? '1 day to your next milestone'
                    : `${daysToNext} days to ${nextMilestone}`}
                </span>
              ) : (
                <span>Keep building your legend</span>
              )}
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-orange-50 px-3 py-2 text-sm text-orange-800">
            {hasStreakStarted ? (
              <p>
                {celebrationMessage
                  ? celebrationMessage
                  : daysToNext > 0
                    ? `Complete a task today to move ${
                        daysToNext === 1 ? 'one step' : `${daysToNext} steps`
                      } closer to ${nextMilestone}-day status.`
                    : 'Keep completing at least one task each day to grow your streak.'}
              </p>
            ) : (
              <p>Complete your first task today to start your streak.</p>
            )}
          </div>
        </div>

        <AnimatePresence>
          {streak.milestoneCelebration && (
            <motion.div
              key={streak.milestoneCelebration.streak}
              className="pointer-events-none absolute inset-0 bg-gradient-to-r from-orange-100/70 via-amber-100/70 to-pink-100/70"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <motion.div
                className="absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.1, duration: 0.5 }}
              >
                {STREAK_MILESTONES.map((milestone, index) => (
                  <motion.span
                    key={milestone}
                    className="absolute text-orange-400"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{
                      scale: [0, 1.2, 1],
                      opacity: [0, 1, 0],
                      rotate: [0, index % 2 === 0 ? 15 : -15, 0],
                    }}
                    transition={{
                      delay: 0.2 + index * 0.05,
                      duration: 1.4,
                      repeat: 2,
                    }}
                    style={{
                      top: `${20 + index * 10}%`,
                      left: `${10 + (index * 13) % 70}%`,
                    }}
                  >
                    <Sparkles className="h-5 w-5" />
                  </motion.span>
                ))}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {freezeSavedStreak && (
        <div className="mt-2 flex items-center gap-2 rounded-xl bg-sky-50 px-3 py-2 text-sm text-sky-700">
          <ShieldCheck className="h-4 w-4" />
          <span>Your streak freeze protected your progress after a missed day.</span>
        </div>
      )}
    </div>
  );
}
