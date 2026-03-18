// Cache key: playerid + sorted hintsRevealed
// Calls Claude claude-haiku-4-5-20251001 (fast, cheap) to generate a clue

import { claudeLimiter } from './rateLimiter';

const cache = new Map<string, string>();

function getCacheKey(playerId: string, hintsAlreadyShown: string[]): string {
  return `${playerId}:${[...hintsAlreadyShown].sort().join(',')}`;
}

export async function generateAIClue(
  player: {
    name: string;
    team: string;
    position: string;
    number: number;
    college?: string;
    draftYear?: number;
    facts: string[];
    stats?: { ppg: string; rpg: string; apg: string };
    clues?: [string, string, string];
    tier: string;
  },
  hintsAlreadyShown: string[],  // clue texts already revealed to the player
  attemptNumber: number,  // 1, 2, or 3
): Promise<string | null> {
  const apiKey = import.meta.env.VITE_CLAUDE_API_KEY as string | undefined;
  if (!apiKey) return null;

  const cacheKey = getCacheKey(player.name, hintsAlreadyShown);
  if (cache.has(cacheKey)) return cache.get(cacheKey)!;

  const difficulty = attemptNumber === 1 ? 'very vague and cryptic' : attemptNumber === 2 ? 'moderately specific' : 'fairly specific but do not mention the player name or team name';

  const systemPrompt = `You are generating clues for an NBA trivia guessing game where players try to identify an NBA player shown in a disguise/costume.
Generate ONE single clue that is ${difficulty}.
Rules:
- Never mention the player's name, nickname, or team name
- Don't repeat information from already-shown clues
- Keep it to 1 sentence, max 15 words
- Be creative and engaging — this is a fun game
- For vague clues: reference achievements, style, or era. For specific: stats or unique traits.
Respond with ONLY the clue text, nothing else.`;

  const userPrompt = `Player info:
- Position: ${player.position}
- Jersey: #${player.number}
- College: ${player.college ?? 'Undrafted/International'}
- Draft year: ${player.draftYear ?? 'Unknown'}
- Career stats: ${player.stats ? `${player.stats.ppg} PPG, ${player.stats.rpg} RPG, ${player.stats.apg} APG` : 'N/A'}
- Key facts: ${player.facts.join(' | ')}
- Tier (difficulty): ${player.tier}

Clues already shown to the user (do NOT repeat these ideas):
${hintsAlreadyShown.length ? hintsAlreadyShown.map((c, i) => `${i + 1}. ${c}`).join('\n') : 'None yet'}

Generate clue #${attemptNumber}:`;

  // Respect rate limit — skip rather than error
  if (!claudeLimiter.tryConsume()) return null;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 60,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const clue = data.content?.[0]?.text?.trim();
    if (clue) cache.set(cacheKey, clue);
    return clue ?? null;
  } catch {
    return null;
  }
}
