#!/usr/bin/env node
/**
 * Reports how much of the roster can actually be shown as video.
 *
 * The game's core mode is "watch the clip, guess the player", but a player
 * whose clip is missing or undecodable silently degrades to a still
 * silhouette. This prints the real picture and lists exactly which clips are
 * still needed.
 *
 * Run: npm run videos:report
 */

import { readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function readSource(...parts) {
  return readFileSync(join(root, ...parts), 'utf8');
}

/** Pull `id` / `name` / `videoFile` triples straight out of the data file. */
function parsePlayers() {
  const src = readSource('src', 'data', 'players.ts');
  const players = [];
  const re = /id:\s*'([^']+)',\s*name:\s*'([^']+)'[\s\S]*?videoFile:\s*'([^']*)'/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    players.push({ id: m[1], name: m[2], videoFile: m[3] });
  }
  return players;
}

function parseManifest() {
  const src = readSource('src', 'data', 'videoManifest.ts');
  const assets = new Map();
  const re = /\{ file: '([^']+)', codec: '([^']+)', bytes: (\d+), playable: (true|false) \}/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    assets.set(m[1], { file: m[1], codec: m[2], bytes: Number(m[3]), playable: m[4] === 'true' });
  }
  return assets;
}

const players = parsePlayers();
const assets = parseManifest();
const basename = f => f.slice(f.lastIndexOf('/') + 1);

const playable = [];
const unplayable = [];
const missing = [];
const noVideo = [];

for (const p of players) {
  if (!p.videoFile) { noVideo.push(p); continue; }
  if (/^https?:\/\//.test(p.videoFile)) { playable.push(p); continue; }
  const asset = assets.get(basename(p.videoFile));
  if (!asset) missing.push(p);
  else if (!asset.playable) unplayable.push({ ...p, codec: asset.codec });
  else playable.push(p);
}

const total = players.length;
const pct = n => `${((n / total) * 100).toFixed(1)}%`;
const totalBytes = [...assets.values()].reduce((s, a) => s + a.bytes, 0);

console.log(`\nVideo coverage — ${total} players\n`);
console.log(`  playable video      ${String(playable.length).padStart(4)}  ${pct(playable.length)}`);
console.log(`  clip missing        ${String(missing.length).padStart(4)}  ${pct(missing.length)}`);
console.log(`  clip unplayable     ${String(unplayable.length).padStart(4)}  ${pct(unplayable.length)}`);
console.log(`  no video declared   ${String(noVideo.length).padStart(4)}  ${pct(noVideo.length)}`);

if (unplayable.length) {
  console.log(`\nUnplayable codec (present on disk, blank in some browsers):`);
  for (const p of unplayable) console.log(`  ${p.id.padEnd(16)} ${p.videoFile}  [${p.codec}]`);
  console.log(`  → re-encode to H.264:  ffmpeg -i in.mov -c:v libx264 -crf 23 -c:a aac out.mp4`);
}

if (missing.length) {
  console.log(`\nClips still needed (${missing.length}):`);
  const width = Math.max(...missing.map(p => p.name.length));
  for (const p of missing) console.log(`  ${p.name.padEnd(width)}  ${p.videoFile}`);
}

const avgBytes = assets.size ? totalBytes / assets.size : 0;
if (avgBytes > 0) {
  const projected = (avgBytes * total) / 1024 / 1024;
  console.log(`\nHosting: ${assets.size} clips currently occupy ${(totalBytes / 1024 / 1024).toFixed(0)} MB.`);
  console.log(`At that average, ${total} clips would be ~${projected.toFixed(0)} MB — too large to commit or`);
  console.log(`deploy. Set VITE_VIDEO_CDN_BASE to serve them from a CDN instead.`);
}

console.log('');
// Unplayable clips are an actionable defect; missing clips are just content
// still to be produced, so only the former fails the check.
process.exit(unplayable.length > 0 ? 1 : 0);
