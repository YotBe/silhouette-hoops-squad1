import { describe, it, expect } from 'vitest';
import { calcStreakMultiplier, calcRoundPoints, calcRoundXP } from '@/hooks/useScoring';

describe('calcStreakMultiplier', () => {
  it('returns 1× at streak 0', () => {
    expect(calcStreakMultiplier(0)).toBe(1);
  });

  it('returns 1× at streak 1 and 2', () => {
    expect(calcStreakMultiplier(1)).toBe(1);
    expect(calcStreakMultiplier(2)).toBe(1);
  });

  it('returns 1.5× at streak 3', () => {
    expect(calcStreakMultiplier(3)).toBe(1.5);
  });

  it('returns 2× at streak 6', () => {
    expect(calcStreakMultiplier(6)).toBe(2);
  });

  it('caps at 3×', () => {
    expect(calcStreakMultiplier(12)).toBe(3);
    expect(calcStreakMultiplier(100)).toBe(3);
  });
});

describe('calcRoundPoints', () => {
  const base = {
    correct: true,
    streak: 0,
    hintsRevealed: 0,
    timeLeft: 0,
    timerSeconds: 15,
    isMysteryMode: false,
    mysteryCluesRevealed: 0,
    isBuzzerMode: false,
  };

  it('returns 0 for wrong answers', () => {
    expect(calcRoundPoints({ ...base, correct: false })).toBe(0);
  });

  it('returns 100 base points with no hints and 0 time left', () => {
    expect(calcRoundPoints(base)).toBe(100);
  });

  it('adds speed bonus based on timeLeft', () => {
    const points = calcRoundPoints({ ...base, timeLeft: 10 });
    expect(points).toBe(100 + 10 * 2); // 120
  });

  it('applies hint penalty of 20 per hint', () => {
    const points = calcRoundPoints({ ...base, hintsRevealed: 2 });
    expect(points).toBe(60); // 100 - 40
  });

  it('base points floor is 25 even with max hints', () => {
    const points = calcRoundPoints({ ...base, hintsRevealed: 10 });
    expect(points).toBeGreaterThanOrEqual(25);
  });

  it('applies streak multiplier', () => {
    const points = calcRoundPoints({ ...base, streak: 3 });
    // streakMultiplier = 1.5, base = 100, speed bonus 0
    expect(points).toBe(150);
  });

  it('mystery mode uses clue-based scoring, no speed bonus', () => {
    const points = calcRoundPoints({
      ...base,
      isMysteryMode: true,
      mysteryCluesRevealed: 0,
      timeLeft: 10,
    });
    // mysteryBase = max((3-0)*30, 25) = 90, streakMultiplier = 1, no speed bonus
    expect(points).toBe(90);
  });

  it('mystery mode floors at 25 with all clues revealed', () => {
    const points = calcRoundPoints({
      ...base,
      isMysteryMode: true,
      mysteryCluesRevealed: 3,
    });
    expect(points).toBeGreaterThanOrEqual(25);
  });

  it('buzzer mode has no speed bonus', () => {
    const withSpeed = calcRoundPoints({ ...base, timeLeft: 10 });
    const buzzer = calcRoundPoints({ ...base, timeLeft: 10, isBuzzerMode: true });
    expect(buzzer).toBeLessThan(withSpeed);
  });
});

describe('calcRoundXP', () => {
  it('returns 0 for wrong answer', () => {
    expect(calcRoundXP(false, 0, 0)).toBe(0);
  });

  it('returns 50 XP base at low streak with no hints', () => {
    expect(calcRoundXP(true, 1, 0)).toBe(50);
  });

  it('returns 100 XP base at streak > 3 with no hints', () => {
    expect(calcRoundXP(true, 4, 0)).toBe(100);
  });

  it('reduces XP per hint used', () => {
    const noHint = calcRoundXP(true, 1, 0);
    const withHint = calcRoundXP(true, 1, 1);
    expect(withHint).toBeLessThan(noHint);
  });

  it('floors XP at 10', () => {
    expect(calcRoundXP(true, 1, 100)).toBeGreaterThanOrEqual(10);
  });
});
