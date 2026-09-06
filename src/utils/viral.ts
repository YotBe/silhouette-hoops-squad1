/**
 * Viral loop primitives.
 *
 * The game already had sharing. What it did not have was a *loop*:
 *   1. A share that survives the trip through a messaging app (link previews).
 *   2. A landing that puts the recipient into the game instead of a menu.
 *   3. A way back to the sender (rematch), so one share becomes a rally.
 *   4. Attribution, so the loop can actually be measured and tuned.
 *
 * Everything here is pure and dependency-free apart from the storage/analytics
 * wrappers, so the loop can be unit-tested without a DOM or a network.
 */

import { storageGet, storageSet, storageRemove, storageGetJSON, storageSetJSON } from './safeStorage';
import { trackEvent } from './analytics';

/** What kind of share produced a link. Kept short — it rides in the URL. */
export type ShareKind = 'challenge' | 'rematch' | 'daily' | 'score';

export const SHARE_KINDS: ShareKind[] = ['challenge', 'rematch', 'daily', 'score'];

const VISITOR_KEY = 'sg_visitor_id';
const REFERRAL_KEY = 'sg_referral';
const INVITES_SENT_KEY = 'sg_invites_sent';

/* ────────────────────────────── identity ────────────────────────────── */

/**
 * A stable, anonymous id for this browser. Used only to attribute an invite to
 * the person who sent it — it carries no personal data and is never sent to a
 * third party.
 */
export function getVisitorId(): string {
  const existing = storageGet(VISITOR_KEY);
  if (existing) return existing;
  const id = randomId();
  storageSet(VISITOR_KEY, id);
  return id;
}

function randomId(): string {
  try {
    const buf = new Uint8Array(6);
    crypto.getRandomValues(buf);
    return Array.from(buf, b => b.toString(36).padStart(2, '0')).join('').slice(0, 10);
  } catch {
    return Math.random().toString(36).slice(2, 12);
  }
}

/* ──────────────────────────── link building ─────────────────────────── */

export interface ShareLinkOptions {
  kind: ShareKind;
  /** Encoded challenge payload, for challenge/rematch links. */
  code?: string;
  /** Anonymous id of the sender. Defaults to this visitor. */
  ref?: string;
  /** Origin override — injected in tests, otherwise read from `location`. */
  origin?: string;
}

/**
 * Build an outbound share link.
 *
 * Links point at `/s`, a tiny server route that renders per-share Open Graph
 * tags before bouncing the visitor into the app. That is what makes a link
 * pasted into WhatsApp / iMessage / X unfurl as "Yotam scored 2,450 — beat it?"
 * instead of a generic card that nobody taps.
 */
export function buildShareLink(opts: ShareLinkOptions): string {
  const origin = opts.origin ?? safeOrigin();
  const params = new URLSearchParams();
  params.set('k', opts.kind);
  if (opts.code) params.set('c', opts.code);
  const ref = opts.ref ?? safeVisitorId();
  if (ref) params.set('r', ref);
  return `${origin}/s?${params.toString()}`;
}

function safeOrigin(): string {
  try {
    return window.location.origin;
  } catch {
    return '';
  }
}

function safeVisitorId(): string {
  try {
    return getVisitorId();
  } catch {
    return '';
  }
}

/* ───────────────────────────── attribution ──────────────────────────── */

export interface ReferralInfo {
  /** Anonymous id of whoever sent the link. */
  ref: string;
  kind: ShareKind;
  /** Epoch ms the link was opened. */
  at: number;
}

/**
 * Read referral attribution out of a query string. Pure: pass the search
 * string and the clock, get the attribution (or null) back.
 */
export function parseReferral(search: string, now: number = Date.now()): ReferralInfo | null {
  try {
    const params = new URLSearchParams(search);
    const ref = params.get('r');
    if (!ref) return null;
    const rawKind = params.get('k');
    const kind = SHARE_KINDS.includes(rawKind as ShareKind) ? (rawKind as ShareKind) : 'challenge';
    return { ref, kind, at: now };
  } catch {
    return null;
  }
}

/**
 * Record an inbound referral, first-touch wins: a visitor who arrives via a
 * friend's link and later opens a second link still credits the first friend.
 * Returns the attribution actually held after the call.
 */
export function captureReferral(search: string, now: number = Date.now()): ReferralInfo | null {
  const incoming = parseReferral(search, now);
  if (!incoming) return getStoredReferral();

  const existing = getStoredReferral();
  if (existing) return existing;

  // Never credit someone for inviting themselves.
  if (incoming.ref === safeVisitorId()) return null;

  storageSetJSON(REFERRAL_KEY, { ...incoming, converted: false });
  trackEvent('invite_opened', { kind: incoming.kind });
  return incoming;
}

