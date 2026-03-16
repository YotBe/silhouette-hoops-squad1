import { PLAYERS, Player, generateChoices } from '@/data/players';

function seededRandom(seed: string): () => number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

export function getDailySeed(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function getDailyPlayers(): Player[] {
  const seed = getDailySeed();
  const rng = seededRandom(seed);
  const shuffled = [...PLAYERS].sort(() => rng() - 0.5);
  return shuffled.slice(0, Math.min(3, shuffled.length));
}

export function getDailyChoices(player: Player): Player[] {
  return generateChoices(player, PLAYERS);
}

export function isDailyChallengeCompleted(): boolean {
  try {
    return localStorage.getItem('sg_daily_date') === getDailySeed();
  } catch { return false; }
}

export interface DailyResult {
  score: number;
  answers: boolean[];
  answerDetails?: Array<{ correct: boolean; hintsUsed: number }>;
  players: string[];
  date: string;
}

export function getDailyChallengeNumber(): number {
  const epoch = new Date('2025-01-01').getTime();
  const now = new Date().getTime();
  return Math.floor((now - epoch) / 86400000) + 1;
}

export function saveDailyResult(result: DailyResult) {
  try {
    localStorage.setItem('sg_daily_date', result.date);
    localStorage.setItem('sg_daily_result', JSON.stringify(result));
  } catch {}
}

export function getDailyResult(): DailyResult | null {
  try {
    const r = localStorage.getItem('sg_daily_result');
    if (!r) return null;
    const parsed = JSON.parse(r) as DailyResult;
    if (parsed.date !== getDailySeed()) return null;
    return parsed;
  } catch { return null; }
}

export function getTimeUntilNextChallenge(): { hours: number; minutes: number; seconds: number } {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const ms = tomorrow.getTime() - now.getTime();
  return {
    hours: Math.floor(ms / 3600000),
    minutes: Math.floor((ms % 3600000) / 60000),
    seconds: Math.floor((ms % 60000) / 1000),
  };
}

export function getDailyShareText(result: DailyResult): string {
  const num = getDailyChallengeNumber();
  const emojiGrid = result.answerDetails
    ? result.answerDetails.map(a => !a.correct ? '🔴' : a.hintsUsed > 0 ? '🟡' : '🟢').join('')
    : result.answers.map(a => a ? '🟢' : '🔴').join('');
  return `WHO IS IT? 🏀 Day #${num}\n${emojiGrid}\nScore: ${result.score} | #WhoIsItNBA\nwhoisit.app`;
}
