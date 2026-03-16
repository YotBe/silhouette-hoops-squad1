const STORAGE_KEY = 'sg_collection';
const SEEN_KEY = 'sg_seen';

function getCollection(): Set<string> {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return new Set(Array.isArray(raw) ? raw : []);
  } catch { return new Set(); }
}

export function getCollectedIds(): string[] {
  return [...getCollection()];
}

export function markCollected(playerId: string): void {
  const collection = getCollection();
  if (!collection.has(playerId)) {
    // Track newly collected this session
    try {
      const session = new Set(JSON.parse(sessionStorage.getItem('sg_session_collected') || '[]'));
      session.add(playerId);
      sessionStorage.setItem('sg_session_collected', JSON.stringify([...session]));
    } catch {}
  }
  collection.add(playerId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...collection]));
}

export function getSessionCollected(): Set<string> {
  try {
    return new Set(JSON.parse(sessionStorage.getItem('sg_session_collected') || '[]'));
  } catch {
    return new Set();
  }
}

export function isCollected(playerId: string): boolean {
  return getCollection().has(playerId);
}

function getSeen(): Set<string> {
  try {
    const raw = JSON.parse(localStorage.getItem(SEEN_KEY) || '[]');
    return new Set(Array.isArray(raw) ? raw : []);
  } catch { return new Set(); }
}

/** Mark a player as encountered (any round, correct or wrong). */
export function markSeen(playerId: string): void {
  const seen = getSeen();
  if (!seen.has(playerId)) {
    seen.add(playerId);
    localStorage.setItem(SEEN_KEY, JSON.stringify([...seen]));
  }
}

export function isSeen(playerId: string): boolean {
  return getSeen().has(playerId);
}

export function getSeenIds(): string[] {
  return [...getSeen()];
}
