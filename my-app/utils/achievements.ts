import { storage } from './storage';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  condition: (stats: AchievementStats) => boolean;
  progress?: (stats: AchievementStats) => number;
  progressLabel?: (stats: AchievementStats) => string;
}

export interface AchievementStats {
  totalCorrect: number;
  totalGames: number;
  totalAnswered: number;
  bestStreak: number;
  totalXP: number;
  collectedPlayers: number;
  perfectGames: number;
  dailyChallengesCompleted: number;
  buzzerGamesPlayed: number;
  hintsNeverUsed: number;
}

const STORAGE_KEY = 'sg_achievements';
const STATS_KEY = 'sg_achievement_stats';

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_guess', title: 'First Bucket', description: 'Get your first correct guess', icon: '🏀', condition: s => s.totalCorrect >= 1 },
  { id: 'correct_10', title: 'Double Digits', description: 'Get 10 correct guesses', icon: '🔟', condition: s => s.totalCorrect >= 10, progress: s => Math.min(s.totalCorrect / 10, 1), progressLabel: s => `${s.totalCorrect}/10` },
  { id: 'correct_50', title: 'Half Century', description: 'Get 50 correct guesses', icon: '🏅', condition: s => s.totalCorrect >= 50, progress: s => Math.min(s.totalCorrect / 50, 1), progressLabel: s => `${s.totalCorrect}/50` },
  { id: 'correct_100', title: 'Century Club', description: 'Get 100 correct guesses', icon: '💯', condition: s => s.totalCorrect >= 100, progress: s => Math.min(s.totalCorrect / 100, 1), progressLabel: s => `${s.totalCorrect}/100` },
  { id: 'streak_3', title: 'Hot Hand', description: 'Get a 3-game streak', icon: '🔥', condition: s => s.bestStreak >= 3, progress: s => Math.min(s.bestStreak / 3, 1), progressLabel: s => `${s.bestStreak}/3` },
  { id: 'streak_5', title: 'On Fire', description: 'Get a 5-game streak', icon: '🔥', condition: s => s.bestStreak >= 5, progress: s => Math.min(s.bestStreak / 5, 1), progressLabel: s => `${s.bestStreak}/5` },
  { id: 'streak_10', title: 'Unstoppable', description: 'Get a 10-game streak', icon: '⚡', condition: s => s.bestStreak >= 10, progress: s => Math.min(s.bestStreak / 10, 1), progressLabel: s => `${s.bestStreak}/10` },
  { id: 'xp_500', title: 'Rising Star', description: 'Earn 500 XP', icon: '⭐', condition: s => s.totalXP >= 500, progress: s => Math.min(s.totalXP / 500, 1), progressLabel: s => `${s.totalXP}/500 XP` },
  { id: 'xp_2000', title: 'All-Star', description: 'Earn 2000 XP', icon: '🌟', condition: s => s.totalXP >= 2000, progress: s => Math.min(s.totalXP / 2000, 1), progressLabel: s => `${s.totalXP}/2000 XP` },
  { id: 'collect_10', title: 'Card Collector', description: 'Collect 10 player cards', icon: '🃏', condition: s => s.collectedPlayers >= 10, progress: s => Math.min(s.collectedPlayers / 10, 1), progressLabel: s => `${s.collectedPlayers}/10` },
  { id: 'collect_50', title: 'Gallery Master', description: 'Collect 50 player cards', icon: '🖼️', condition: s => s.collectedPlayers >= 50, progress: s => Math.min(s.collectedPlayers / 50, 1), progressLabel: s => `${s.collectedPlayers}/50` },
  { id: 'perfect_game', title: 'Perfect Game', description: 'Complete a game with 100% accuracy', icon: '💎', condition: s => s.perfectGames >= 1 },
  { id: 'daily_1', title: 'Daily Player', description: 'Complete a Daily Challenge', icon: '📅', condition: s => s.dailyChallengesCompleted >= 1 },
  { id: 'no_hints', title: 'No Peeking', description: 'Win a game without using hints', icon: '🙈', condition: s => s.hintsNeverUsed >= 1 },
  { id: 'buzzer_1', title: 'Beat the Buzzer', description: 'Play a Buzzer Beater game', icon: '🚨', condition: s => s.buzzerGamesPlayed >= 1 },
];

export function getUnlockedAchievements(): string[] {
  try { return JSON.parse(storage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}

export function getAchievementStats(): AchievementStats {
  try {
    const raw = JSON.parse(storage.getItem(STATS_KEY) || '{}');
    return {
      totalCorrect: raw.totalCorrect || 0,
      totalGames: raw.totalGames || 0,
      totalAnswered: raw.totalAnswered || 0,
      bestStreak: raw.bestStreak || 0,
      totalXP: raw.totalXP || 0,
      collectedPlayers: raw.collectedPlayers || 0,
      perfectGames: raw.perfectGames || 0,
      dailyChallengesCompleted: raw.dailyChallengesCompleted || 0,
      buzzerGamesPlayed: raw.buzzerGamesPlayed || 0,
      hintsNeverUsed: raw.hintsNeverUsed || 0,
    };
  } catch {
    return { totalCorrect: 0, totalGames: 0, totalAnswered: 0, bestStreak: 0, totalXP: 0, collectedPlayers: 0, perfectGames: 0, dailyChallengesCompleted: 0, buzzerGamesPlayed: 0, hintsNeverUsed: 0 };
  }
}

export function updateAchievementStats(partial: Partial<AchievementStats>): void {
  const current = getAchievementStats();
  const updated = { ...current, ...partial };
  if (partial.bestStreak !== undefined) {
    updated.bestStreak = Math.max(current.bestStreak, partial.bestStreak);
  }
  storage.setItem(STATS_KEY, JSON.stringify(updated));
}

export function checkNewAchievements(): Achievement[] {
  const stats = getAchievementStats();
  const unlocked = new Set(getUnlockedAchievements());
  const newlyUnlocked: Achievement[] = [];
  for (const achievement of ACHIEVEMENTS) {
    if (!unlocked.has(achievement.id) && achievement.condition(stats)) {
      newlyUnlocked.push(achievement);
      unlocked.add(achievement.id);
    }
  }
  if (newlyUnlocked.length > 0) {
    storage.setItem(STORAGE_KEY, JSON.stringify([...unlocked]));
  }
  return newlyUnlocked;
}

export function getNextAchievement(): { achievement: Achievement; pct: number; label: string } | null {
  const stats = getAchievementStats();
  const unlocked = new Set(getUnlockedAchievements());
  let best: { achievement: Achievement; pct: number; label: string } | null = null;
  for (const a of ACHIEVEMENTS) {
    if (unlocked.has(a.id) || !a.progress) continue;
    const pct = a.progress(stats);
    if (pct <= 0) continue;
    if (!best || pct > best.pct) {
      best = { achievement: a, pct, label: a.progressLabel ? a.progressLabel(stats) : `${Math.round(pct * 100)}%` };
    }
  }
  return best;
}
