import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Copy, Users, Loader2, XCircle } from 'lucide-react';
import { createPartyRoom, joinPartyRoom, startPartyGame as startPartyGameRemote, type PartyRoom, type PartyPlayer } from '@/utils/party';
import { supabase } from '@/lib/supabase';

interface Props {
  playerName: string;
  onStart: (room: PartyRoom, pid: string) => void;
  onBack: () => void;
}

type View = 'menu' | 'creating' | 'waiting' | 'joining' | 'countdown';

export function PartyLobbyScreen({ playerName, onStart, onBack }: Props) {
  const [view, setView] = useState<View>('menu');
  const [room, setRoom] = useState<PartyRoom | null>(null);
  const [pid, setPid] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [players, setPlayers] = useState<PartyPlayer[]>([]);
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [countdown, setCountdown] = useState(3);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const name = playerName || 'Anonymous';

  const cleanupChannel = () => {
    if (channelRef.current) { channelRef.current.unsubscribe(); channelRef.current = null; }
  };

  // Host: create room
  const handleCreate = async () => {
    setView('creating');
    const result = await createPartyRoom(name);
    if (!result) { setView('menu'); return; }
    setRoom(result.room);
    setPid(result.pid);
    setIsHost(true);
    setPlayers(result.room.players);
    setView('waiting');

    if (supabase) {
      const ch = supabase
        .channel(`party-lobby:${result.room.id}`)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'sg_party_rooms',
          filter: `id=eq.${result.room.id}`,
        }, (payload) => {
          const updated = payload.new as PartyRoom;
          setPlayers(updated.players ?? []);
          if (updated.status === 'playing') {
            setRoom(updated);
            cleanupChannel();
            setView('countdown');
          }
        })
        .subscribe();
      channelRef.current = ch;
    }
  };

  // Guest: join by code
  const handleJoin = async () => {
    if (joinCode.length < 4) { setJoinError('Enter the full room code'); return; }
    setJoinError('');
    setView('joining');
    const result = await joinPartyRoom(joinCode, name);
    if (!result) {
      setJoinError('Room not found, full, or already started');
      setView('menu');
      return;
    }
    setRoom(result.room);
    setPid(result.pid);
    setIsHost(false);
    setPlayers(result.room.players);

    // Guest: subscribe and wait for status = 'playing'
    if (supabase) {
      const ch = supabase
        .channel(`party-lobby-guest:${result.room.id}`)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'sg_party_rooms',
          filter: `id=eq.${result.room.id}`,
        }, (payload) => {
          const updated = payload.new as PartyRoom;
          setPlayers(updated.players ?? []);
          setRoom(updated);
          if (updated.status === 'playing') {
            cleanupChannel();
            setView('countdown');
          }
        })
        .subscribe();
      channelRef.current = ch;
    }

    setView('waiting');
  };

  // Host starts the game
  const handleStart = async () => {
    if (!room) return;
    await startPartyGameRemote(room.id);
    // The postgres_changes subscription will pick up status='playing' and transition to countdown
    // For offline mode (no supabase), go straight to countdown
    if (!supabase) {
      setView('countdown');
    }
  };

  // Countdown before game starts
  useEffect(() => {
    if (view !== 'countdown') return;
    setCountdown(3);
    const id = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(id);
          if (room) onStart(room, pid);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [view]);

  useEffect(() => () => cleanupChannel(), []);

  const copyCode = async () => {
    if (!room) return;
    await navigator.clipboard.writeText(room.room_code).catch(() => {});
  };

  // ── Countdown View ─────────────────────────────────────────────────────────
  if (view === 'countdown' && room) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen-safe gap-6 px-6 bg-background animate-fade-in">
        <div className="text-center">
          <p className="text-muted-foreground text-sm mb-1">Party · {players.length} players</p>
          <div className="flex flex-wrap justify-center gap-1.5 max-w-xs">
            {players.map(p => (
              <span key={p.pid} className="text-xs px-2 py-0.5 rounded-full" style={{ background: p.pid === pid ? 'hsl(280 67% 52% / 0.3)' : 'rgba(255,255,255,0.07)', color: p.pid === pid ? 'hsl(280 67% 72%)' : 'rgba(255,255,255,0.6)' }}>
                {p.name}
              </span>
            ))}
          </div>
        </div>
        <div
          className="w-36 h-36 rounded-full flex items-center justify-center"
          style={{
            background: 'hsl(280 67% 52% / 0.15)',
            border: '3px solid hsl(280 67% 52% / 0.5)',
            boxShadow: '0 0 60px hsl(280 67% 52% / 0.3)',
          }}
        >
          <span className="font-display text-7xl" style={{ color: 'hsl(280 67% 65%)' }}>{countdown}</span>
        </div>
        <p className="font-display text-xl text-muted-foreground tracking-widest animate-pulse">GAME STARTING...</p>
        <p className="text-xs text-muted-foreground/60">5 players · live scores · first right gets +50 bonus</p>
      </div>
    );
  }

  // ── Loading Views ──────────────────────────────────────────────────────────
  if (view === 'creating') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen-safe gap-4 bg-background">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'hsl(280 67% 52%)' }} />
        <p className="text-muted-foreground text-sm">Creating party room...</p>
      </div>
    );
  }

  if (view === 'joining') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen-safe gap-4 bg-background">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'hsl(280 67% 52%)' }} />
        <p className="text-muted-foreground text-sm">Joining room...</p>
      </div>
    );
  }

  // ── Waiting View ───────────────────────────────────────────────────────────
  if (view === 'waiting' && room) {
    const canStart = isHost && players.length >= 2;

    return (
      <div className="flex flex-col items-center justify-center min-h-screen-safe gap-6 px-6 bg-background animate-fade-in">
        <button onClick={() => { cleanupChannel(); setView('menu'); }} className="absolute top-6 left-6 p-2 press-scale">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>

        <div className="text-2xl">🎉</div>

        {/* Room code (host only) */}
        {isHost && (
          <div className="text-center">
            <p className="text-muted-foreground text-sm uppercase tracking-widest mb-2">Room Code</p>
            <div
              className="flex items-center gap-3 px-8 py-4 rounded-2xl cursor-pointer press-scale"
              style={{ background: 'hsl(280 67% 52% / 0.1)', border: '2px solid hsl(280 67% 52% / 0.4)' }}
              onClick={copyCode}
            >
              <span className="font-display text-5xl tracking-[0.2em]" style={{ color: 'hsl(280 67% 65%)' }}>{room.room_code}</span>
              <Copy className="w-5 h-5" style={{ color: 'hsl(280 67% 52% / 0.6)' }} />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Tap to copy · Share with your crew</p>
          </div>
        )}

        {/* Guest waiting message */}
        {!isHost && (
          <div className="text-center">
            <p className="font-display text-2xl tracking-widest text-foreground">WAITING FOR HOST</p>
            <p className="text-sm text-muted-foreground mt-1">Game will start any moment...</p>
          </div>
        )}

        {/* Player list */}
        <div className="w-full max-w-sm glass rounded-2xl p-4 border border-white/[0.08]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{players.length}/8 players</span>
            </div>
            {!isHost && (
              <div className="flex items-center gap-1.5 animate-pulse">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'hsl(280 67% 52%)' }} />
                <span className="text-[10px] text-muted-foreground">live</span>
              </div>
            )}
          </div>
          <div className="space-y-2">
            {players.map((p) => (
              <div key={p.pid} className="flex items-center gap-2.5">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                  style={{
                    background: p.pid === pid ? 'hsl(280 67% 52% / 0.25)' : 'rgba(255,255,255,0.06)',
                    color: p.pid === pid ? 'hsl(280 67% 65%)' : 'rgba(255,255,255,0.5)',
                  }}
                >
                  {p.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm text-foreground flex-1">{p.name}</span>
                {p.pid === pid && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: 'hsl(280 67% 52% / 0.2)', color: 'hsl(280 67% 65%)' }}>YOU</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Start button (host only) */}
        {isHost && (
          <div className="w-full max-w-sm flex flex-col gap-2">
            <button
              onClick={handleStart}
              disabled={!canStart}
              className="w-full py-4 rounded-2xl text-white font-display text-xl tracking-widest press-scale disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              style={{
                background: canStart ? 'linear-gradient(135deg, hsl(280 67% 52%), hsl(210 100% 56%))' : undefined,
                boxShadow: canStart ? '0 6px 30px hsl(280 67% 52% / 0.4)' : undefined,
              }}
            >
              START GAME
            </button>
            {!canStart && (
              <p className="text-center text-xs text-muted-foreground">Need at least 2 players to start</p>
            )}
          </div>
        )}

        {!isHost && (
          <p className="text-[10px] text-muted-foreground/50 text-center max-w-xs">
            The host will start the game when everyone is ready
          </p>
        )}
      </div>
    );
  }

  // ── Main Menu ──────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center justify-center min-h-screen-safe gap-6 px-6 bg-background animate-slide-up">
      <button onClick={onBack} className="absolute top-6 left-6 p-2 press-scale">
        <ArrowLeft className="w-5 h-5 text-muted-foreground" />
      </button>

      {/* Header */}
      <div className="text-center">
        <div className="text-5xl mb-3">🎉</div>
        <h2 className="font-display text-4xl tracking-widest text-foreground">PARTY MODE</h2>
        <p className="text-sm text-muted-foreground mt-1">Same room · live scores · 2-8 players</p>
      </div>

      {/* How it works */}
      <div className="w-full max-w-sm glass rounded-2xl p-4 border border-white/[0.08] space-y-2">
        {[
          ['🏀', '5 NBA players, same for everyone'],
          ['⚡', 'First to answer a round gets +50 speed bonus'],
          ['📊', 'Live leaderboard during the game'],
          ['🏆', 'Highest score after 5 rounds wins'],
        ].map(([icon, text]) => (
          <div key={text} className="flex items-center gap-3">
            <span className="text-lg">{icon}</span>
            <span className="text-sm text-muted-foreground">{text}</span>
          </div>
        ))}
      </div>

      {/* Error */}
      {joinError && (
        <div className="flex items-center gap-2 text-sm animate-scale-in" style={{ color: 'hsl(0 72% 51%)' }}>
          <XCircle className="w-4 h-4" />
          <span>{joinError}</span>
        </div>
      )}

      {/* Actions */}
      <div className="w-full max-w-sm flex flex-col gap-3">
        {/* Host */}
        <button
          onClick={handleCreate}
          className="w-full py-4 rounded-2xl text-white font-display text-xl tracking-widest press-scale transition-all"
          style={{
            background: 'linear-gradient(135deg, hsl(280 67% 52%), hsl(210 100% 56%))',
            boxShadow: '0 6px 30px hsl(280 67% 52% / 0.35)',
          }}
        >
          HOST PARTY
        </button>

        {/* Join */}
        <div className="flex gap-2">
          <input
            type="text"
            value={joinCode}
            onChange={e => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
            onKeyDown={e => e.key === 'Enter' && handleJoin()}
            placeholder="ENTER CODE"
            maxLength={6}
            className="flex-1 px-4 py-3.5 rounded-2xl bg-white/[0.06] border border-white/[0.1] text-foreground font-display text-lg tracking-widest placeholder:text-muted-foreground/40 text-center focus:outline-none focus:border-primary/50"
          />
          <button
            onClick={handleJoin}
            disabled={joinCode.length < 4}
            className="px-5 py-3.5 rounded-2xl glass border border-white/[0.1] font-display text-sm tracking-wider press-scale disabled:opacity-40"
          >
            JOIN
          </button>
        </div>
      </div>

      {!supabase && (
        <p className="text-[10px] text-muted-foreground/50 text-center max-w-xs">
          Live sync requires Supabase. Connect to enable multiplayer.
        </p>
      )}
    </div>
  );
}
