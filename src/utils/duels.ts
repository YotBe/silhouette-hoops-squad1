import { supabase, isSupabaseEnabled } from '@/lib/supabase';
import { PLAYERS, generateChoices } from '@/data/players';

export interface DuelRoom {
  id: string;
  room_code: string;
  host_name: string;
  guest_name: string | null;
  player_ids: string[];
  host_score: number;
  guest_score: number;
  host_current_round: number;
  guest_current_round: number;
  status: 'waiting' | 'playing' | 'done';
  created_at: string;
}

function randomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function pickDuelPlayers(): string[] {
  // 5 random players from all tiers — balanced: 1 rookie, 1 pro, 1 allstar, 1 mvp, 1 legend
  const byTier: Record<string, string[]> = {};
  for (const p of PLAYERS) {
    if (!byTier[p.tier]) byTier[p.tier] = [];
    byTier[p.tier].push(p.id);
  }
  const tiers = ['rookie', 'pro', 'allstar', 'mvp', 'legend'];
  return tiers.map(t => {
    const arr = byTier[t] ?? byTier['rookie'];
    return arr[Math.floor(Math.random() * arr.length)];
  });
}

export async function createDuelRoom(hostName: string): Promise<DuelRoom | null> {
  if (!isSupabaseEnabled || !supabase) {
    // Offline fallback: create an ephemeral local duel (single-player vs ghost)
    const code = randomCode();
    return {
      id: code,
      room_code: code,
      host_name: hostName,
      guest_name: null,
      player_ids: pickDuelPlayers(),
      host_score: 0,
      guest_score: 0,
      host_current_round: 0,
      guest_current_round: 0,
      status: 'waiting',
      created_at: new Date().toISOString(),
    };
  }

  const code = randomCode();
  const playerIds = pickDuelPlayers();
  const { data, error } = await supabase
    .from('sg_duels')
    .insert({ room_code: code, host_name: hostName, player_ids: playerIds })
    .select()
    .single();
  if (error) { console.error('createDuelRoom error:', error); return null; }
  return data as DuelRoom;
}

export async function joinDuelRoom(code: string, guestName: string): Promise<DuelRoom | null> {
  if (!isSupabaseEnabled || !supabase) return null;
  const upper = code.toUpperCase().trim();
  const { data: room, error: fetchErr } = await supabase
    .from('sg_duels')
    .select('*')
    .eq('room_code', upper)
    .eq('status', 'waiting')
    .single();
  if (fetchErr || !room) return null;

  const { data: updated, error: updateErr } = await supabase
    .from('sg_duels')
    .update({ guest_name: guestName, status: 'playing' })
    .eq('id', room.id)
    .select()
    .single();
  if (updateErr) { console.error('joinDuelRoom error:', updateErr); return null; }
  return updated as DuelRoom;
}

export async function updateDuelProgress(
  roomId: string,
  role: 'host' | 'guest',
  round: number,
  score: number,
  done = false
): Promise<void> {
  if (!isSupabaseEnabled || !supabase) return;
  const updates: Record<string, unknown> = {
    [`${role}_current_round`]: round,
    [`${role}_score`]: score,
  };
  if (done) {
    // Check if other side is also done — if so, mark room as done
    const col = role === 'host' ? 'guest_current_round' : 'host_current_round';
    const { data } = await supabase.from('sg_duels').select(col).eq('id', roomId).single();
    const otherRound = data?.[col] ?? 0;
    if (otherRound >= 5) updates.status = 'done';
  }
  await supabase.from('sg_duels').update(updates).eq('id', roomId);
}

export async function getDuelRoom(roomId: string): Promise<DuelRoom | null> {
  if (!isSupabaseEnabled || !supabase) return null;
  const { data, error } = await supabase.from('sg_duels').select('*').eq('id', roomId).single();
  if (error) return null;
  return data as DuelRoom;
}
