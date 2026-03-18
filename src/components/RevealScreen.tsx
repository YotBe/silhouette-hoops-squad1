import { useEffect, useState } from 'react';
import { Player } from '@/data/players';
import { Check, X, Flame, Users } from 'lucide-react';
import { fireConfetti } from '@/utils/confetti';
import { SFX } from '@/hooks/useSoundEffects';
import { hapticReveal } from '@/utils/haptics';

interface Props {
  player: Player;
  correct: boolean;
  selectedAnswer: string | null;
  choices: Player[];
  lives: number;
  score: number;
  streak: number;
  prevStreak?: number;
  hintsUsedThisRound?: number;
  onContinue: () => void;
  isDailyMode?: boolean;
  dailyRound?: number;
  dailyTotal?: number;
  nextPlayerImageUrl?: string | null;
  nextPlayerVideoFile?: string | null;
}

function useCountUp(target: number, duration = 600, delay = 300) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const num = parseFloat(String(target));
    if (isNaN(num)) { setValue(0); return; }
    const timeout = setTimeout(() => {
      const steps = 16;
      const stepTime = duration / steps;
      let step = 0;
      const interval = setInterval(() => {
        step++;
        setValue(step >= steps ? num : Math.round(num * (step / steps)));
        if (step >= steps) clearInterval(interval);
      }, stepTime);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timeout);
  }, [target, duration, delay]);
  return value;
}

