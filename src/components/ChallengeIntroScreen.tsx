import { useEffect } from 'react';
import { Swords, ChevronRight } from 'lucide-react';
import { TIER_CONFIG, DifficultyTier } from '@/data/players';
import { trackEvent } from '@/utils/analytics';
import type { ChallengeData } from '@/utils/challenge';

interface Props {
  challenge: ChallengeData;
  onAccept: () => void;
  onDecline: () => void;
}

/**
 * What a friend sees when they tap a challenge link.
 *
 * This screen exists to remove friction, not to add a step. Before it, a
 * challenge link landed on the home menu — behind a tutorial overlay and an
 * open name-entry form — so the recipient had to work out what was being asked
 * of them before they could play. Now the stakes are the first and only thing
 * on screen, and accepting is one tap.
 */
export function ChallengeIntroScreen({ challenge, onAccept, onDecline }: Props) {
  const tier = (challenge.tier in TIER_CONFIG ? challenge.tier : 'rookie') as DifficultyTier;
  const config = TIER_CONFIG[tier];
  const challenger = challenge.name?.trim() || 'Someone';
  const rounds = challenge.playerIds.length;

  useEffect(() => {
    trackEvent('challenge_landed', { tier, rounds, challengerScore: challenge.score });
  }, []);

  const handleAccept = () => {
    trackEvent('challenge_accepted', { tier, rounds, challengerScore: challenge.score });
    onAccept();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen-safe px-5 py-8 bg-background">
      <div className="w-full max-w-sm flex flex-col items-center text-center">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 animate-slam-down"
          style={{ background: 'hsl(var(--game-gold) / 0.15)', border: '1px solid hsl(var(--game-gold) / 0.4)' }}
        >
          <Swords className="w-8 h-8 text-game-gold" />
        </div>

        <p className="text-sm text-muted-foreground tracking-wide animate-slide-up">
          <span className="text-foreground font-semibold">{challenger}</span> challenged you
        </p>

        <h1 className="font-display text-5xl tracking-wider text-game-gold mt-2 animate-slam-down drop-shadow-[0_0_24px_hsl(var(--game-gold)/0.35)]">
          {challenge.score.toLocaleString()}
        </h1>
        <p className="font-score text-xs text-muted-foreground tracking-[0.2em] mt-1">POINTS TO BEAT</p>

        <div className="flex items-center gap-2 mt-5 animate-scale-in">
          <span
            className="px-3 py-1 rounded-full text-[11px] font-display tracking-wider"
            style={{
              color: `hsl(${config.color})`,
              background: `hsl(${config.color} / 0.15)`,
              border: `1px solid hsl(${config.color} / 0.4)`,
            }}
          >
            {config.label.toUpperCase()}
          </span>
          <span className="px-3 py-1 rounded-full text-[11px] font-display tracking-wider text-muted-foreground bg-muted/40 border border-border">
            {rounds} {rounds === 1 ? 'PLAYER' : 'PLAYERS'}
          </span>
        </div>

        <p className="text-xs text-muted-foreground mt-5 leading-relaxed">
          Exactly the same players, in the same order. Highest score wins.
        </p>

        <button
          onClick={handleAccept}
          autoFocus
          className="w-full mt-7 rounded-2xl py-4 font-display text-xl tracking-wider text-background press-scale active:scale-[0.97] transition-all flex items-center justify-center gap-2"
          style={{ background: 'hsl(var(--game-gold))' }}
        >
          ACCEPT CHALLENGE
          <ChevronRight className="w-5 h-5" />
        </button>

        <button
          onClick={onDecline}
          className="mt-3 text-xs text-muted-foreground underline underline-offset-4 py-2 px-4"
        >
          Just let me look around first
        </button>
      </div>
    </div>
  );
}
