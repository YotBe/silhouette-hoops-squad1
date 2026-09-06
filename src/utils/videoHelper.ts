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
 * Whether a clip can actually be shown to a typical visitor.
 *
 * Absolute URLs are trusted — they are served from somewhere this manifest
 * cannot see. Local paths must exist and use a codec that plays everywhere:
 * an HEVC clip is present on disk but blank in Firefox.
 */
export function hasPlayableVideo(player: Pick<Player, 'videoFile'>): boolean {
  const file = player.videoFile;
  if (!file) return false;
  if (isAbsolute(file) || CDN_BASE) return true;
  return videoAssetFor(file)?.playable === true;
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
export function shouldAttemptVideo(videoFile: string | undefined): boolean {
  if (!videoFile) return false;
  if (isAbsolute(videoFile) || CDN_BASE) return true;
  const asset = videoAssetFor(videoFile);
  if (!asset) return false; // not on disk — do not request a 404
  return asset.playable || canPlayCodec(asset.codec);
}

/** Players whose clip will really play — the pool a video-only round can use. */
export function playersWithVideo<T extends Pick<Player, 'videoFile'>>(players: T[]): T[] {
  return players.filter(hasPlayableVideo);
}

function isAbsolute(file: string): boolean {
  return file.startsWith('http://') || file.startsWith('https://');
}

/**
 * The URL to load a player's clip from: the CDN when one is configured,
 * otherwise the path as authored.
 */
export function resolveVideoUrl(videoFile: string | undefined): string {
  if (!videoFile) return '';
  if (isAbsolute(videoFile)) return videoFile;
  if (!CDN_BASE) return videoFile;
  return `${CDN_BASE}/${videoFileName(videoFile)}`;
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
 * Below this many playable clips, a video-first round would serve the same
 * handful of players on repeat — worse than mixing in silhouettes. The policy
 * therefore follows content coverage rather than being hardcoded, so the game
 * becomes video-led on its own as clips are added.
 */
export const MIN_VIDEO_POOL = 20;

export function recommendedPolicy(players: Pick<Player, 'videoFile'>[]): VideoPolicy {
  const override = import.meta.env?.VITE_VIDEO_POLICY as VideoPolicy | undefined;
  if (override === 'video-only' || override === 'video-first' || override === 'any') return override;
  return playersWithVideo(players).length >= MIN_VIDEO_POOL ? 'video-first' : 'any';
}

/**
 * Narrow a candidate pool according to the policy.
 *
 * Never returns an empty pool for `video-first`: running out of clips falls
 * back to the full pool rather than stalling the round. `video-only` may
 * return empty — that is the caller's signal that there is no video content
 * left to show.
 */
export function applyVideoPolicy<T extends Pick<Player, 'videoFile'>>(pool: T[], policy: VideoPolicy): T[] {
  if (policy === 'any') return pool;
  const withVideo = playersWithVideo(pool);
  if (policy === 'video-only') return withVideo;
  return withVideo.length > 0 ? withVideo : pool;
}
