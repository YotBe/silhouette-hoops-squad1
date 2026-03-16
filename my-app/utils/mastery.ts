import { storage } from './storage';

const STORAGE_KEY = 'sg_mastery';

interface PlayerMastery {
  totalCorrect: number;
  fastCorrect: number;
  noHintCorrect: number;
}

type MasteryStore = Record<string, PlayerMastery>;

function load(): MasteryStore {
  try { return JSON.parse(storage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
}

function save(store: MasteryStore): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function recordMastery(playerId: string, timeLeftPct: number, hintsUsed: number): void {
  const store = load();
  if (!store[playerId]) store[playerId] = { totalCorrect: 0, fastCorrect: 0, noHintCorrect: 0 };
  store[playerId].totalCorrect += 1;
  if (timeLeftPct > 0.5) store[playerId].fastCorrect += 1;
  if (hintsUsed === 0) store[playerId].noHintCorrect += 1;
  save(store);
}

export function getMasteryLevel(playerId: string): 0 | 1 | 2 | 3 {
  const store = load();
  const m = store[playerId];
  if (!m || m.totalCorrect === 0) return 0;
  if (m.fastCorrect >= 3 && m.noHintCorrect >= 3) return 3;
  if (m.noHintCorrect >= 3) return 2;
  return 1;
}
