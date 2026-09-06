import { describe, it, expect, beforeEach, vi } from 'vitest';

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(global, 'localStorage', { value: localStorageMock });

const trackEvent = vi.fn();
vi.mock('@/utils/analytics', () => ({ trackEvent: (...args: unknown[]) => trackEvent(...args) }));

import {
  getVisitorId,
  buildShareLink,
  parseReferral,
  captureReferral,
  getStoredReferral,
  markReferralConverted,
  clearReferral,
  getInvitesSent,
  recordInviteSent,
  buildFlexLine,
  percentileLabel,
  buildChallengeText,
  buildRematchText,
} from '@/utils/viral';

describe('visitor identity', () => {
  beforeEach(() => { localStorageMock.clear(); trackEvent.mockClear(); });

  it('is stable across calls', () => {
    expect(getVisitorId()).toBe(getVisitorId());
  });

  it('is non-empty and URL-safe', () => {
    expect(getVisitorId()).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});

describe('buildShareLink', () => {
  beforeEach(() => { localStorageMock.clear(); });

  it('points at the /s preview route with kind and code', () => {
    const url = buildShareLink({ kind: 'challenge', code: 'abc123', ref: 'friend1', origin: 'https://whoisit.app' });
    expect(url.startsWith('https://whoisit.app/s?')).toBe(true);
    const params = new URLSearchParams(url.split('?')[1]);
    expect(params.get('k')).toBe('challenge');
    expect(params.get('c')).toBe('abc123');
    expect(params.get('r')).toBe('friend1');
  });

  it('escapes payload characters that a query string would otherwise mangle', () => {
    const url = buildShareLink({ kind: 'challenge', code: 'a+b/c=', ref: 'x', origin: 'https://whoisit.app' });
    expect(url).not.toContain('a+b/c=');
    expect(new URLSearchParams(url.split('?')[1]).get('c')).toBe('a+b/c=');
  });

  it('defaults the referrer to this visitor', () => {
    const url = buildShareLink({ kind: 'score', origin: 'https://whoisit.app' });
    expect(new URLSearchParams(url.split('?')[1]).get('r')).toBe(getVisitorId());
  });
});

describe('parseReferral', () => {
  it('reads referrer and kind', () => {
    expect(parseReferral('?r=friend1&k=rematch', 1000)).toEqual({ ref: 'friend1', kind: 'rematch', at: 1000 });
  });

  it('falls back to challenge for an unknown kind', () => {
    expect(parseReferral('?r=friend1&k=bogus', 1)?.kind).toBe('challenge');
  });

  it('returns null without a referrer', () => {
    expect(parseReferral('?k=daily')).toBeNull();
    expect(parseReferral('')).toBeNull();
  });
});

describe('referral attribution', () => {
  beforeEach(() => { localStorageMock.clear(); trackEvent.mockClear(); });

  it('stores an inbound referral and reports it as opened', () => {
    const info = captureReferral('?r=friend1&k=challenge', 5000);
    expect(info).toEqual({ ref: 'friend1', kind: 'challenge', at: 5000 });
    expect(getStoredReferral()?.ref).toBe('friend1');
    expect(trackEvent).toHaveBeenCalledWith('invite_opened', { kind: 'challenge' });
  });

  it('keeps first touch when a second link is opened', () => {
    captureReferral('?r=friend1&k=challenge', 1000);
    captureReferral('?r=friend2&k=rematch', 2000);
    expect(getStoredReferral()?.ref).toBe('friend1');
  });

  it('preserves an existing referral when a plain visit has no params', () => {
    captureReferral('?r=friend1&k=challenge', 1000);
    expect(captureReferral('', 2000)?.ref).toBe('friend1');
  });

  it('never credits a visitor for inviting themselves', () => {
    const self = getVisitorId();
    expect(captureReferral(`?r=${self}&k=challenge`, 1000)).toBeNull();
    expect(getStoredReferral()).toBeNull();
  });

  it('converts exactly once', () => {
    captureReferral('?r=friend1&k=challenge', 1000);
    expect(markReferralConverted()?.ref).toBe('friend1');
    expect(markReferralConverted()).toBeNull();
    expect(trackEvent.mock.calls.filter(c => c[0] === 'invite_converted')).toHaveLength(1);
  });

  it('does not convert an unreferred visitor', () => {
    expect(markReferralConverted()).toBeNull();
  });

  it('clears cleanly', () => {
    captureReferral('?r=friend1&k=challenge', 1000);
    clearReferral();
    expect(getStoredReferral()).toBeNull();
  });
});

describe('invites sent', () => {
  beforeEach(() => { localStorageMock.clear(); trackEvent.mockClear(); });

  it('starts at zero and increments', () => {
    expect(getInvitesSent()).toBe(0);
    expect(recordInviteSent('challenge')).toBe(1);
    expect(recordInviteSent('rematch')).toBe(2);
    expect(getInvitesSent()).toBe(2);
  });

  it('reports each invite for k-factor tracking', () => {
    recordInviteSent('challenge', { tier: 'pro' });
    expect(trackEvent).toHaveBeenCalledWith('invite_sent', { kind: 'challenge', totalSent: 1, tier: 'pro' });
  });

  it('recovers from a corrupted counter', () => {
    localStorageMock.setItem('sg_invites_sent', 'not-a-number');
    expect(getInvitesSent()).toBe(0);
  });
});

describe('percentileLabel', () => {
  it('reports a top percentile with enough players ranked', () => {
    expect(percentileLabel(5, 100)).toBe('Top 5%');
  });

  it('stays silent when the field is too small to be meaningful', () => {
    expect(percentileLabel(1, 3)).toBeNull();
  });

  it('stays silent below the median', () => {
    expect(percentileLabel(80, 100)).toBeNull();
  });

  it('stays silent without rank data', () => {
    expect(percentileLabel(null, 100)).toBeNull();
    expect(percentileLabel(5, null)).toBeNull();
  });
});

describe('buildFlexLine', () => {
  it('leads with a perfect round', () => {
    expect(buildFlexLine({ score: 500, accuracy: 100, bestStreak: 5 })).toContain('PERFECT ROUND');
  });

  it('falls back to a long streak, then accuracy', () => {
    expect(buildFlexLine({ score: 100, accuracy: 60, bestStreak: 6 })).toBe('6 in a row');
    expect(buildFlexLine({ score: 100, accuracy: 60, bestStreak: 2 })).toBe('60% accuracy');
  });

  it('appends a percentile only when the rank is real', () => {
    expect(buildFlexLine({ score: 1, accuracy: 100, bestStreak: 1, rank: 5, totalRanked: 100 })).toBe('PERFECT ROUND · Top 5%');
    expect(buildFlexLine({ score: 1, accuracy: 100, bestStreak: 1, rank: 5, totalRanked: 6 })).toBe('PERFECT ROUND');
  });

  it('says nothing rather than something false on an empty round', () => {
    expect(buildFlexLine({ score: 0, accuracy: 0, bestStreak: 0 })).toBe('');
  });
});

describe('share copy', () => {
  it('challenge copy carries the score and a tappable link', () => {
    const text = buildChallengeText({ senderName: 'Yotam', score: 2450, url: 'https://whoisit.app/s?k=challenge', grid: '🟢🟡🟢' });
    expect(text).toContain('2,450');
    expect(text).toContain('🟢🟡🟢');
    expect(text.endsWith('https://whoisit.app/s?k=challenge')).toBe(true);
  });

  it('rematch copy names the opponent and hands the ball back', () => {
    const won = buildRematchText({
      senderName: 'Me', opponentName: 'Yotam', opponentScore: 2450,
      won: true, score: 2900, url: 'https://whoisit.app/s?k=rematch',
    });
    expect(won).toContain('Yotam');
    expect(won).toContain('2,900');
    expect(won).toContain('Your turn');

    const lost = buildRematchText({
      senderName: 'Me', opponentName: 'Yotam', opponentScore: 2900,
      won: false, score: 2450, url: 'https://whoisit.app/s?k=rematch',
    });
    expect(lost).toContain('Rematch');
  });

  it('rematch copy survives a missing opponent name', () => {
    const text = buildRematchText({
      senderName: 'Me', opponentName: '  ', opponentScore: 10,
      won: true, score: 20, url: 'https://whoisit.app/s',
    });
    expect(text).toContain('You scored');
  });
});
