import { Player } from '@/data/players';

interface Props {
  player: Player;
  revealed: boolean;
  compact?: boolean;
}

export function SilhouettePlaceholder({ player, revealed, compact }: Props) {
  return (
    <div className={`relative mx-auto ${compact ? 'w-32 h-44 sm:w-40 sm:h-52' : 'w-48 h-64 md:w-56 md:h-72'}`}>
      {/* Silhouette figure */}
      <svg
        viewBox="0 0 200 280"
        className={`w-full h-full transition-all duration-700 ${
          revealed ? 'drop-shadow-[0_0_30px_hsl(var(--primary)/0.6)]' : 'animate-silhouette-pulse'
        }`}
      >
        {/* Head */}
        <circle
          cx="100" cy="45" r="28"
          fill={revealed ? `hsl(${player.teamColor})` : 'hsl(var(--foreground))'}
          className="transition-colors duration-700"
        />
        {/* Neck */}
        <rect
          x="90" y="73" width="20" height="12" rx="4"
          fill={revealed ? `hsl(${player.teamColor})` : 'hsl(var(--foreground))'}
          className="transition-colors duration-700"
        />
        {/* Body/Jersey */}
        <path
          d="M55 85 L70 78 L100 85 L130 78 L145 85 L140 170 L60 170 Z"
          fill={revealed ? `hsl(${player.teamColor})` : 'hsl(var(--foreground))'}
          className="transition-colors duration-700"
        />
        {/* Jersey number (only when revealed) */}
        {revealed && (
          <text
            x="100" y="140"
            textAnchor="middle"
            fill="hsl(var(--primary-foreground))"
            fontSize="32"
            fontWeight="bold"
            fontFamily="'Bebas Neue', sans-serif"
          >
            {player.number}
          </text>
        )}
        {/* Left arm */}
        <path
          d="M55 85 L30 130 L40 135 L60 100"
          fill={revealed ? `hsl(${player.teamColor})` : 'hsl(var(--foreground))'}
          className="transition-colors duration-700"
        />
        {/* Right arm */}
        <path
          d="M145 85 L170 130 L160 135 L140 100"
          fill={revealed ? `hsl(${player.teamColor})` : 'hsl(var(--foreground))'}
          className="transition-colors duration-700"
        />
        {/* Shorts */}
        <path
          d="M65 170 L55 220 L90 220 L100 185 L110 220 L145 220 L135 170 Z"
          fill={revealed ? `hsl(${player.teamColor} / 0.8)` : 'hsl(var(--foreground))'}
          className="transition-colors duration-700"
        />
        {/* Left leg */}
        <rect
          x="60" y="220" width="25" height="45" rx="6"
          fill={revealed ? `hsl(${player.teamColor})` : 'hsl(var(--foreground))'}
          className="transition-colors duration-700"
        />
        {/* Right leg */}
        <rect
          x="115" y="220" width="25" height="45" rx="6"
          fill={revealed ? `hsl(${player.teamColor})` : 'hsl(var(--foreground))'}
          className="transition-colors duration-700"
        />
        {/* Shoes */}
        <ellipse cx="72" cy="270" rx="18" ry="8" fill={revealed ? `hsl(${player.teamColor} / 0.9)` : 'hsl(var(--foreground))'} className="transition-colors duration-700" />
        <ellipse cx="128" cy="270" rx="18" ry="8" fill={revealed ? `hsl(${player.teamColor} / 0.9)` : 'hsl(var(--foreground))'} className="transition-colors duration-700" />
      </svg>

      {/* Question mark overlay when not revealed */}
      {!revealed && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-display text-primary opacity-30 ${compact ? 'text-4xl' : 'text-6xl'}`}>?</span>
        </div>
      )}
    </div>
  );
}
