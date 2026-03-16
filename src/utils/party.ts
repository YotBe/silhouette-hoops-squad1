import { supabase, isSupabaseEnabled } from '@/lib/supabase';
import { PLAYERS } from '@/data/players';

export interface PartyPlayer {
  pid: string;       // session player ID (random string)
  name: string;
  score: number;
  round: number;     // rounds completed
  done: boolean;
}

export interface PartyRoom {
  id: string;
  room_code: string;
  player_ids: string[];   // NBA player IDs for the rounds
  players: PartyPlayer[];
  status: 'lobby' | 'playing' | 'done';
  round_count: number;
  created_at: string;
}

function randomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function randomPid(): string {
  return Math.random().toString(36).slice(2, 10);
}

function pickPartyPlayers(count = 5): string[] {
  const byTier: Record<string, string[]> = {};
  for (const p of PLAYERS) {
    if (!byTier[p.tier]) byTier[p.tier] = [];
    byTier[p.tier].push(p.id);
  }
  const tiers = ['rookie', 'pro', 'allstar', 'mvp', 'legend'];
  return tiers.slice(0, count).map(t => {
    const arr = byTier[t] ?? byTier['rookie'];
    return arr[Math.floor(Math.random() * arr.length)];
  });
}

export function getOrCreatePid(): string {
  let pid = sessionStorage.getItem('sg_party_pid');
  if (!pid) { pid = randomPid(); sessionStorage.setItem('sg_party_pid', pid); }
  return pid;
}

export async function createPartyRoom(hostName: string): Promise<{ room: PartyRoom; pid: string } | null> {
  const pid = getOrCreatePid();
  const code = randomCode();
  const playerIds = pickPartyPlayers(5);
  const hostEntry: PartyPlayer = { pid, name: hostName, score: 0, round: 0, done: false };

  if (!isSupabaseEnabled || !supabase) {
    return {
      room: { id: code, room_code: code, player_ids: playerIds, players: [hostEntry], status: 'lobby', round_count: 5, created_at: new Date().toISOString() },
      pid,
    };
  }

  const { data, error } = await supabase
    .from('sg_party_rooms')
    .insert({ room_code: code, player_ids: playerIds, players: [hostEntry] })
    .select().single();
  if (error) { console.error('createPartyRoom:', error); return null; }
  return { room: data as PartyRoom, pid };
}

export async function joinPartyRoom(code: string, playerName: string): Promise<{ room: PartyRoom; pid: string } | null> {
  if (!isSupabaseEnabled || !supabase) return null;
  const upper = code.toUpperCase().trim();
  const pid = getOrCreatePid();

  const { data: room, error } = await supabase
    .from('sg_party_rooms')
    .select('*')
    .eq('room_code', upper)
    .eq('status', 'lobby')
    .single();
  if (error || !room) return null;

  const players: PartyPlayer[] = room.players ?? [];
  if (players.length >= 8) return null; // full
  if (players.find(p => p.pid === pid)) return { room: room as PartyRoom, pid }; // already in

  const updated = [...players, { pid, name: playerName, score: 0, round: 0, done: false }];
  const { data: updatedRoom, error: updateErr } = await supabase
    .from('sg_party_rooms')
    .update({ players: updated })
    .eq('id', room.id)
    .select().single();
  if (updateErr) return null;
  return { room: updatedRoom as PartyRoom, pid };
}

export async function startPartyGame(roomId: string): Promise<void> {
  if (!isSupabaseEnabled || !supabase) return;
  await supabase.from('sg_party_rooms').update({ status: 'playing' }).eq('id', roomId);
}

export async function updatePartyProgress(
  roomId: string,
  pid: string,
  score: number,
  round: number,
  done: boolean,
): Promise<void> {
  if (!isSupabaseEnabled || !supabase) return;
  const { data } = await supabase.from('sg_party_rooms').select('players').eq('id', roomId).single();
  if (!data) return;
  const players: PartyPlayer[] = (data.players ?? []).map((p: PartyPlayer) =>
    p.pid === pid ? { ...p, score, round, done } : p
  );
  const allDone = players.every(p => p.done);
  await supabase.from('sg_party_rooms')
    .update({ players, ...(allDone ? { status: 'done' } : {}) })
    .eq('id', roomId);
}
