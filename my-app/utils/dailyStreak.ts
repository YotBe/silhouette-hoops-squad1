import { awardPowerUp, type PowerUpType } from './powerups';
import { storage } from './storage';

const DATE_KEY = 'sg_streak_date';
const COUNT_KEY = 'sg_streak_count';
const REWARD_KEY = 'sg_streak_rewarded';

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export interface StreakReward {
  type: PowerUpType;
  label: string;
  milestone: number;
}

const STREAK_REWARDS: StreakReward[] = [
  { milestone: 3, type: 'fiftyFifty', label: 'Free 50/50' },
  { milestone: 7, type: 'secondChance', label: 'Free 2nd Life' },
  { milestone: 14, type: 'fiftyFifty', label: 'Free 50/50' },
  { milestone: 21, type: 'secondChance', label: 'Free 2nd Life' },
  { milestone: 30, type: 'extraTime', label: 'Free +5s' },
];

export interface StreakInfo {
  count: number;
  lastDate: string | null;
  isActive: boolean;
  atRisk: boolean;
  xpMultiplier: number;
}

export function checkAndUpdateStreak(): StreakInfo {
  const lastDate = storage.getItem(DATE_KEY);
  let count = parseInt(storage.getItem(COUNT_KEY) || '0', 10);
  const now = today();

  if (lastDate === now) return buildInfo(count, now);

  if (lastDate === yesterday()) {
    count += 1;
  } else {
    count = 1;
  }

  storage.setItem(DATE_KEY, now);
  storage.setItem(COUNT_KEY, String(count));
  return buildInfo(count, now);
}

export function getStreakInfo(): StreakInfo {
  const lastDate = storage.getItem(DATE_KEY);
  const count = parseInt(storage.getItem(COUNT_KEY) || '0', 10);
  return buildInfo(count, lastDate);
}

function buildInfo(count: number, lastDate: string | null): StreakInfo {
  const now = today();
  const isActive = lastDate === now;
  const atRisk = lastDate === yesterday() && !isActive;
  const xpMultiplier = Math.min(1.5, 1 + (count - 1) * 0.1);
  return { count, lastDate, isActive, atRisk, xpMultiplier: count > 0 ? xpMultiplier : 1 };
}

export function claimStreakReward(count: number): StreakReward | null {
  const lastRewarded = parseInt(storage.getItem(REWARD_KEY) || '0', 10);
  const reward = STREAK_REWARDS.find(r => r.milestone === count && count > lastRewarded);
  if (!reward) return null;
  awardPowerUp(reward.type);
  storage.setItem(REWARD_KEY, String(count));
  return reward;
}
