/**
 * GENERATED FILE — do not edit by hand.
 * Run `npm run videos:manifest` after adding or removing clips.
 *
 * Describes the video content that actually exists in public/videos, so the
 * game can tell a player it can really show from one it only claims to have.
 */

export type VideoCodec = 'h264' | 'hevc' | 'vp9' | 'av1' | 'unknown';

export interface VideoAsset {
  /** Basename inside public/videos. */
  file: string;
  codec: VideoCodec;
  bytes: number;
  /** False for codecs that fail in common browsers (notably HEVC). */
  playable: boolean;
}

export const VIDEO_ASSETS: VideoAsset[] = [
  { file: 'curry.mov', codec: 'hevc', bytes: 12918326, playable: false },
  { file: 'curry.mp4', codec: 'h264', bytes: 3343920, playable: true },
  { file: 'deni.mp4', codec: 'h264', bytes: 3435746, playable: true },
  { file: 'durant.mov', codec: 'hevc', bytes: 14084827, playable: false },
  { file: 'giannis.mp4', codec: 'h264', bytes: 3057447, playable: true },
  { file: 'harden.mp4', codec: 'h264', bytes: 3590516, playable: true },
  { file: 'kyrie.mov', codec: 'hevc', bytes: 9937697, playable: false },
  { file: 'kyrie.mp4', codec: 'h264', bytes: 3448621, playable: true },
  { file: 'lebron.mov', codec: 'hevc', bytes: 6798438, playable: false },
  { file: 'sga.mp4', codec: 'h264', bytes: 4054379, playable: true },
];

export const VIDEO_ASSET_BY_FILE: ReadonlyMap<string, VideoAsset> = new Map(
  VIDEO_ASSETS.map(asset => [asset.file, asset]),
);