interface StoredReferral extends ReferralInfo {
  converted?: boolean;
}

export function getStoredReferral(): ReferralInfo | null {
  const stored = storageGetJSON<StoredReferral | null>(REFERRAL_KEY, null);
  if (!stored || typeof stored.ref !== 'string' || !stored.ref) return null;
  return { ref: stored.ref, kind: stored.kind, at: stored.at };
}

/**
 * Call when a referred visitor finishes their first game. Fires the conversion
 * event exactly once per referral — the denominator of the k-factor.
 */
export function markReferralConverted(): ReferralInfo | null {
  const stored = storageGetJSON<StoredReferral | null>(REFERRAL_KEY, null);
  if (!stored || !stored.ref || stored.converted) return null;
  storageSetJSON(REFERRAL_KEY, { ...stored, converted: true });
  trackEvent('invite_converted', { kind: stored.kind, msToConvert: Date.now() - (stored.at ?? Date.now()) });
  return { ref: stored.ref, kind: stored.kind, at: stored.at };
}

export function clearReferral(): void {
  storageRemove(REFERRAL_KEY);
}

/* ────────────────────────── invites sent (k-factor) ─────────────────── */

/** Count of share links this visitor has created — the numerator of k. */
export function getInvitesSent(): number {
  const raw = parseInt(storageGet(INVITES_SENT_KEY) ?? '0', 10);
  return Number.isFinite(raw) && raw > 0 ? raw : 0;
}

export function recordInviteSent(kind: ShareKind, meta?: Record<string, unknown>): number {
  const next = getInvitesSent() + 1;
  storageSet(INVITES_SENT_KEY, String(next));
  trackEvent('invite_sent', { kind, totalSent: next, ...meta });
  return next;
}

/* ────────────────────────────── share copy ──────────────────────────── */

export interface FlexInput {
  score: number;
  accuracy: number;
  bestStreak: number;
  /** Global rank, when the leaderboard is reachable. Omitted otherwise. */
  rank?: number | null;
  totalRanked?: number | null;
}

/**
 * The one-line brag that sits above the link.
 *
 * Only claims things that are actually true and known — a percentile is shown
 * only when a real rank came back from the leaderboard, never fabricated.
 */
export function buildFlexLine(input: FlexInput): string {
  const parts: string[] = [];
  if (input.accuracy >= 100) parts.push('PERFECT ROUND');
  else if (input.bestStreak >= 5) parts.push(`${input.bestStreak} in a row`);
  else if (input.accuracy > 0) parts.push(`${input.accuracy}% accuracy`);

  const pct = percentileLabel(input.rank, input.totalRanked);
  if (pct) parts.push(pct);

  return parts.join(' · ');
}

/**
 * "Top 5%" style label, or null when there isn't enough data to be honest
 * about it. A rank in a field of three people is not a percentile.
 */
export function percentileLabel(rank?: number | null, total?: number | null): string | null {
  if (!rank || !total || rank < 1 || total < 20) return null;
  const pct = Math.max(1, Math.round((rank / total) * 100));
  if (pct > 50) return null; // nobody brags about the bottom half
  return `Top ${pct}%`;
}

export interface ChallengeCopyInput {
  senderName: string;
  score: number;
  url: string;
  /** Emoji result grid, e.g. "🟢🟡🟢". */
  grid?: string;
  flex?: string;
}

/** Copy for "I dare you" — the first link in a rally. */
export function buildChallengeText(input: ChallengeCopyInput): string {
  const lines = [`🏀 I scored ${input.score.toLocaleString()} on WHO IS IT?`];
  if (input.grid) lines.push(input.grid);
  if (input.flex) lines.push(input.flex);
  lines.push('Think you can beat that?', input.url);
  return lines.join('\n');
}

export interface RematchCopyInput extends ChallengeCopyInput {
  /** Who sent the challenge you just answered. */
  opponentName: string;
  opponentScore: number;
  won: boolean;
}

/**
 * Copy for the return leg. This is the mechanic that turns a one-shot share
 * into a back-and-forth: it names the opponent and hands the ball back.
 */
export function buildRematchText(input: RematchCopyInput): string {
  const opponent = input.opponentName?.trim() || 'You';
  const head = input.won
    ? `😤 ${opponent} scored ${input.opponentScore.toLocaleString()}. I got ${input.score.toLocaleString()}.`
    : `${opponent} got me — ${input.opponentScore.toLocaleString()} to ${input.score.toLocaleString()}. Rematch.`;
  const lines = [head];
  if (input.grid) lines.push(input.grid);
  lines.push('Your turn 🏀', input.url);
  return lines.join('\n');
}
