import { storage } from './storage';

const STORAGE_KEY = 'sg_collection';
const SEEN_KEY = 'sg_seen';

function getCollection(): Set<string> {
  try {
    const raw = JSON.parse(storage.getItem(STORAGE_KEY) || '[]');
    return new Set(Array.isArray(raw) ? raw : []);
  } catch { return new Set(); }
}

export function getCollectedIds(): string[] {
  return [...getCollection()];
}

export function markCollected(playerId: string): void {
  const collection = getCollection();
  collection.add(playerId);
  storage.setItem(STORAGE_KEY, JSON.stringify([...collection]));
}

export function isCollected(playerId: string): boolean {
  return getCollection().has(playerId);
}

function getSeen(): Set<string> {
  try {
    const raw = JSON.parse(storage.getItem(SEEN_KEY) || '[]');
    return new Set(Array.isArray(raw) ? raw : []);
  } catch { return new Set(); }
}

export function markSeen(playerId: string): void {
  const seen = getSeen();
  if (!seen.has(playerId)) {
    seen.add(playerId);
    storage.setItem(SEEN_KEY, JSON.stringify([...seen]));
  }
}

export function isSeen(playerId: string): boolean {
  return getSeen().has(playerId);
}

export function getSeenIds(): string[] {
  return [...getSeen()];
}
