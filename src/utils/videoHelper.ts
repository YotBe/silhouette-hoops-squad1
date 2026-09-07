/**
 * Resolving and validating player video content.
 *
 * The game's headline mode shows a clip of a player in disguise. That mode is
 * only as good as the content behind it, and the content is not described
 * honestly by `Player.videoFile` alone: most players carry a path to a file
 * that does not exist, and a missing or unplayable clip fails silently into
 * the black-silhouette fallback. These helpers answer "can we really show a
 * video for this player?" so selection logic can act on the truth.
 */

import { VIDEO_ASSET_BY_FILE, type VideoAsset } from '@/data/videoManifest';
import type { Player } from '@/data/players';

/**
 * Optional CDN origin for video content, e.g. "https://cdn.example.com/videos".
 *
 * Clips are large — the ten currently committed take 62 MB — so a full roster
 * cannot live in the repo and still deploy. Setting VITE_VIDEO_CDN_BASE moves
 * them off the bundle without touching player data.
 */
const CDN_BASE = (import.meta.env?.VITE_VIDEO_CDN_BASE ?? '').replace(/\/+$/, '');

/** The basename of a videoFile path, or '' when there is no video. */
export function videoFileName(videoFile: string | undefined): string {
  if (!videoFile) return '';
  const clean = videoFile.split('?')[0].split('#')[0];
  return clean.slice(clean.lastIndexOf('/') + 1);
}

/** Manifest entry for a player's clip, when the file exists locally. */
export function videoAssetFor(videoFile: string | undefined): VideoAsset | undefined {
  const name = videoFileName(videoFile);
  return name ? VIDEO_ASSET_BY_FILE.get(name) : undefined;
}

/**
 * Extensions to try for a player's clip, best first. A playable container is
 * always preferred over an unplayable one for the same player.
 */
const PREFERRED_EXT = ['mp4', 'webm', 'm4v', 'mov'] as const;

/**
 * Find a player's clip by naming convention: `public/videos/<playerId>.mp4`.
 *
 * Every clip in the project already follows this convention, so resolving by
 * id rather than by a hand-written path means adding content is a file drop —
 * name the clip after the player id, regenerate the manifest, and that player
 * is live. No data edit, and no way for the path in players.ts to drift out of
 * sync with what is on disk.
 */
export function videoAssetForPlayer(player: Pick<Player, 'id' | 'videoFile'>): VideoAsset | undefined {
  for (const ext of PREFERRED_EXT) {
    const asset = VIDEO_ASSET_BY_FILE.get(`${player.id}.${ext}`);
    if (asset?.playable) return asset;
  }
  // Nothing universally playable — fall back to any clip for this player and
  // let the browser probe decide (Safari can take the HEVC one).
  for (const ext of PREFERRED_EXT) {
    const asset = VIDEO_ASSET_BY_FILE.get(`${player.id}.${ext}`);
    if (asset) return asset;
  }
  return videoAssetFor(player.videoFile);
}

/**
 * Whether a clip can actually be shown to a typical visitor.
 *
 * Absolute URLs are trusted — they are served from somewhere this manifest
 * cannot see. Local paths must exist and use a codec that plays everywhere:
 * an HEVC clip is present on disk but blank in Firefox.
 */
export function hasPlayableVideo(player: Pick<Player, 'id' | 'videoFile'>): boolean {
  const file = player.videoFile;
  if (file && (isAbsolute(file) || CDN_BASE)) return true;
  return videoAssetForPlayer(player)?.playable === true;
}

/**
 * Whether *this* browser can decode a codec.
 *
 * Distinct from `hasPlayableVideo`, which asks whether a clip is safe to ship
 * to everyone. An HEVC clip is fine in Safari and blank in Firefox — asking
 * the browser directly means Safari still gets the video while Firefox skips
 * straight to the silhouette instead of downloading 14 MB and then failing.
 */
export function canPlayCodec(codec: VideoAsset['codec']): boolean {
  const probe = CODEC_PROBE[codec];
  if (!probe) return true; // unknown codec: let the element try
  try {
    return document.createElement('video').canPlayType(probe) !== '';
  } catch {
    return true;
  }
}

const CODEC_PROBE: Partial<Record<VideoAsset['codec'], string>> = {
  hevc: 'video/mp4; codecs="hvc1"',
  h264: 'video/mp4; codecs="avc1.42E01E"',
  vp9: 'video/webm; codecs="vp9"',
  av1: 'video/mp4; codecs="av01.0.05M.08"',
};

/**
 * Whether to attempt loading this clip in the current browser at all.
 * Prevents a large download that is guaranteed to fail.
 */
