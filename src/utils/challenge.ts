export interface ChallengeData {
  playerIds: string[];
  score: number;
  name: string;
  tier: string;
}

export function encodeChallenge(data: ChallengeData): string {
  try {
    return btoa(JSON.stringify({ p: data.playerIds, s: data.score, n: data.name, t: data.tier }));
  } catch {
    return '';
  }
}

export function decodeChallenge(code: string): ChallengeData | null {
  try {
    const raw = JSON.parse(atob(code));
    if (!Array.isArray(raw.p) || raw.p.length === 0) return null;
    return { playerIds: raw.p, score: raw.s ?? 0, name: raw.n ?? 'Someone', tier: raw.t ?? 'rookie' };
  } catch {
    return null;
  }
}

export function getChallengeFromURL(): ChallengeData | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('challenge');
    if (!code) return null;
    return decodeChallenge(code);
  } catch {
    return null;
  }
}

export function buildChallengeURL(data: ChallengeData): string {
  const code = encodeChallenge(data);
  const base = window.location.origin + window.location.pathname;
  return `${base}?challenge=${code}`;
}
