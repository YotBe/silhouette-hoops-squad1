import { useState, useEffect, useCallback, useRef } from 'react';
import { Player, TIER_CONFIG, DifficultyTier } from '@/data/players';
import { BlurredVideoPlayer } from './BlurredVideoPlayer';
import { MysteryClueCard } from './MysteryClueCard';
import { PowerUpBar } from './PowerUpBar';
import { Flame, Volume2, VolumeX, Timer, X, Shirt, Lock, Check } from 'lucide-react';
import { PowerUpType, PowerUpInventory } from '@/utils/powerups';
import { HEAT_LEVELS } from '@/hooks/useGameState';

const CORRECT_HYPE = [
  'BUCKETS!', 'TOO EASY!', 'LOCK IN!', 'HE COOKS!', 'GOATED!',
  'NO LOOK!', 'AUTOMATIC!', 'ICE COLD!', 'SPLASH!', 'CAUGHT 4K!',
  'NEXT!', 'NOT EVEN CLOSE!', 'EASY MONEY!', 'TORCH!', 'CHEF KISS!',
];
const WRONG_HYPE = [
  'BRICKED!', 'CAUGHT LACKIN!', 'DO YOUR RESEARCH!',
  'WHO IS THAT?!', 'GET COOKED!', 'YIKES!', 'EMBARRASSING!',
  'TOUCHED GRASS?', 'NOT EVEN CLOSE!', 'HOMEWORK TIME!',
];

interface Props {
  currentPlayer: Player;
  choices: Player[];
  lives: number;
  score: number;
  streak: number;
  timeLeft: number;
  hintsRevealed: string[];
  hintsRemaining: number;
  tier: DifficultyTier;
  isMuted: boolean;
  isDailyMode: boolean;
  isBuzzerMode?: boolean;
  buzzerTimeLeft?: number;
  buzzerTimeDelta?: number | null;
  powerUpInventory: PowerUpInventory;
  activeSecondChance: boolean;
  eliminatedChoices: string[];
  nextPlayerVideoFile?: string | null;
  isMysteryMode?: boolean;
  mysteryCluesRevealed?: number;
  isHeatCheckMode?: boolean;
  heatLevel?: number;
  onAnswer: (playerId: string) => void;
  onHint: () => void;
  onHome: () => void;
  onToggleMute: () => void;
  onVideoReady: () => void;
  onUsePowerUp: (type: PowerUpType) => void;
  onRevealClue?: () => void;
}

function getTimerColor(timeLeft: number, maxTime: number): string {
  const pct = timeLeft / maxTime;
  if (pct > 0.5) return 'hsl(var(--primary))';
  if (pct > 0.25) return 'hsl(var(--game-gold))';
  return 'hsl(var(--game-wrong))';
}

function getBuzzerTimerColor(timeLeft: number): string {
  if (timeLeft <= 5) return 'text-game-wrong';
  if (timeLeft <= 10) return 'text-game-gold';
  return 'text-foreground';
}

function getMultiplierDisplay(streak: number): { text: string; color: string } | null {
  if (streak >= 6) return { text: 'x2.0', color: 'text-game-wrong' };
  if (streak >= 3) return { text: 'x1.5', color: 'text-game-gold' };
  return null;
}

