import { useState, useMemo } from 'react';
import { PLAYERS, Player, TIER_CONFIG, DifficultyTier } from '@/data/players';
import { isCollected, isSeen, getSessionCollected } from '@/utils/collection';
import { getMasteryLevel } from '@/utils/mastery';
import { Lock, X, Eye } from 'lucide-react';
import { trackEvent } from '@/utils/analytics';

type FilterType = 'all' | DifficultyTier | string;

export function GalleryScreen() {
  const [selected, setSelected] = useState<Player | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const collectedCount = PLAYERS.filter(p => isCollected(p.id)).length;
  const seenCount = PLAYERS.filter(p => isSeen(p.id)).length;
  const pct = Math.round((collectedCount / PLAYERS.length) * 100);
  const sessionCollected = useMemo(() => getSessionCollected(), []);

  const teams = useMemo(() => [...new Set(PLAYERS.map(p => p.team))].sort(), []);
  const tiers = Object.entries(TIER_CONFIG) as [DifficultyTier, typeof TIER_CONFIG[DifficultyTier]][];

  const filtered = useMemo(() => {
    if (filter === 'all') return PLAYERS;
    if (filter in TIER_CONFIG) return PLAYERS.filter(p => p.tier === filter);
    return PLAYERS.filter(p => p.team === filter);
  }, [filter]);

  useState(() => { trackEvent('gallery_view'); });

  return (
    <div className="flex flex-col min-h-screen-safe bg-background px-4 pt-6 pb-24 animate-slide-up">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-3xl font-display text-gradient-title tracking-wider">GALLERY</h1>
        <div className="flex items-center gap-3 mt-0.5">
          <p className="text-xs text-muted-foreground">{collectedCount} of {PLAYERS.length} identified ({pct}%)</p>
          {seenCount > collectedCount && (
            <span className="text-[10px] text-game-gold font-semibold flex items-center gap-1">
              <Eye className="w-3 h-3" />{seenCount - collectedCount} missed
            </span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-secondary rounded-full mb-4 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500 gradient-hero"
          style={{ width: `${pct}%` }} />
      </div>

      {/* Filter Chips */}
      <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
        <button
          onClick={() => setFilter('all')}
          className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider border transition-all press-scale ${
            filter === 'all'
              ? 'border-primary/40 glass text-primary card-glow'
              : 'border-[rgba(255,255,255,0.08)] glass text-muted-foreground'
          }`}
        >
          All
        </button>
        {tiers.map(([key, config]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider border transition-all press-scale ${
              filter === key
                ? 'border-primary/40 glass'
                : 'border-[rgba(255,255,255,0.08)] glass'
            }`}
            style={filter === key ? { color: `hsl(${config.color})`, borderColor: `hsl(${config.color} / 0.5)` } : undefined}
          >
            <span style={{ color: filter === key ? `hsl(${config.color})` : undefined }}>
              {config.label}
            </span>
          </button>
        ))}
        {teams.map(team => (
          <button
            key={team}
            onClick={() => setFilter(team)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wider border transition-all press-scale ${
              filter === team
                ? 'border-primary/40 glass text-primary'
                : 'border-[rgba(255,255,255,0.08)] glass text-muted-foreground'
            }`}
          >
            {team}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 gap-3 flex-1 overflow-y-auto pb-6">
        {filtered.map((player, i) => {
          const collected = isCollected(player.id);
          const seen = isSeen(player.id);
          const isNewlyCollected = sessionCollected.has(player.id);
          const mastery = collected ? getMasteryLevel(player.id) : 0;
          return (
            <button key={player.id} onClick={() => (collected || seen) && setSelected(player)}
              disabled={!collected && !seen}
              className={`relative flex flex-col items-center p-2 rounded-xl border transition-all press-scale aspect-[3/4] justify-center overflow-hidden ${
                collected
                  ? 'border-[rgba(255,255,255,0.08)] glass hover:card-glow'
                  : seen
                  ? 'border-game-wrong/20 glass opacity-70'
                  : 'border-[rgba(255,255,255,0.04)] glass opacity-30 grayscale'
              } ${isNewlyCollected ? 'animate-card-flip' : 'animate-scale-in'}`}
              style={{
                animationDelay: `${Math.min(i, 20) * 40}ms`,
                animationFillMode: 'both',
                ...(collected
                  ? { boxShadow: `0 0 20px hsl(${player.teamColor} / 0.2)`, borderBottom: `2px solid hsl(${player.teamColor})` }
                  : seen
                  ? { borderBottom: '1px solid hsl(var(--game-wrong) / 0.3)' }
                  : {}),
              }}>
              {/* Missed badge */}
              {seen && !collected && (
                <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-game-wrong/80 flex items-center justify-center z-10">
                  <X className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                </div>
              )}
              {!collected && !seen && (
                <div className="relative flex flex-col items-center justify-center">
                  <svg width="32" height="32" viewBox="0 0 64 64" fill="none" className="opacity-10 mb-1">
                    <path d="M32 8C26 8 22 12 22 18C22 24 26 28 32 28C38 28 42 24 42 18C42 12 38 8 32 8Z" fill="currentColor"/>
                    <path d="M20 52V38C20 32 24 28 32 28C40 28 44 32 44 38V52" fill="currentColor"/>
                  </svg>
                  <Lock className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
              {(collected || seen) && (
                <img
                  src={player.imageUrl}
                  alt={player.name}
                  className={`w-full h-20 object-cover object-top rounded-lg mb-1 ${seen && !collected ? 'grayscale opacity-60' : ''}`}
                  draggable={false}
                />
              )}
              <span className={`text-[10px] font-bold text-center leading-tight ${
                collected ? 'text-foreground' : seen ? 'text-muted-foreground' : 'text-muted-foreground'
              }`}>
                {collected || seen ? player.name : '???'}
              </span>
              {collected && (
                <span className="text-[9px] mt-0.5 font-semibold" style={{ color: `hsl(${player.teamColor})` }}>
                  {player.team}
                </span>
              )}
              {seen && !collected && (
                <span className="text-[8px] mt-0.5 text-game-wrong/70 font-bold uppercase tracking-wide">missed</span>
              )}
              {/* Mastery stars */}
              {mastery > 0 && (
                <div className="flex gap-0.5 mt-0.5">
                  {Array.from({ length: 3 }).map((_, si) => (
                    <span key={si} className={`text-[8px] ${si < mastery ? 'text-game-gold' : 'text-muted-foreground/20'}`}>★</span>
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Player Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in" onClick={() => setSelected(null)}>
          <div className="relative glass border border-[rgba(255,255,255,0.1)] rounded-2xl p-6 w-[85%] max-w-xs animate-scale-in"
            onClick={e => e.stopPropagation()}
            style={{ boxShadow: `0 0 40px hsl(${selected.teamColor} / 0.3)` }}>
            <button onClick={() => setSelected(null)} className="absolute top-3 right-3 p-1 press-scale">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
            <div className="flex flex-col items-center text-center">
              <img
                src={selected.imageUrl}
                alt={selected.name}
                className={`w-32 h-24 object-cover object-top rounded-xl mb-3 ${!isCollected(selected.id) ? 'grayscale opacity-70' : ''}`}
                draggable={false}
              />
              <h3 className="text-2xl font-display tracking-wider text-foreground">{selected.name}</h3>
              {!isCollected(selected.id) && (
                <span className="text-[10px] font-bold text-game-wrong uppercase tracking-widest mb-1">× Missed — play again to collect</span>
              )}
              <span className="text-sm font-bold mt-1 mb-4" style={{ color: `hsl(${selected.teamColor})` }}>{selected.team}</span>
              <div className="grid grid-cols-3 gap-4 w-full">
                <div className="flex flex-col items-center">
                  <span className="text-xs text-muted-foreground">POS</span>
                  <span className="font-display text-lg">{selected.position}</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-xs text-muted-foreground">NUM</span>
                  <span className="font-display text-lg">#{selected.number}</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-xs text-muted-foreground">TIER</span>
                  <span className="font-display text-lg capitalize">{selected.tier}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
