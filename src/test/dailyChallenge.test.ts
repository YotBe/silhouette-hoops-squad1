import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getDailySeed, getDailyPlayers, getDailyChallengeNumber, getTimeUntilNextChallenge, getDailyShareText } from '@/utils/dailyChallenge';

// Mock safeStorage so we don't touch real localStorage in tests
vi.mock('@/utils/safeStorage', () => ({
  storageGet: vi.fn(() => null),
  storageSet: vi.fn(),
  storageGetJSON: vi.fn(() => null),
  storageSetJSON: vi.fn(),
  storageRemove: vi.fn(),
}));

describe('getDailySeed', () => {
  it('returns a YYYY-MM-DD formatted string', () => {
    const seed = getDailySeed();
    expect(seed).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('returns the same value when called twice on the same day', () => {
    expect(getDailySeed()).toBe(getDailySeed());
  });
});

describe('getDailyPlayers', () => {
  it('returns exactly 3 players', () => {
    const players = getDailyPlayers();
    expect(players).toHaveLength(3);
  });

  it('returns the same players for the same day (deterministic)', () => {
    const first = getDailyPlayers().map(p => p.id);
    const second = getDailyPlayers().map(p => p.id);
    expect(first).toEqual(second);
  });

  it('returns player objects with required fields', () => {
    const players = getDailyPlayers();
    for (const p of players) {
      expect(p).toHaveProperty('id');
      expect(p).toHaveProperty('name');
      expect(p).toHaveProperty('team');
    }
  });
});

describe('getDailyChallengeNumber', () => {
  it('returns a positive integer', () => {
    const num = getDailyChallengeNumber();
    expect(num).toBeGreaterThan(0);
    expect(Number.isInteger(num)).toBe(true);
  });

  it('is at least 1 (epoch was 2025-01-01)', () => {
    expect(getDailyChallengeNumber()).toBeGreaterThanOrEqual(1);
  });
});

describe('getTimeUntilNextChallenge', () => {
  it('returns hours, minutes, seconds all non-negative', () => {
    const { hours, minutes, seconds } = getTimeUntilNextChallenge();
    expect(hours).toBeGreaterThanOrEqual(0);
    expect(minutes).toBeGreaterThanOrEqual(0);
    expect(seconds).toBeGreaterThanOrEqual(0);
  });

  it('hours is between 0 and 23', () => {
    const { hours } = getTimeUntilNextChallenge();
    expect(hours).toBeLessThan(24);
  });

  it('minutes and seconds are between 0 and 59', () => {
    const { minutes, seconds } = getTimeUntilNextChallenge();
    expect(minutes).toBeLessThan(60);
    expect(seconds).toBeLessThan(60);
  });
});

describe('getDailyShareText', () => {
  it('includes the day number', () => {
    const result = { score: 300, answers: [true, false, true], players: ['LeBron', 'Jordan', 'Kobe'], date: '2025-01-01' };
    const text = getDailyShareText(result);
    expect(text).toContain('Day #');
  });

  it('includes the score', () => {
    const result = { score: 420, answers: [true, true, true], players: ['A', 'B', 'C'], date: '2025-01-01' };
    const text = getDailyShareText(result);
    expect(text).toContain('420');
  });

  it('shows green for correct answers', () => {
    const result = { score: 100, answers: [true], players: ['A'], date: '2025-01-01' };
    expect(getDailyShareText(result)).toContain('🟢');
  });

  it('shows red for wrong answers', () => {
    const result = { score: 0, answers: [false], players: ['A'], date: '2025-01-01' };
    expect(getDailyShareText(result)).toContain('🔴');
  });

  it('shows yellow for correct with hints (answerDetails)', () => {
    const result = {
      score: 150,
      answers: [true],
      answerDetails: [{ correct: true, hintsUsed: 2 }],
      players: ['A'],
      date: '2025-01-01',
    };
    expect(getDailyShareText(result)).toContain('🟡');
  });
});
