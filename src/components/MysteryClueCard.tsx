import { Player } from '@/data/players';

interface Props {
  player: Player;
  cluesRevealed: number;
  onRevealClue: () => void;
  onReady: () => void;
}

export function MysteryClueCard({ player, cluesRevealed, onRevealClue, onReady }: Props) {
  const clues = player.clues ?? [
    `This player plays ${player.position}`,
    `They wear #${player.number} for ${player.team}`,
    `Nickname: "${player.nickname}"`,
  ];

  // Signal ready immediately since there's no video to load
  // Use a ref to call onReady only once
  const hasCalledReady = { current: false };
  if (!hasCalledReady.current) {
    hasCalledReady.current = true;
    setTimeout(onReady, 100);
  }

  return (
    <div className="w-full flex flex-col items-center justify-center px-4 py-6 gap-4">
      {/* Mystery icon */}
      <div className="animate-mystery-pulse" style={{ filter: 'drop-shadow(0 0 20px rgba(139,92,246,0.5))' }}>
        <svg width="80" height="80" viewBox="0 0 64 64" fill="none">
          <ellipse cx="32" cy="56" rx="16" ry="4" fill="hsl(var(--primary) / 0.15)" />
          <path d="M32 8C26 8 22 12 22 18C22 24 26 28 32 28C38 28 42 24 42 18C42 12 38 8 32 8Z"
            fill="hsl(var(--muted-foreground) / 0.2)" stroke="hsl(280 67% 52% / 0.7)" strokeWidth="1.5"/>
          <path d="M20 52V38C20 32 24 28 32 28C40 28 44 32 44 38V52"
            fill="hsl(var(--muted-foreground) / 0.15)" stroke="hsl(280 67% 52% / 0.7)" strokeWidth="1.5"/>
          <text x="32" y="22" textAnchor="middle" fill="hsl(280 67% 65%)" fontSize="14"
            fontFamily="Bebas Neue, sans-serif" fontWeight="bold">?</text>
        </svg>
      </div>

      <p className="text-xs text-muted-foreground uppercase tracking-widest text-center">Mystery Mode — Clues</p>

      {/* Revealed clues */}
      <div className="w-full space-y-2">
        {clues.slice(0, cluesRevealed).map((clue, i) => (
          <div
            key={i}
            className="animate-clue-reveal glass border border-primary/20 rounded-xl px-4 py-3 text-center"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <span className="text-[11px] text-muted-foreground mr-2">Clue {i + 1}</span>
            <span className="text-sm text-foreground font-semibold">{clue}</span>
          </div>
        ))}
      </div>

      {/* Reveal button */}
      {cluesRevealed < clues.length && (
        <button
          onClick={onRevealClue}
          className="mt-2 px-6 py-3 rounded-xl glass border border-primary/30 text-primary font-display tracking-wider text-sm press-scale hover:bg-primary/10 transition-all"
        >
          🔮 Reveal Clue {cluesRevealed + 1}
          <span className="ml-2 text-[10px] text-muted-foreground">−{(3 - cluesRevealed) > 0 ? (3 - cluesRevealed) * 30 : 0}pts</span>
        </button>
      )}
      {cluesRevealed >= clues.length && (
        <p className="text-[11px] text-muted-foreground text-center">All clues revealed — pick your answer below</p>
      )}
    </div>
  );
}
