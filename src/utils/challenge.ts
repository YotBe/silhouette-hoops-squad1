import { buildShareLink, type ShareKind } from './viral';

export interface ChallengeData {
  playerIds: string[];
  score: number;
  name: string;
  tier: string;
}

/**
 * Challenge payloads travel inside a URL, so they are encoded as URL-safe
 * base64 over UTF-8.
 *
 * Both details matter: plain base64 emits `+` and `/`, which a query string
 * turns into a space and a path separator, and plain `btoa` throws outright on
 * any name containing an accent or emoji. Either one silently dropped the
 * challenge on the receiving end — the share went out and led nowhere.
 */
function toBase64Url(input: string): string {
  const utf8 = new TextEncoder().encode(input);
  let binary = '';
  for (const byte of utf8) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(input: string): string {
  // A space can only be a `+` that a query string ate — links shared before
  // this encoding was URL-safe are still decodable.
  const normalized = input.replace(/ /g, '+').replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, ch => ch.charCodeAt(0));
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    // Codes minted before UTF-8 encoding hold Latin-1 bytes, so a name like
    // "Zoë" is not valid UTF-8. Read those back the way they were written
    // rather than handing the player a row of replacement characters.
    return binary;
  }
}

export function encodeChallenge(data: ChallengeData): string {
  try {
    return toBase64Url(JSON.stringify({ p: data.playerIds, s: data.score, n: data.name, t: data.tier }));
  } catch {
    return '';
  }
}

export function decodeChallenge(code: string): ChallengeData | null {
  try {
    const raw = JSON.parse(fromBase64Url(code));
    if (!Array.isArray(raw.p) || raw.p.length === 0) return null;
    return { playerIds: raw.p, score: raw.s ?? 0, name: raw.n ?? 'Someone', tier: raw.t ?? 'rookie' };
  } catch {
    return null;
  }
}

export function getChallengeFromURL(): ChallengeData | null {
  try {
    const params = new URLSearchParams(window.location.search);
    // `challenge` is the long-standing param; links already in the wild use it.
    const code = params.get('challenge') ?? params.get('c');
    if (!code) return null;
    return decodeChallenge(code);
  } catch {
    return null;
  }
}

/**
 * Build a shareable challenge URL.
 *
 * Points at `/s` rather than the app root so the link unfurls with the
 * sender's name and score in chat apps, and carries anonymous attribution so
 * the invite loop can be measured.
 */
export function buildChallengeURL(data: ChallengeData, kind: ShareKind = 'challenge'): string {
  return buildShareLink({ kind, code: encodeChallenge(data) });
}
