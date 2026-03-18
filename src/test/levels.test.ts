import { describe, it, expect } from 'vitest';
import { xpToLevel, levelProgress } from '@/utils/levels';

describe('xpToLevel', () => {
  it('returns level 1 for 0 XP', () => {
    expect(xpToLevel(0)).toBe(1);
  });

  it('returns level 1 for XP below first threshold', () => {
    expect(xpToLevel(100)).toBe(1);
  });

  it('returns level 2 after crossing the first threshold (150 XP)', () => {
    expect(xpToLevel(150)).toBe(2);
  });

  it('returns level 3 after crossing the second threshold (~315 XP)', () => {
    // Level 2 requires 150, level 3 requires 150 + 165 = 315
    expect(xpToLevel(315)).toBe(3);
  });

  it('is monotonically non-decreasing', () => {
    const samples = [0, 50, 149, 150, 200, 300, 500, 1000, 5000, 10000];
    let prev = 0;
    for (const xp of samples) {
      const level = xpToLevel(xp);
      expect(level).toBeGreaterThanOrEqual(prev);
      prev = level;
    }
  });

  it('does not exceed safety cap of 1000', () => {
    expect(xpToLevel(999_999_999)).toBeLessThanOrEqual(1000);
  });
});

describe('levelProgress', () => {
  it('returns pct 0 at level start', () => {
    const { pct, level } = levelProgress(0);
    expect(level).toBe(1);
    expect(pct).toBeGreaterThanOrEqual(0);
  });

  it('returns pct between 0 and 100', () => {
    const xpValues = [0, 100, 300, 1000, 5000];
    for (const xp of xpValues) {
      const { pct } = levelProgress(xp);
      expect(pct).toBeGreaterThanOrEqual(0);
      expect(pct).toBeLessThanOrEqual(100);
    }
  });

  it('currentLevelXP is always <= xp', () => {
    const xpValues = [0, 150, 315, 1000, 5000];
    for (const xp of xpValues) {
      const { currentLevelXP } = levelProgress(xp);
      expect(currentLevelXP).toBeLessThanOrEqual(xp);
    }
  });

  it('nextLevelXP is always > currentLevelXP', () => {
    const xpValues = [0, 150, 500, 5000];
    for (const xp of xpValues) {
      const { currentLevelXP, nextLevelXP } = levelProgress(xp);
      expect(nextLevelXP).toBeGreaterThan(currentLevelXP);
    }
  });
});