export function RevealScreen({ player, correct, selectedAnswer, choices, lives, score, streak, prevStreak = 0, hintsUsedThisRound = 0, onContinue, isDailyMode = false, dailyRound = 0, dailyTotal = 3, nextPlayerImageUrl, nextPlayerVideoFile }: Props) {
  const selectedPlayer = choices.find(c => c.id === selectedAnswer);
  const isLastDaily = isDailyMode && dailyRound >= dailyTotal - 1;

  // Tighter sequenced animation phases (~800ms total)
  const [showResult, setShowResult] = useState(false);
  const [showPoints, setShowPoints] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showImage, setShowImage] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [canContinue, setCanContinue] = useState(false);
  const [replayError, setReplayError] = useState(false);

  const pointsToShow = correct ? Math.min(score > 0 ? score : 100, 300) : 0;
  const animatedPoints = useCountUp(pointsToShow, 400, 300);

  useEffect(() => {
    const timers = [
      setTimeout(() => setShowResult(true), 100),
      setTimeout(() => setShowPoints(true), 300),
      setTimeout(() => setShowPlayer(true), 500),
      setTimeout(() => setShowDetails(true), 600),
      setTimeout(() => setShowImage(true), 700),
      setTimeout(() => setShowButton(true), 900),
      setTimeout(() => setCanContinue(true), 800),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (correct && streak > 0 && streak % 5 === 0) {
      setTimeout(() => fireConfetti(), 400);
    }
  }, [correct, streak]);

  useEffect(() => {
    const t = setTimeout(() => { SFX.reveal(); hapticReveal(); }, 200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!correct) return;
    const pts = pointsToShow;
    const tickCount = Math.min(Math.max(Math.round(pts / 30), 4), 12);
    const interval = 400 / tickCount;
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 0; i < tickCount; i++) {
      timers.push(setTimeout(() => SFX.xpTick(), 300 + i * interval));
    }
    return () => timers.forEach(clearTimeout);
  }, [correct, pointsToShow]);

  const showStreakBroken = !correct && prevStreak >= 2;

  // "Who Got It?" social proof for both correct and wrong
  const whoGotItPct = (() => {
    let hash = 0;
    for (let i = 0; i < player.id.length; i++) hash = ((hash << 5) - hash) + player.id.charCodeAt(i);
    const dayOffset = new Date().getDate();
    return 25 + Math.abs((hash + dayOffset) % 41); // 25-65%
  })();

  const getButtonText = () => {
    if (isLastDaily) return 'VIEW RESULTS';
    if (lives <= 0) return 'SEE RESULTS';
    return 'NEXT PLAYER →';
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center px-4 overflow-y-auto"
      style={{ background: 'rgba(5, 8, 18, 0.95)' }}
      onClick={() => canContinue && onContinue()}
    >

      {/* Wrong screen red vignette pulse */}
      {!correct && (
        <div className="absolute inset-0 pointer-events-none animate-wrong-vignette"
          style={{ background: 'radial-gradient(ellipse at center, transparent 40%, hsl(var(--game-wrong) / 0.2) 100%)' }} />
      )}

      {/* Result text */}
      <div className={`mb-2 transition-all duration-300 ${showResult ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
        {correct ? (
          <h1 className="text-5xl font-display text-game-correct tracking-widest animate-slam-down drop-shadow-[0_0_30px_hsl(var(--game-correct)/0.5)]">
            CORRECT!
          </h1>
        ) : (
          <h1 className="text-5xl font-display text-game-wrong tracking-widest animate-head-shake drop-shadow-[0_0_30px_hsl(var(--game-wrong)/0.5)]">
            {selectedAnswer ? 'WRONG!' : "TIME'S UP!"}
          </h1>
        )}
      </div>

      {/* Points counter */}
      {correct && (
        <div className={`mb-3 transition-all duration-300 ${showPoints ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <span className="font-score text-3xl text-accent font-bold animate-count-up-slot">
            +{animatedPoints} PTS
          </span>
        </div>
      )}

      {/* Streak broken / active */}
      {showStreakBroken && showPoints && (
        <div className="flex items-center gap-1.5 mb-2 px-4 py-1.5 rounded-full bg-game-wrong/15 border border-game-wrong/30 animate-scale-in">
          <Flame className="w-4 h-4 text-game-wrong" />
          <span className="font-display text-game-wrong text-sm tracking-widest">STREAK BROKEN! Peak: x{prevStreak} 🔥</span>
        </div>
      )}
      {correct && streak > 2 && showPoints && (
        <div className="flex items-center gap-1.5 mb-2 px-4 py-1.5 rounded-full bg-primary/20 border border-primary/40 animate-glow-pulse animate-scale-in">
          <Flame className="w-4 h-4 text-primary" />
          <span className="font-display text-primary text-sm tracking-widest">STREAK ×{streak} 🔥</span>
        </div>
      )}

      {!correct && showPoints && (
        <div className="mb-1 animate-slide-up">
          <span className="font-display text-xl text-game-wrong">−1 ❤️</span>
        </div>
      )}

      {/* Hints used */}
      {hintsUsedThisRound > 0 && showPoints && (
        <p className="text-[10px] text-muted-foreground mb-2 animate-slide-up">Used {hintsUsedThisRound} hint{hintsUsedThisRound > 1 ? 's' : ''} (−{hintsUsedThisRound * 20} pts)</p>
      )}

      {/* Player Name */}
      <div className={`text-center mb-1 transition-all duration-300 ${showPlayer ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <h2 className="text-3xl font-display tracking-wider text-foreground">
          {player.name}
        </h2>
        {player.nickname !== player.name.split(' ')[0] && (
          <p className="text-muted-foreground text-sm italic mt-0.5">"{player.nickname}"</p>
        )}
      </div>

      {/* "Who Got It?" social proof — both screens */}
      {showDetails && (
        <div className="flex items-center gap-1.5 mb-2 animate-slide-up">
          <Users className="w-3 h-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            {whoGotItPct}% of players got this right
          </span>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
            whoGotItPct <= 35
              ? 'bg-game-wrong/15 text-game-wrong'
              : whoGotItPct <= 65
                ? 'bg-game-gold/15 text-game-gold'
                : 'bg-game-correct/15 text-game-correct'
          }`}>
            {whoGotItPct <= 35 ? '🔴 Hard' : whoGotItPct <= 65 ? '🟡 Medium' : '🟢 Easy'}
          </span>
        </div>
      )}

      {/* Player Details */}
      <div className={`text-center mb-3 transition-all duration-300 ${showDetails ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <p className="text-muted-foreground text-sm">
          #{player.number} · {player.position} · {player.team}
        </p>
      </div>

      {/* Wrong answer: who you guessed */}
      {!correct && selectedPlayer && showDetails && (
        <p className="text-xs text-muted-foreground mb-2 animate-slide-up">
          You guessed: <span className="text-game-wrong font-semibold">{selectedPlayer.name}</span>
        </p>
      )}

      {/* Player Image Card */}
      <div className={`mb-3 w-full max-w-[280px] transition-all duration-500 ${showImage ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
        <div className="rounded-2xl overflow-hidden"
          style={{ boxShadow: `0 0 40px hsl(${player.teamColor} / 0.4), 0 0 80px hsl(${player.teamColor} / 0.15)` }}>
          <img
            src={player.imageUrl}
            alt={player.name}
            className="w-full aspect-[4/3] object-cover"
          />
        </div>
      </div>

      {/* Stats + Facts */}
      {showImage && (
        <div className="w-full max-w-[280px] mb-3 animate-slide-up" style={{ animationDelay: '0.05s' }}>
          {player.stats && (
            <div className="flex justify-around mb-2 px-3 py-2 rounded-xl glass border border-foreground/10">
              <div className="text-center">
                <span className="text-base font-score text-accent font-bold">{player.stats.ppg}</span>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">PPG</p>
              </div>
              <div className="text-center">
                <span className="text-base font-score text-accent font-bold">{player.stats.rpg}</span>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">RPG</p>
              </div>
              <div className="text-center">
                <span className="text-base font-score text-accent font-bold">{player.stats.apg}</span>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">APG</p>
              </div>
            </div>
          )}
          {player.facts && player.facts.length > 0 && (
            <p className="text-[11px] text-muted-foreground text-center px-2 leading-relaxed">
              💡 {player.facts[Math.abs(player.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % player.facts.length]}
            </p>
          )}
        </div>
      )}

      {/* Wrong answer: video replay thumbnail — only if videoFile exists */}
      {!correct && showImage && player.videoFile && !replayError && (
        <div className="mb-3 w-full max-w-[160px] animate-slide-up">
          <p className="text-[9px] text-muted-foreground text-center mb-1 uppercase tracking-wider">Replay</p>
          <div className="rounded-xl overflow-hidden border border-foreground/10">
            <video
              src={player.videoFile}
              autoPlay
              loop
              muted
              playsInline
              onError={() => setReplayError(true)}
              className="w-full aspect-video object-cover"
            />
          </div>
        </div>
      )}

      {/* Continue Button */}
      <div className={`w-full max-w-xs transition-all duration-300 ${showButton ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
        <button
          onClick={(e) => { e.stopPropagation(); if (canContinue) onContinue(); }}
          disabled={!canContinue}
          className={`w-full py-4 rounded-2xl font-display tracking-widest press-scale text-white transition-opacity ${
            correct
              ? 'gradient-hero'
              : 'bg-gradient-to-r from-accent to-[hsl(var(--game-wrong))]'
          } ${!canContinue ? 'opacity-50' : ''}`}
          style={{ boxShadow: correct ? '0 4px 25px rgba(59, 130, 246, 0.4)' : '0 4px 25px rgba(255, 107, 43, 0.4)' }}
        >
          {canContinue ? getButtonText() : '...'}
        </button>
      </div>

      {/* Prefetch */}
      {nextPlayerImageUrl && <img src={nextPlayerImageUrl} alt="" className="hidden" loading="eager" />}
      {nextPlayerVideoFile && <video src={nextPlayerVideoFile} preload="auto" className="hidden" muted />}
    </div>
  );
}