export function shouldAttemptVideo(player: Pick<Player, 'id' | 'videoFile'>): boolean {
  const file = player.videoFile;
  if (file && (isAbsolute(file) || CDN_BASE)) return true;
  const asset = videoAssetForPlayer(player);
  if (!asset) return false; // not on disk — do not request a 404
  return asset.playable || canPlayCodec(asset.codec);
}

/** Players whose clip will really play — the pool a video-only round can use. */
export function playersWithVideo<T extends Pick<Player, 'id' | 'videoFile'>>(players: T[]): T[] {
  return players.filter(hasPlayableVideo);
}

function isAbsolute(file: string): boolean {
  return file.startsWith('http://') || file.startsWith('https://');
}

/**
 * The URL to load a player's clip from: the CDN when one is configured,
 * otherwise the path as authored.
 */
export function resolveVideoUrl(player: Pick<Player, 'id' | 'videoFile'>): string {
  const file = player.videoFile;
  if (file && isAbsolute(file)) return file;
  // The manifest is authoritative over the declared path: it reflects what is
  // actually on disk, including a clip added since players.ts was last edited.
  const name = videoAssetForPlayer(player)?.file ?? videoFileName(file);
  if (!name) return '';
  return CDN_BASE ? `${CDN_BASE}/${name}` : `/videos/${name}`;
}

export interface VideoCoverage {
  totalPlayers: number;
  /** Players that will really play a clip. */
  withPlayableVideo: number;
  /** Players claiming a videoFile that is missing or unplayable. */
  claimingBrokenVideo: number;
  /** Players with no video at all — silhouette fallback by design. */
  withoutVideo: number;
  brokenIds: string[];
}

/** Content coverage, for the manifest test and the coverage report script. */
export function videoCoverage(players: Player[]): VideoCoverage {
  const broken = players.filter(p => p.videoFile && !hasPlayableVideo(p));
  return {
    totalPlayers: players.length,
    withPlayableVideo: players.filter(hasPlayableVideo).length,
    claimingBrokenVideo: broken.length,
    withoutVideo: players.filter(p => !p.videoFile).length,
    brokenIds: broken.map(p => p.id),
  };
}

/* ─────────────────────────── selection policy ──────────────────────────── */

/**
 * How strongly a round should prefer players with a real clip.
 *
 * - `video-only`  — never show a player without a playable clip.
 * - `video-first` — draw from the video pool whenever it is non-empty.
 * - `any`         — ignore video availability (the historical behaviour).
 */
export type VideoPolicy = 'video-only' | 'video-first' | 'any';

/**
 * The clip is the game. A round that falls back to a still silhouette is a
 * different, weaker game, so the default is to serve only players we can show
 * a real clip for.
 *
 * The cost of this is repetition while the library is small: with a handful of
 * clips a session will revisit the same players. That is a deliberate trade —
 * a short video game beats a long silhouette one — and it resolves itself as
 * clips are added, with no code change.
 *
 * Override per-deployment with VITE_VIDEO_POLICY=video-first|any.
 */
export const DEFAULT_VIDEO_POLICY: VideoPolicy = 'video-only';

export function recommendedPolicy(_players?: Pick<Player, 'id' | 'videoFile'>[]): VideoPolicy {
  const override = import.meta.env?.VITE_VIDEO_POLICY as VideoPolicy | undefined;
  if (override === 'video-only' || override === 'video-first' || override === 'any') return override;
  return DEFAULT_VIDEO_POLICY;
}

/**
 * Narrow a candidate pool according to the policy.
 *
 * Never returns an empty pool for `video-first`: running out of clips falls
 * back to the full pool rather than stalling the round. `video-only` may
 * return empty — that is the caller's signal that there is no video content
 * left to show.
 */
export function applyVideoPolicy<T extends Pick<Player, 'id' | 'videoFile'>>(pool: T[], policy: VideoPolicy): T[] {
  if (policy === 'any') return pool;
  const withVideo = playersWithVideo(pool);
  if (policy === 'video-only') return withVideo;
  return withVideo.length > 0 ? withVideo : pool;
}

/**
 * The pool a round should actually draw from.
 *
 * Applies the policy, but never hands back nothing: a caller that received an
 * empty pool would have no player to ask about. Running out of clips reverts
 * to the wider pool for that draw rather than ending the game mid-session.
 */
export function selectablePool<T extends Pick<Player, 'id' | 'videoFile'>>(
  pool: T[],
  policy: VideoPolicy = recommendedPolicy(),
): T[] {
  const filtered = applyVideoPolicy(pool, policy);
  return filtered.length > 0 ? filtered : pool;
}
