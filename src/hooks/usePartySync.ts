import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { type PartyRoom, type PartyPlayer, updatePartyProgress } from '@/utils/party';

export function usePartySync(options: {
  enabled: boolean;
  room: PartyRoom | null;
  pid: string;
  myScore: number;
  myRound: number;
  myDone: boolean;
}) {
  const { enabled, room, pid, myScore, myRound, myDone } = options;
  const [players, setPlayers] = useState<PartyPlayer[]>(room?.players ?? []);
  const [status, setStatus] = useState<PartyRoom['status']>(room?.status ?? 'lobby');
  const lastSyncRef = useRef({ score: -1, round: -1 });

  useEffect(() => {
    if (!enabled || !room || !supabase) return;
    const ch = supabase
      .channel(`party:${room.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'sg_party_rooms',
        filter: `id=eq.${room.id}`,
      }, (payload) => {
        const updated = payload.new as PartyRoom;
        setPlayers(updated.players ?? []);
        setStatus(updated.status);
      })
      .subscribe();
    return () => { ch.unsubscribe(); };
  }, [enabled, room?.id]);

  // Push own progress to DB when score/round changes
  useEffect(() => {
    if (!enabled || !room || !pid) return;
    if (lastSyncRef.current.score === myScore && lastSyncRef.current.round === myRound) return;
    lastSyncRef.current = { score: myScore, round: myRound };
    updatePartyProgress(room.id, pid, myScore, myRound, myDone).catch(() => {});
  }, [myScore, myRound, myDone, enabled, room?.id, pid]);

  return { players, status };
}
