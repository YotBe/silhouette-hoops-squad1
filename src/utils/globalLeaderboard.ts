import { supabase, isSupabaseEnabled } from '@/lib/supabase';
import { getCurrentSeasonId } from './seasons';
import { supabaseLimiter } from './rateLimiter';

export interface LeaderboardEntry {
  id: string;
  player_name: string;
  score: number;
  tier: string;
  streak: number;
  accuracy: number;
  season_week: number;
  created_at: string;
}

export interface SubmitScorePayload {
  playerName: string;
  score: number;
  tier: string;
  streak: number;
  accuracy: number;
}

export async function submitGlobalScore(payload: SubmitScorePayload): Promise<void> {
  if (!isSupabaseEnabled || !supabase) return;
  if (!supabaseLimiter.tryConsume()) return; // silently drop if rate-limited
  const season_week = getCurrentSeasonId();
  await supabase.from('sg_leaderboard').insert({
    player_name: payload.playerName || 'Anonymous',
    score: payload.score,
    tier: payload.tier,
    streak: payload.streak,
    accuracy: payload.accuracy,
    season_week,
  });
}

export async function getGlobalLeaderboard(
  tier: string,
  seasonId?: number
): Promise<LeaderboardEntry[]> {
  if (!isSupabaseEnabled || !supabase) return [];
  if (!supabaseLimiter.tryConsume()) return [];
  const season = seasonId ?? getCurrentSeasonId();
  const { data, error } = await supabase
    .from('sg_leaderboard')
    .select('*')
    .eq('tier', tier)
    .eq('season_week', season)
    .order('score', { ascending: false })
    .limit(25);
  if (error) { return []; }
  return data ?? [];
}

export async function getPlayerGlobalRank(
  score: number,
  tier: string,
  seasonId?: number
): Promise<number | null> {
  if (!isSupabaseEnabled || !supabase) return null;
  if (!supabaseLimiter.tryConsume()) return null;
  const season = seasonId ?? getCurrentSeasonId();
  const { count } = await supabase
    .from('sg_leaderboard')
    .select('*', { count: 'exact', head: true })
    .eq('tier', tier)
    .eq('season_week', season)
    .gt('score', score);
  return count !== null ? count + 1 : null;
}
