import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Swords, Copy, Users, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { createDuelRoom, joinDuelRoom, type DuelRoom } from '@/utils/duels';
import { supabase } from '@/lib/supabase';

interface Props {
  playerName: string;
  onStart: (room: DuelRoom, role: 'host' | 'guest') => void;
  onBack: () => void;
}

type View = 'menu' | 'creating' | 'waiting' | 'joining' | 'countdown';

export function DuelLobbyScreen({ playerName, onStart, onBack }: Props) {
  const [view, setView] = useState<View>('menu');
  const [room, setRoom] = useState<DuelRoom | null>(null);
  const [role, setRole] = useState<'host' | 'guest'>('host');
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [countdown, setCountdown] = useState(3);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const name = playerName || 'Anonymous';

  const cleanupChannel = () => {
    if (channelRef.current) { channelRef.current.unsubscribe(); channelRef.current = null; }
  };

  // Host: create room and wait for guest
  const handleCreate = async () => {
    setView('creating');
    const r = await createDuelRoom(name);
    if (!r) { setView('menu'); return; }
    setRoom(r);
    setRole('host');
    setView('waiting');

    if (supabase) {
      // Subscribe to updates on this room so we know when guest joins
      const ch = supabase
        .channel(`duel-room:${r.id}`)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'sg_duels',
          filter: `id=eq.${r.id}`,
        }, (payload) => {
          const updated = payload.new as DuelRoom;
          if (updated.status === 'playing' && updated.guest_name) {
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
    const r = await joinDuelRoom(joinCode, name);
    if (!r) {
      setJoinError('Room not found or already started');
      setView('menu');
      return;
    }
    setRoom(r);
    setRole('guest');
    setView('countdown');
  };

  // Countdown before game starts
  useEffect(() => {
    if (view !== 'countdown') return;
    setCountdown(3);
    const id = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(id);
          if (room) onStart(room, role);
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

  // ── Views ─────────────────────────────────────────────────────────────────
  if (view === 'countdown' && room) {
    const opponentName = role === 'host' ? room.guest_name : room.host_name;
    return (
      <div className="flex flex-col items-center justify-center min-h-screen-safe gap-6 px-6 bg-background animate-fade-in">
        <div className="text-center">
          <p className="text-muted-foreground text-sm mb-1">vs</p>
          <p className="font-display text-3xl text-foreground">{opponentName ?? '?'}</p>
        </div>
        <div
          className="w-36 h-36 rounded-full flex items-center justify-center"
          style={{
            background: 'hsl(16 100% 58% / 0.15)',
            border: '3px solid hsl(16 100% 58% / 0.5)',
            boxShadow: '0 0 60px hsl(16 100% 58% / 0.3)',
          }}
        >
          <span className="font-display text-7xl text-accent">{countdown}</span>
        </div>
        <p className="font-display text-xl text-muted-foreground tracking-widest animate-pulse">GAME STARTING...</p>
        <p className="text-xs text-muted-foreground/60">5 players · 12s each · highest score wins</p>
      </div>
    );
  }

  if (view === 'creating') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen-safe gap-4 bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-muted-foreground text-sm">Creating room...</p>
      </div>
    );
  }

  if (view === 'waiting' && room) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen-safe gap-6 px-6 bg-background animate-fade-in">
        <button onClick={() => { cleanupChannel(); setView('menu'); }} className="absolute top-6 left-6 p-2 press-scale">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>

        <Swords className="w-12 h-12 text-game-gold" />
        <div className="text-center">
          <p className="text-muted-foreground text-sm uppercase tracking-widest mb-2">Your room code</p>
          <div
            className="flex items-center gap-3 px-8 py-4 rounded-2xl cursor-pointer press-scale"
            style={{ background: 'hsl(var(--game-gold) / 0.1)', border: '2px solid hsl(var(--game-gold) / 0.4)' }}
            onClick={copyCode}
          >
            <span className="font-display text-5xl text-game-gold tracking-[0.2em]">{room.room_code}</span>
            <Copy className="w-5 h-5 text-game-gold/60" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">Tap to copy · Share with your opponent</p>
        </div>

        <div className="flex items-center gap-2 animate-pulse">
          <Users className="w-4 h-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Waiting for opponent to join...</p>
        </div>

        <p className="text-[10px] text-muted-foreground/50 text-center max-w-xs">
          {supabase ? 'Room auto-starts when someone joins. Code expires in 1 hour.' : 'Offline mode: paste code to opponent manually'}
        </p>
      </div>
    );
  }

  if (view === 'joining') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen-safe gap-4 bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-muted-foreground text-sm">Joining room...</p>
      </div>
    );
  }

  // ── Main menu ─────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center justify-center min-h-screen-safe gap-6 px-6 bg-background animate-slide-up">
      <button onClick={onBack} className="absolute top-6 left-6 p-2 press-scale">
        <ArrowLeft className="w-5 h-5 text-muted-foreground" />
      </button>

      {/* Header */}
      <div className="text-center">
        <Swords className="w-10 h-10 text-game-gold mx-auto mb-3" />
        <h2 className="font-display text-4xl tracking-widest text-foreground">LIVE DUEL</h2>
        <p className="text-sm text-muted-foreground mt-1">Real-time 1v1 · same 5 players</p>
      </div>

      {/* How it works */}
      <div className="w-full max-w-sm glass rounded-2xl p-4 border border-white/[0.08] space-y-2">
        {[
          ['⚔️', '5 players, 12 seconds each'],
          ['🎯', 'Both see the same disguises'],
          ['🏆', 'Highest score after 5 rounds wins'],
          ['📡', 'Live score updates as you play'],
        ].map(([icon, text]) => (
          <div key={text} className="flex items-center gap-3">
            <span className="text-lg">{icon}</span>
            <span className="text-sm text-muted-foreground">{text}</span>
          </div>
        ))}
      </div>

      {/* Error */}
      {joinError && (
        <div className="flex items-center gap-2 text-game-wrong text-sm animate-scale-in">
          <XCircle className="w-4 h-4" />
          <span>{joinError}</span>
        </div>
      )}

      {/* Actions */}
      <div className="w-full max-w-sm flex flex-col gap-3">
        {/* Create */}
        <button
          onClick={handleCreate}
          className="w-full py-4 rounded-2xl gradient-hero text-white font-display text-xl tracking-widest press-scale"
          style={{ boxShadow: '0 6px 30px hsl(var(--game-gold) / 0.3)' }}
        >
          CREATE ROOM
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
          Live sync requires Supabase. In offline mode, room codes are shared manually.
        </p>
      )}
    </div>
  );
}
