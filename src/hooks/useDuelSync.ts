import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { updateDuelProgress } from '@/utils/duels';

interface DuelSyncState {
  opponentRound: number;
  opponentScore: number;
  opponentDone: boolean;
}

export function useDuelSync(options: {
  enabled: boolean;
  roomId: string;
  role: 'host' | 'guest' | null;
  myRound: number;      // totalAnswered
  myScore: number;
  myDone: boolean;
  totalRounds: number;
}): DuelSyncState & { channel: ReturnType<typeof supabase.channel> | null } {
  const { enabled, roomId, role, myRound, myScore, myDone, totalRounds } = options;
  const [opponentRound, setOpponentRound] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [opponentDone, setOpponentDone] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const lastSyncedRound = useRef(-1);

  // Subscribe to opponent progress broadcasts
  useEffect(() => {
    if (!enabled || !roomId || !supabase) return;
    const ch = supabase.channel(`duel:${roomId}`, { config: { broadcast: { self: false } } });
    channelRef.current = ch;

    ch.on('broadcast', { event: 'progress' }, ({ payload }) => {
      if (payload.role !== role) {
        setOpponentRound(payload.round ?? 0);
        setOpponentScore(payload.score ?? 0);
        if (payload.done) setOpponentDone(true);
      }
    });

    ch.subscribe();
    return () => { ch.unsubscribe(); channelRef.current = null; };
  }, [enabled, roomId, role]);

  // Broadcast own progress whenever round changes
  useEffect(() => {
    if (!enabled || !roomId || !supabase || !role || !channelRef.current) return;
    if (myRound === lastSyncedRound.current) return;
    lastSyncedRound.current = myRound;

    channelRef.current.send({
      type: 'broadcast',
      event: 'progress',
      payload: { role, round: myRound, score: myScore, done: myDone },
    }).catch(() => {});

    // Also persist to DB
    if (myRound > 0 || myDone) {
      updateDuelProgress(roomId, role, myRound, myScore, myDone).catch(() => {});
    }
  }, [myRound, myDone, enabled, roomId, role, myScore]);

  return {
    opponentRound,
    opponentScore,
    opponentDone,
    channel: channelRef.current,
  };
}
