#!/usr/bin/env node
/**
 * Generates src/data/videoManifest.ts from the files actually present in
 * public/videos.
 *
 * Why this exists: players.ts claims a `videoFile` for far more players than
 * there are video files. A missing clip does not fail loudly — the player
 * element errors and BlurredVideoPlayer quietly swaps in the black silhouette
 * — so the game can degrade to its fallback for most rounds while looking
 * perfectly healthy. The manifest turns "what video content do we actually
 * have?" into a fact the app and the test suite can both check.
 *
 * Codec matters as much as presence. H.265/HEVC (`hvc1`) does not play in
 * Firefox at all and is unreliable in Chrome without hardware support, so an
 * HEVC-only clip is recorded as present-but-not-reliably-playable.
 *
 * Run: npm run videos:manifest
 */

import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const VIDEO_DIR = join(root, 'public', 'videos');
const OUT_FILE = join(root, 'src', 'data', 'videoManifest.ts');

const VIDEO_EXT = /\.(mp4|mov|webm|m4v)$/i;

/**
 * Sniff the video codec from the container's sample-description atoms.
 * Crude but dependency-free, and enough to separate H.264 from HEVC.
 */
function detectCodec(path) {
  const buf = readFileSync(path);
  const text = buf.toString('latin1');
  if (text.includes('hvc1') || text.includes('hev1')) return 'hevc';
  if (text.includes('avc1')) return 'h264';
  if (text.includes('vp09') || text.includes('VP90')) return 'vp9';
  if (text.includes('av01')) return 'av1';
  return 'unknown';
}

/** Codecs that play in every browser the game targets. */
const UNIVERSAL = new Set(['h264', 'vp9', 'av1']);

function build() {
  let files = [];
  try {
    files = readdirSync(VIDEO_DIR).filter(f => VIDEO_EXT.test(f)).sort();
  } catch {
    console.warn(`[videos] no ${VIDEO_DIR} directory — writing an empty manifest`);
  }

  const entries = files.map(file => {
    const path = join(VIDEO_DIR, file);
    const codec = detectCodec(path);
    return {
      file,
      codec,
      bytes: statSync(path).size,
      playable: UNIVERSAL.has(codec),
    };
  });

  const body = entries
    .map(e => `  { file: '${e.file}', codec: '${e.codec}', bytes: ${e.bytes}, playable: ${e.playable} },`)
    .join('\n');

  writeFileSync(
    OUT_FILE,
    `/**
 * GENERATED FILE — do not edit by hand.
 * Run \`npm run videos:manifest\` after adding or removing clips.
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
${body}
];

export const VIDEO_ASSET_BY_FILE: ReadonlyMap<string, VideoAsset> = new Map(
  VIDEO_ASSETS.map(asset => [asset.file, asset]),
);
`,
    'utf8',
  );

  const playable = entries.filter(e => e.playable).length;
  const unplayable = entries.length - playable;
  console.log(`[videos] ${entries.length} file(s): ${playable} playable, ${unplayable} unplayable`);
  for (const e of entries.filter(e => !e.playable)) {
    console.warn(`[videos]   ${e.file} is ${e.codec} — will not play in Firefox and may fail in Chrome`);
  }
}

build();
