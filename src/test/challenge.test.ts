import { describe, it, expect, vi } from 'vitest';

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
vi.mock('@/utils/analytics', () => ({ trackEvent: vi.fn() }));

import { encodeChallenge, decodeChallenge, buildChallengeURL, type ChallengeData } from '@/utils/challenge';

const sample: ChallengeData = {
  playerIds: ['curry', 'lebron', 'giannis'],
  score: 2450,
  name: 'Yotam',
  tier: 'pro',
};

describe('challenge codec', () => {
  it('round-trips a challenge', () => {
    expect(decodeChallenge(encodeChallenge(sample))).toEqual(sample);
  });

  it('produces a URL-safe code', () => {
    // `+` and `/` are what a query string mangles; `=` padding is dropped.
    for (let i = 0; i < 200; i++) {
      const code = encodeChallenge({ ...sample, name: `Player${i}`, score: i * 37 });
      expect(code).toMatch(/^[A-Za-z0-9_-]+$/);
    }
  });

  it('survives a round trip through a query string', () => {
    const code = encodeChallenge({ ...sample, name: 'Ünsal 🏀', score: 999999 });
    const parsed = new URLSearchParams(new URLSearchParams({ c: code }).toString()).get('c');
    expect(decodeChallenge(parsed!)).toMatchObject({ name: 'Ünsal 🏀', score: 999999 });
  });

  it('encodes names outside Latin-1 that used to throw', () => {
    const code = encodeChallenge({ ...sample, name: 'Ünsal 🏀 Ω' });
    expect(code).not.toBe('');
    expect(decodeChallenge(code)?.name).toBe('Ünsal 🏀 Ω');
  });

  it('still reads legacy standard-base64 codes', () => {
    const legacy = btoa(JSON.stringify({ p: sample.playerIds, s: sample.score, n: sample.name, t: sample.tier }));
    expect(decodeChallenge(legacy)).toEqual(sample);
  });

  it('recovers a legacy code whose "+" was eaten by the query string', () => {
    const payload = { p: ['a+b/c', 'lebron', 'curry', 'giannis'], s: 12, n: 'Zoë', t: 'mvp' };
    const legacy = btoa(JSON.stringify(payload));
    expect(decodeChallenge(legacy.replace(/\+/g, ' '))).toMatchObject({ score: 12, name: 'Zoë' });
  });

  it('rejects malformed input instead of throwing', () => {
    expect(decodeChallenge('')).toBeNull();
    expect(decodeChallenge('!!!not-base64!!!')).toBeNull();
    expect(decodeChallenge(btoa('{"p":[]}'))).toBeNull();
    expect(decodeChallenge(btoa('not json'))).toBeNull();
  });

  it('builds a preview-route URL carrying the code', () => {
    const url = buildChallengeURL(sample);
    expect(url).toContain('/s?');
    const params = new URLSearchParams(url.split('?')[1]);
    expect(params.get('k')).toBe('challenge');
    expect(decodeChallenge(params.get('c')!)).toEqual(sample);
  });

  it('marks a rematch link as a rematch', () => {
    const url = buildChallengeURL(sample, 'rematch');
    expect(new URLSearchParams(url.split('?')[1]).get('k')).toBe('rematch');
  });
});
