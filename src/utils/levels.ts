const BASE_XP = 150;
const SCALE = 1.1;

// XP required to reach a given level
function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += Math.round(BASE_XP * Math.pow(SCALE, i - 1));
  }
  return total;
}

export function xpToLevel(xp: number): number {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) {
    level++;
    if (level >= 1000) break; // safety
  }
  return level;
}

export function levelProgress(xp: number): {
  level: number;
  currentLevelXP: number;
  nextLevelXP: number;
  pct: number;
} {
  const level = xpToLevel(xp);
  const currentLevelXP = xpForLevel(level);
  const nextLevelXP = xpForLevel(level + 1);
  const pct = nextLevelXP > currentLevelXP
    ? Math.min(((xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100, 100)
    : 100;
  return { level, currentLevelXP, nextLevelXP, pct };
}
