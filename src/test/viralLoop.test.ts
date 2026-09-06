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

import handler from '../../api/s';
import { buildChallengeURL, decodeChallenge, type ChallengeData } from '@/utils/challenge';
import { captureReferral, markReferralConverted, getStoredReferral } from '@/utils/viral';

function fetchPreview(shareUrl: string) {
  const { pathname, search } = new URL(shareUrl);
  let body = '';
  handler(
    { url: `${pathname}${search}`, headers: { host: 'whoisit.app' } },
    { statusCode: 0, setHeader: () => {}, end: (b?: string) => { body = b ?? ''; } },
  );
  return body;
}

/** The redirect target the share page hands a real visitor. */
function targetOf(html: string): string {
  return /location\.replace\("([^"]+)"\)/.exec(html)![1];
}

describe('the full invite loop', () => {
  beforeEach(() => { localStorageMock.clear(); trackEvent.mockClear(); });

  const challenge: ChallengeData = {
    playerIds: ['curry', 'lebron', 'giannis'],
    score: 2450,
    name: 'Yotam',
    tier: 'pro',
  };

  it('carries a challenge from sender, through a chat preview, into the recipient\'s game', () => {
    // 1. Sender finishes a round and shares.
    const shareUrl = buildChallengeURL(challenge);

    // 2. A chat app unfurls the link: the preview names the sender and score.
    const html = fetchPreview(shareUrl);
    expect(html).toContain('Yotam scored 2,450');

    const senderRef = new URLSearchParams(shareUrl.split('?')[1]).get('r')!;

    // 3. The recipient taps through on their own device.
    localStorageMock.clear();
    const target = targetOf(html);
    const params = new URLSearchParams(target.split('?')[1]);

    // 4. The exact same challenge survives the round trip.
    expect(decodeChallenge(params.get('challenge')!)).toEqual(challenge);

    // 5. Attribution survives too, and converts once they finish a game.
    const attributed = captureReferral(`?${params.toString()}`);
    expect(attributed?.ref).toBe(senderRef);
    expect(markReferralConverted()?.kind).toBe('challenge');
    expect(trackEvent.mock.calls.map(c => c[0])).toEqual(
      expect.arrayContaining(['invite_opened', 'invite_converted']),
    );
  });

  it('keeps the rematch leg distinguishable end to end', () => {
    const html = fetchPreview(buildChallengeURL({ ...challenge, name: 'Dana', score: 2900 }, 'rematch'));
    expect(html).toContain('Dana wants a rematch');
    expect(new URLSearchParams(targetOf(html).split('?')[1]).get('k')).toBe('rematch');
  });

  it('survives a name that plain base64 could not encode', () => {
    const html = fetchPreview(buildChallengeURL({ ...challenge, name: 'Ünsal 🏀' }));
    expect(html).toContain('Ünsal');
    const target = targetOf(html);
    expect(decodeChallenge(new URLSearchParams(target.split('?')[1]).get('challenge')!)?.name).toBe('Ünsal 🏀');
  });

  it('does not credit a sender who opens their own link', () => {
    const params = new URLSearchParams(buildChallengeURL(challenge).split('?')[1]);
    expect(captureReferral(`?${params.toString()}`)).toBeNull();
    expect(getStoredReferral()).toBeNull();
  });
});