export function GameScreen({
  currentPlayer, choices, lives, score, streak, timeLeft,
  hintsRevealed, hintsRemaining, tier, isMuted, isDailyMode,
  isBuzzerMode = false, buzzerTimeLeft = 60, buzzerTimeDelta,
  powerUpInventory, activeSecondChance, eliminatedChoices,
  nextPlayerVideoFile,
  isMysteryMode = false, mysteryCluesRevealed = 0,
  isHeatCheckMode = false, heatLevel = 0,
  onAnswer, onHint, onHome, onToggleMute, onVideoReady, onUsePowerUp, onRevealClue
}: Props) {
  const config = TIER_CONFIG[tier];
  const maxTime = isDailyMode ? 15 : config.timerSeconds;
  const timerPct = (timeLeft / maxTime) * 100;
  const timerColor = getTimerColor(timeLeft, maxTime);
  const [imageReady, setImageReady] = useState(false);
  const [deltaFlash, setDeltaFlash] = useState<number | null>(null);
  const [feedbackState, setFeedbackState] = useState<'correct' | 'wrong' | null>(null);
  const [scoreFloat, setScoreFloat] = useState<{ pts: number; speedBonus: number } | null>(null);
  const [hintCostFlash, setHintCostFlash] = useState(false);
  const [answeredId, setAnsweredId] = useState<string | null>(null);
  const [flashRed, setFlashRed] = useState(false);
  const [showMultiplierBanner, setShowMultiplierBanner] = useState(false);
  const [hypeText, setHypeText] = useState<string | null>(null);
  const [heatLevelUp, setHeatLevelUp] = useState(false);
  const prevStreakRef = useRef(streak);
  const prevHeatLevelRef = useRef(heatLevel);
  const multiplier = getMultiplierDisplay(streak);

  // Streak intensity for visual escalation
  const streakIntensity = streak >= 10 ? 'goated' : streak >= 7 ? 'inferno' : streak >= 5 ? 'fire' : streak >= 3 ? 'warm' : 'none';

  // Show multiplier banner when streak crosses 3, 6, 9...
  useEffect(() => {
    const prev = prevStreakRef.current;
    prevStreakRef.current = streak;
    if (streak > 0 && streak % 3 === 0 && streak !== prev) {
      setShowMultiplierBanner(true);
      const t = setTimeout(() => setShowMultiplierBanner(false), 900);
      return () => clearTimeout(t);
    }
  }, [streak]);

  // Heat level up animation
  useEffect(() => {
    const prev = prevHeatLevelRef.current;
    prevHeatLevelRef.current = heatLevel;
    if (heatLevel > prev) {
      setHeatLevelUp(true);
      const t = setTimeout(() => setHeatLevelUp(false), 1200);
      return () => clearTimeout(t);
    }
  }, [heatLevel]);

  // SVG ring calculations
  const ringRadius = 18;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference * (1 - timerPct / 100);

  const handleImageReady = () => {
    setImageReady(true);
    onVideoReady();
  };

  const handleMysteryReady = useCallback(() => {
    setImageReady(true);
    onVideoReady();
  }, [onVideoReady]);

  useEffect(() => { setImageReady(false); setAnsweredId(null); setFlashRed(false); }, [currentPlayer.id]);

  useEffect(() => {
    if (buzzerTimeDelta != null) {
      setDeltaFlash(buzzerTimeDelta);
      const t = setTimeout(() => setDeltaFlash(null), 800);
      return () => clearTimeout(t);
    }
  }, [buzzerTimeDelta, currentPlayer.id]);

  // Flash red on time up
  useEffect(() => {
    if (timeLeft === 0 && !isBuzzerMode) {
      setFlashRed(true);
      const t = setTimeout(() => setFlashRed(false), 300);
      return () => clearTimeout(t);
    }
  }, [timeLeft, isBuzzerMode]);

  const handleAnswer = useCallback((playerId: string) => {
    if (!imageReady || eliminatedChoices.includes(playerId) || answeredId) return;
    const isCorrect = playerId === currentPlayer.id;
    setFeedbackState(isCorrect ? 'correct' : 'wrong');
    setAnsweredId(playerId);
    // Hype text
    const pool = isCorrect ? CORRECT_HYPE : WRONG_HYPE;
    setHypeText(pool[Math.floor(Math.random() * pool.length)]);
    setTimeout(() => setHypeText(null), isBuzzerMode ? 500 : 900);
    if (isCorrect) {
      const streakMultiplier = Math.min(1 + Math.floor(streak / 3) * 0.5, 3);
      const hintPenalty = hintsRevealed.length * 20;
      const basePts = Math.round(Math.max(100 - hintPenalty, 25) * streakMultiplier);
      const speedBonus = isBuzzerMode ? 0 : Math.round(timeLeft * 2);
      setScoreFloat({ pts: basePts + speedBonus, speedBonus });
    }
    setTimeout(() => {
      setFeedbackState(null);
      setScoreFloat(null);
      setAnsweredId(null);
      onAnswer(playerId);
    }, isBuzzerMode ? 150 : 600);
  }, [imageReady, eliminatedChoices, answeredId, currentPlayer.id, streak, hintsRevealed.length, timeLeft, onAnswer, isBuzzerMode]);

  const handleHint = useCallback(() => {
    if (hintsRemaining <= 0) return;
    onHint();
    setHintCostFlash(true);
    setTimeout(() => setHintCostFlash(false), 800);
  }, [hintsRemaining, onHint]);

  // Keyboard controls
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!imageReady) return;
    if (e.key >= '1' && e.key <= '4') {
      const idx = parseInt(e.key) - 1;
      if (idx < choices.length && !eliminatedChoices.includes(choices[idx].id)) {
        handleAnswer(choices[idx].id);
      }
    } else if (e.key === 'h' || e.key === 'H') {
      handleHint();
    } else if (e.key === 'Escape') {
      onHome();
    }
  }, [imageReady, choices, eliminatedChoices, handleAnswer, handleHint, onHome]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const hintTypes = [
    { key: 'position', icon: '📍', label: 'POS', value: currentPlayer.position, cost: 20, animClass: 'animate-hint-slide-in' },
    { key: 'number', icon: '#️⃣', label: 'NUM', value: `#${currentPlayer.number}`, cost: 20, animClass: 'animate-hint-flip' },
    { key: 'team', icon: '🏟️', label: 'TEAM', value: currentPlayer.team, cost: 30, animClass: 'animate-hint-slide-in' },
  ];

  const [unlockingHint, setUnlockingHint] = useState<string | null>(null);

  const handleAnimatedHint = useCallback((hintKey: string) => {
    if (hintsRemaining <= 0 || hintsRevealed.includes(hintKey)) return;
    setUnlockingHint(hintKey);
    setTimeout(() => {
      setUnlockingHint(null);
      handleHint();
    }, 400);
  }, [hintsRemaining, hintsRevealed, handleHint]);

  // Mode label for HUD
  const heatConfig = HEAT_LEVELS[heatLevel] ?? HEAT_LEVELS[0];
  const modeLabel = isBuzzerMode
    ? { text: '🚨 BUZZER', className: 'text-game-wrong bg-game-wrong/15' }
    : isDailyMode
    ? { text: '📅 DAILY', className: 'text-primary bg-primary/15' }
    : isHeatCheckMode
    ? { text: `${heatConfig.emoji} ${heatConfig.name}`, className: '', style: { color: `hsl(${heatConfig.color})`, backgroundColor: `hsl(${heatConfig.color} / 0.15)` } }
    : { text: config.label.toUpperCase(), className: '', style: { color: `hsl(${config.color})`, backgroundColor: `hsl(${config.color} / 0.15)` } };

  // Streak background glow colors
  const streakBgGlow = streakIntensity === 'goated'
    ? 'radial-gradient(ellipse at 50% 40%, hsl(280 80% 60% / 0.25) 0%, hsl(0 100% 55% / 0.15) 50%, transparent 80%)'
    : streakIntensity === 'inferno'
    ? 'radial-gradient(ellipse at 50% 40%, hsl(0 100% 55% / 0.22) 0%, hsl(16 100% 58% / 0.1) 60%, transparent 80%)'
    : streakIntensity === 'fire'
    ? 'radial-gradient(ellipse at 50% 40%, hsl(16 100% 58% / 0.18) 0%, transparent 70%)'
    : streakIntensity === 'warm'
    ? 'radial-gradient(ellipse at 50% 40%, hsl(38 100% 60% / 0.12) 0%, transparent 70%)'
    : null;

  return (
    <div className={`flex flex-col h-screen-safe bg-background relative overflow-hidden ${
      feedbackState === 'wrong' ? 'animate-shake' : ''
    }`}>
      {/* Flash red on time up */}
      {flashRed && (
        <div className="absolute inset-0 z-[60] pointer-events-none bg-game-wrong/30 animate-flash-red" />
      )}

      {/* Hype text on answer */}
      {hypeText && (
        <div className="absolute inset-x-0 top-1/3 z-[58] flex items-center justify-center pointer-events-none">
          <span className={`font-display text-3xl tracking-widest animate-hype-burst drop-shadow-[0_0_20px_rgba(0,0,0,0.8)] ${
            feedbackState === 'correct' ? 'text-game-correct' : 'text-game-wrong'
          }`} style={{ textShadow: feedbackState === 'correct' ? '0 0 30px hsl(var(--game-correct)/0.8)' : '0 0 30px hsl(var(--game-wrong)/0.8)' }}>
            {hypeText}
          </span>
        </div>
      )}

      {/* Multiplier banner */}
      {showMultiplierBanner && multiplier && (
        <div className="absolute inset-x-0 top-20 z-[55] flex items-center justify-center pointer-events-none">
          <div className="animate-multiplier-announce px-6 py-2 rounded-2xl glass border border-game-gold/30"
            style={{ background: 'hsl(var(--game-gold) / 0.15)' }}>
            <span className={`font-display text-2xl tracking-widest ${multiplier.color}`}>
              {multiplier.text} MULTIPLIER!
            </span>
          </div>
        </div>
      )}

      {/* Heat level up banner */}
      {heatLevelUp && isHeatCheckMode && (
        <div className="absolute inset-x-0 top-24 z-[55] flex items-center justify-center pointer-events-none">
          <div className="animate-multiplier-announce px-6 py-2.5 rounded-2xl border"
            style={{ background: `hsl(${heatConfig.color} / 0.2)`, borderColor: `hsl(${heatConfig.color} / 0.5)` }}>
            <span className="font-display text-xl tracking-widest" style={{ color: `hsl(${heatConfig.color})` }}>
              {heatConfig.emoji} {heatConfig.name}!
            </span>
          </div>
        </div>
      )}

      {/* Feedback border flash */}
      {feedbackState && (
        <div className={`absolute inset-0 z-50 pointer-events-none border-4 rounded-none ${
          feedbackState === 'correct' ? 'border-game-correct' : 'border-game-wrong'
        }`} style={{ animation: `flash-${feedbackState === 'correct' ? 'correct' : 'wrong'} ${feedbackState === 'correct' ? '400ms' : '600ms'} ease-out forwards` }} />
      )}

      {/* Wrong answer big X overlay */}
      {feedbackState === 'wrong' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
          <X className="w-24 h-24 text-game-wrong animate-scale-in drop-shadow-[0_0_30px_hsl(var(--game-wrong)/0.5)]" strokeWidth={3} />
        </div>
      )}

      {/* Score float on correct */}
      {scoreFloat != null && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 pointer-events-none flex flex-col items-center gap-0.5">
          <span className="font-display text-2xl text-game-gold animate-score-float drop-shadow-[0_0_10px_hsl(var(--game-gold)/0.5)]">
            +{scoreFloat.pts}
          </span>
          {scoreFloat.speedBonus > 0 && (
            <span className="font-display text-xs text-primary animate-score-float" style={{ animationDelay: '80ms' }}>
              ⚡ +{scoreFloat.speedBonus} speed bonus
            </span>
          )}
        </div>
      )}

      {/* Hint cost flash */}
      {hintCostFlash && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <span className="font-display text-sm text-game-wrong animate-score-float">−20 pts</span>
        </div>
      )}

      <div
        className="absolute inset-0 z-0 animate-bg-pulse pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 50% 40%, hsl(${currentPlayer.teamColor} / 0.12) 0%, transparent 70%)`,
        }}
      />
      {/* Streak intensity glow overlay */}
      {streakBgGlow && (
        <div
          className="absolute inset-0 z-0 pointer-events-none transition-all duration-700"
          style={{ background: streakBgGlow, animation: streakIntensity === 'goated' || streakIntensity === 'inferno' ? 'bg-pulse 2s ease-in-out infinite' : undefined }}
        />
      )}

      <div className="flex flex-col flex-1 px-3 pt-2 pb-[env(safe-area-inset-bottom,4px)] animate-slide-up min-h-0 relative z-10 justify-between gap-1">
        {/* Glass HUD Bar */}
        <div className="glass-strong rounded-2xl px-3 py-2 flex items-center justify-between flex-shrink-0 border border-white/[0.07]">
          {/* Left: Close */}
          <button onClick={onHome} className="text-muted-foreground press-scale p-1" aria-label="Go home">
            <X className="w-5 h-5" />
          </button>

          {/* Mode tag */}
          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${modeLabel.className}`}
            style={('style' in modeLabel) ? (modeLabel as any).style : undefined}>
            {modeLabel.text}
          </span>

          {/* Timer with circular ring */}
          {isBuzzerMode ? (
            <div className="flex items-center gap-2">
              <Timer className={`w-4 h-4 ${buzzerTimeLeft <= 10 ? (buzzerTimeLeft <= 5 ? 'text-game-wrong' : 'text-game-gold') : 'text-primary'}`} />
              <span className={`font-score text-xl ${getBuzzerTimerColor(buzzerTimeLeft)} ${buzzerTimeLeft <= 10 ? 'animate-countdown-pulse' : ''}`}>
                {buzzerTimeLeft}s
              </span>
              {deltaFlash != null && (
                <span className={`font-display text-sm animate-score-float ${deltaFlash > 0 ? 'text-game-correct' : 'text-game-wrong'}`}>
                  {deltaFlash > 0 ? `+${deltaFlash}s` : `${deltaFlash}s`}
                </span>
              )}
            </div>
          ) : (
            <div className={`relative flex items-center justify-center w-11 h-11 ${!imageReady ? '' : timeLeft <= 5 ? 'animate-countdown-pulse' : ''}`}>
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 44 44">
                <circle cx="22" cy="22" r={ringRadius} fill="none" strokeWidth="3" className="stroke-secondary" />
                {imageReady && (
                  <circle cx="22" cy="22" r={ringRadius} fill="none" strokeWidth="3"
                    stroke={timerColor}
                    strokeDasharray={ringCircumference}
                    strokeDashoffset={ringOffset}
                    strokeLinecap="round"
                    className="transition-all duration-1000 linear"
                  />
                )}
              </svg>
              {imageReady ? (
                <span className={`font-score text-sm font-bold ${timeLeft <= 5 ? 'text-game-wrong' : timeLeft <= 10 ? 'text-game-gold' : 'text-foreground'}`}>
                  {timeLeft}
                </span>
              ) : (
                <span className="font-score text-xs text-muted-foreground animate-pulse">...</span>
              )}
            </div>
          )}

          {/* Score */}
          <div className="flex items-center gap-1 relative">
            <span className="font-score text-xl font-bold text-accent">{score}</span>
            <span className="text-[9px] text-muted-foreground uppercase">pts</span>
            {multiplier && (
              <span key={multiplier.text} className={`absolute -top-2.5 -right-1 text-[9px] font-display ${multiplier.color} animate-combo-pop`}>
                {multiplier.text}
              </span>
            )}
          </div>

          {/* Lives */}
          {!isBuzzerMode && !isDailyMode && (
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 3 }).map((_, i) => (
                <span key={i} className={`text-base transition-opacity ${i < lives ? 'opacity-100' : 'opacity-20 grayscale'}`}>🏀</span>
              ))}
            </div>
          )}

          {/* Streak */}
          <div className="flex items-center gap-0.5">
            {streak >= 2 && <Flame className="w-3.5 h-3.5 text-accent animate-fire-flicker" />}
            <span className={`font-score text-sm ${streak >= 2 ? 'text-accent' : 'text-muted-foreground'}`}>{streak}🔥</span>
          </div>

          {/* Mute */}
          <button onClick={onToggleMute} className="p-1 press-scale" aria-label={isMuted ? 'Unmute' : 'Mute'}>
            {isMuted ? <VolumeX className="w-4 h-4 text-muted-foreground" /> : <Volume2 className="w-4 h-4 text-muted-foreground" />}
          </button>
        </div>

        {/* Badges row (minimal) */}
        <div className="flex justify-center items-center gap-2 flex-shrink-0">
          {activeSecondChance && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">🛡️ Protected</span>
          )}
          {currentPlayer.hasVisibleJersey && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-game-gold/20 text-game-gold border border-game-gold/30 flex items-center gap-1">
              <Shirt className="w-3 h-3" /> Jersey visible
            </span>
          )}
        </div>

        {/* Video / Mystery Container */}
        <div className="flex-1 flex flex-col items-center justify-center min-h-0 max-h-[55vh]">
          {isMysteryMode ? (
            <MysteryClueCard
              key={currentPlayer.id}
              player={currentPlayer}
              cluesRevealed={mysteryCluesRevealed}
              onRevealClue={onRevealClue ?? (() => {})}
              onReady={handleMysteryReady}
            />
          ) : (
            <div className="relative w-full">
              <BlurredVideoPlayer
                key={currentPlayer.id}
                videoFile={currentPlayer.videoFile}
                imageUrl={currentPlayer.imageUrl}
                onReady={handleImageReady}
              />
              {/* Vignette overlay at ≤3s */}
              {timeLeft <= 3 && !isBuzzerMode && (
                <div
                  className="absolute inset-0 z-[3] pointer-events-none rounded-2xl animate-vignette-pulse"
                  style={{
                    background: 'radial-gradient(ellipse at center, transparent 40%, hsl(var(--game-wrong) / 0.3) 100%)',
                  }}
                />
              )}
            </div>
          )}
        </div>

        {/* Power-ups row (horizontal, below video) */}
        <div className="flex justify-center flex-shrink-0">
          <PowerUpBar
            inventory={powerUpInventory}
            activeSecondChance={activeSecondChance}
            onUsePowerUp={onUsePowerUp}
            disabled={!imageReady}
            vertical={false}
          />
        </div>

        {/* Hints Row */}
        <div className="flex items-center justify-center gap-1.5 flex-shrink-0 flex-wrap">
          {hintTypes.map((hint) => {
            const isRevealed = hintsRevealed.includes(hint.key);
            const isUnlocking = unlockingHint === hint.key;
            const nextUnlockable = hintTypes.find(h => !hintsRevealed.includes(h.key));
            const isNext = nextUnlockable?.key === hint.key;
            return (
              <button key={hint.key} onClick={() => !isRevealed && isNext && handleAnimatedHint(hint.key)}
                disabled={isRevealed || !isNext || hintsRemaining <= 0}
                className={`press-scale answer-button-press relative flex items-center justify-center rounded-full transition-all duration-200 ${
                  isRevealed
                    ? 'glass px-2.5 py-1 min-w-[62px] border border-primary/30'
                    : isNext
                      ? 'min-w-[56px] h-10 bg-foreground/10 backdrop-blur-md border border-foreground/20 hover:bg-foreground/20 disabled:opacity-30'
                      : 'w-9 h-9 bg-foreground/5 backdrop-blur-md border border-foreground/5 opacity-30'
                }`}>
                {isRevealed ? (
                  <span className={`text-[10px] font-semibold text-foreground ${hint.animClass}`}>{hint.icon} {hint.value}</span>
                ) : (
                  <div className={`flex flex-col items-center ${isUnlocking ? 'animate-hint-shake' : ''}`}>
                    {isUnlocking ? (
                      <Lock className="w-3.5 h-3.5 text-primary animate-hint-burst" />
                    ) : (
                      <Lock className="w-3 h-3 text-muted-foreground" />
                    )}
                    <span className="text-[7px] font-bold text-muted-foreground">{hint.label}</span>
                    {isNext && (
                      <span className="text-[6px] text-game-wrong font-bold">−{hint.cost}pts</span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Answer Grid — hidden until video ready, glass cards with feedback */}
        <div className={`grid grid-cols-2 gap-2 flex-shrink-0 transition-all duration-300 ${
          imageReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
        }`}>
          {choices.map((choice, idx) => {
            const isEliminated = eliminatedChoices.includes(choice.id);
            const isAnswered = answeredId !== null;
            const isThis = choice.id === answeredId;
            const isCorrectChoice = choice.id === currentPlayer.id;

            let feedbackClass = '';
            if (isAnswered && isThis && feedbackState === 'correct') {
              feedbackClass = 'border-game-correct bg-game-correct/20 text-game-correct shadow-[0_0_16px_hsl(var(--game-correct)/0.3)]';
            } else if (isAnswered && isThis && feedbackState === 'wrong') {
              feedbackClass = 'border-game-wrong bg-game-wrong/20 text-game-wrong shadow-[0_0_16px_hsl(var(--game-wrong)/0.3)]';
            } else if (isAnswered && feedbackState === 'wrong' && isCorrectChoice) {
              feedbackClass = 'border-game-correct bg-game-correct/20 text-game-correct shadow-[0_0_16px_hsl(var(--game-correct)/0.3)]';
            } else if (isAnswered && !isThis) {
              feedbackClass = 'opacity-20';
            }

            return (
              <button
                key={choice.id}
                onClick={() => handleAnswer(choice.id)}
                disabled={!imageReady || isEliminated || isAnswered}
                style={{
                  animation: imageReady ? `slide-up-fast 250ms ease-out ${idx * 50}ms both` : undefined,
                  opacity: imageReady ? undefined : 0,
                }}
                className={`answer-button-press min-h-[62px] py-2.5 px-3.5 text-sm font-bold rounded-2xl border transition-all duration-150 flex items-center gap-2 ${
                  feedbackClass || (isEliminated
                    ? 'border-border/20 bg-card/20 text-muted-foreground/25 line-through opacity-25'
                    : 'bg-white/[0.04] border-white/[0.09] text-foreground active:scale-[0.97] active:bg-primary/15 active:border-primary/50 hover:bg-white/[0.07] hover:border-white/[0.14]')
                }`}
              >
                <span className="w-5 h-5 rounded-lg bg-white/[0.06] flex items-center justify-center text-[9px] font-score text-muted-foreground/50 flex-shrink-0">{idx + 1}</span>
                <span className="flex-1 text-left text-[13px] leading-tight">{choice.name}</span>
                {isAnswered && isThis && feedbackState === 'correct' && <Check className="w-4 h-4 text-game-correct flex-shrink-0" strokeWidth={2.5} />}
                {isAnswered && isThis && feedbackState === 'wrong' && <X className="w-4 h-4 text-game-wrong flex-shrink-0" strokeWidth={2.5} />}
                {isAnswered && feedbackState === 'wrong' && isCorrectChoice && !isThis && <Check className="w-4 h-4 text-game-correct flex-shrink-0" strokeWidth={2.5} />}
              </button>
            );
          })}
        </div>

        {/* Preload next player's video */}
        {nextPlayerVideoFile && (
          <video src={nextPlayerVideoFile} preload="auto" muted className="hidden" />
        )}
      </div>
    </div>
  );
}
