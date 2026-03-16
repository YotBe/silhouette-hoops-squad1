import { awardPowerUp, PowerUpType } from './powerups';

const DAY_KEY = 'sg_daily_reward_day';
const DATE_KEY = 'sg_daily_reward_last_date';
const XP_KEY = 'sg_xp';

export interface DailyReward {
  day: number; // 1-7
  label: string;
  icon: string;
  claimed: boolean;
}

const REWARDS: { label: string; icon: string }[] = [
  { label: '+1 50/50', icon: '✂️' },
  { label: '+1 Extra Time', icon: '⏱️' },
  { label: '+1 2nd Life', icon: '🛡️' },
  { label: '+50 Bonus XP', icon: '⭐' },
  { label: '+1 of each power-up', icon: '🎁' },
  { label: '+100 Bonus XP', icon: '💎' },
  { label: '+2 of each + Badge', icon: '🏆' },
];

function getDateStr(d = new Date()): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export function checkDailyReward(): DailyReward | null {
  try {
    const lastDate = localStorage.getItem(DATE_KEY);
    const today = getDateStr();
    if (lastDate === today) return null; // already claimed today

    const currentDay = parseInt(localStorage.getItem(DAY_KEY) || '0', 10);
    const nextDay = (currentDay % 7) + 1; // 1-7

    // Validate it's actually a different day
    if (lastDate) {
      const last = new Date(lastDate);
      const now = new Date();
      if (last.toDateString() === now.toDateString()) return null;
    }

    const reward = REWARDS[nextDay - 1];
    return { day: nextDay, label: reward.label, icon: reward.icon, claimed: false };
  } catch {
    return null;
  }
}

export function claimDailyReward(day: number): void {
  const today = getDateStr();
  localStorage.setItem(DATE_KEY, today);
  localStorage.setItem(DAY_KEY, String(day));

  const powerUpMap: Record<number, Array<{ type: PowerUpType; count: number }>> = {
    1: [{ type: 'fiftyFifty', count: 1 }],
    2: [{ type: 'extraTime', count: 1 }],
    3: [{ type: 'secondChance', count: 1 }],
    5: [{ type: 'fiftyFifty', count: 1 }, { type: 'extraTime', count: 1 }, { type: 'secondChance', count: 1 }],
    7: [{ type: 'fiftyFifty', count: 2 }, { type: 'extraTime', count: 2 }, { type: 'secondChance', count: 2 }],
  };

  const xpMap: Record<number, number> = { 4: 50, 6: 100 };

  if (powerUpMap[day]) {
    powerUpMap[day].forEach(({ type, count }) => awardPowerUp(type, count));
  }
  if (xpMap[day]) {
    try {
      const current = parseInt(localStorage.getItem(XP_KEY) || '0', 10);
      localStorage.setItem(XP_KEY, String(current + xpMap[day]));
    } catch {}
  }
}

export function getStreakDay(): number {
  return parseInt(localStorage.getItem(DAY_KEY) || '0', 10);
}

export function getRewards() {
  return REWARDS;
}
