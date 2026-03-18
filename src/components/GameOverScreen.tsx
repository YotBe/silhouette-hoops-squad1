import { useEffect, useState } from 'react';
import { TIER_CONFIG, DifficultyTier } from '@/data/players';
import { Trophy, Target, Flame, RotateCcw, Home, Zap, Share2, Calendar, Timer, ArrowUp, Copy, Swords, Image as ImageIcon, Loader2 } from 'lucide-react';
import { fireConfetti } from '@/utils/confetti';
import { toast } from '@/hooks/use-toast';
import { getDailyResult, getDailyShareText, getDailyChallengeNumber } from '@/utils/dailyChallenge';
import { buildChallengeURL } from '@/utils/challenge';
import { generateShareImage, shareOrDownloadImage } from '@/utils/shareImage';
import { submitGlobalScore } from '@/utils/globalLeaderboard';
import { storageGet } from '@/utils/safeStorage';

interface AnswerEntry {
  correct: boolean;
  hintsUsed: number;
}

interface Props {
  score: number;
  bestStreak: number;
  totalCorrect: number;
  totalAnswered: number;
  tier: DifficultyTier;
  highScores: Record<string, number>;
  xpEarned: number;
  answerHistory: AnswerEntry[];
  isDailyMode: boolean;
  isBuzzerMode?: boolean;
  isHeatCheckMode?: boolean;
  isChallengeMode?: boolean;
  isDuelMode?: boolean;
  challengerScore?: number;
  challengerName?: string;
  duelOpponentName?: string;
  duelOpponentScore?: number;
  duelRole?: 'host' | 'guest' | null;
  playerHistory?: string[];
  leveledUp?: boolean;
  newLevel?: number;
  onPlayAgain: (tier: DifficultyTier) => void;
  onPlayBuzzer?: () => void;
  onPlayHeatCheck?: () => void;
  onHome: () => void;
}

const TIER_ORDER: DifficultyTier[] = ['rookie', 'pro', 'allstar', 'mvp', 'legend'];

function getNextTier(currentTier: DifficultyTier): DifficultyTier | null {
  const idx = TIER_ORDER.indexOf(currentTier);
  if (idx < 0 || idx >= TIER_ORDER.length - 1) return null;
  return TIER_ORDER[idx + 1];
}

function getEmojiForAnswer(entry: AnswerEntry): string {
  if (!entry.correct) return '🔴';
  return entry.hintsUsed > 0 ? '🟡' : '🟢';
}

export function GameOverScreen({ score, bestStreak, totalCorrect, totalAnswered, tier, highScores, xpEarned, answerHistory, isDailyMode, isBuzzerMode = false, isHeatCheckMode = false, isChallengeMode = false, isDuelMode = false, challengerScore = 0, challengerName = '', duelOpponentName = '', duelOpponentScore = 0, duelRole = null, playerHistory = [], leveledUp = false, newLevel = 1, onPlayAgain, onPlayBuzzer, onPlayHeatCheck, onHome }: Props) {
  const accuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
  const isNewHighScore = !isDailyMode && !isBuzzerMode && !isHeatCheckMode && score >= (highScores[tier] || 0) && score > 0;
  const isBuzzerNewHS = isBuzzerMode && score >= (highScores['buzzer'] || 0) && score > 0;
  const isHeatNewHS = isHeatCheckMode && score >= (highScores['heatcheck'] || 0) && score > 0;
  const isPerfect = totalAnswered > 0 && totalCorrect === totalAnswered;
  const config = TIER_CONFIG[tier];
  const nextTier = !isDailyMode && !isBuzzerMode && !isHeatCheckMode ? getNextTier(tier) : null;
  const xp = parseInt(storageGet('sg_xp') ?? '0', 10);
  const nextTierUnlocked = nextTier ? xp >= TIER_CONFIG[nextTier].xpRequired : false;
  const challengeNumber = getDailyChallengeNumber();
  const emojiGrid = answerHistory.map(getEmojiForAnswer).join('');
  const streakMaintained = bestStreak >= 2;
  const playerName = storageGet('sg_player_name') ?? 'Anonymous';
  const challengeWon = isChallengeMode && score > challengerScore;
  const challengeTied = isChallengeMode && score === challengerScore;
  const duelWon = isDuelMode && score > duelOpponentScore;
  const duelTied = isDuelMode && score === duelOpponentScore;
  const [sharingImage, setSharingImage] = useState(false);

  useEffect(() => {
    if (isNewHighScore || isBuzzerNewHS || isHeatNewHS || isPerfect || (isChallengeMode && challengeWon) || (isDuelMode && duelWon)) {
      setTimeout(() => fireConfetti(), 300);
    }
  }, [isNewHighScore, isBuzzerNewHS, isHeatNewHS, isPerfect, isChallengeMode, challengeWon, isDuelMode, duelWon]);

  // Submit global score on mount
  useEffect(() => {
    if (score <= 0) return;
    const modeKey = isHeatCheckMode ? 'heatcheck' : isBuzzerMode ? 'buzzer' : isDailyMode ? 'daily' : tier;
    submitGlobalScore({
      playerName,
      score,
      tier: modeKey,
      streak: bestStreak,
      accuracy,
    }).catch(() => {});
  }, []);

  const handleSaveImage = async () => {
    setSharingImage(true);
    try {
      const modeName = isDuelMode ? 'Live Duel' : isHeatCheckMode ? 'Heat Check' : isBuzzerMode ? 'Buzzer Beater' : isDailyMode ? `Daily #${challengeNumber}` : config.label;
      const accentHsl = isHeatCheckMode ? '16 100% 58%' : isBuzzerMode ? '16 100% 58%' : config.color;
      const blob = await generateShareImage({
        score,
        bestStreak,
        totalCorrect,
        totalAnswered,
        emojiGrid: emojiGrid,
        mode: modeName,
        accentHsl,
      });
      if (blob) await shareOrDownloadImage(blob);
    } finally {
      setSharingImage(false);
    }
  };

  const getShareText = (): string => {
    if (isDuelMode) {
      const result = duelWon ? 'WON' : duelTied ? 'TIED' : 'LOST';
      return `⚔️ WHO IS IT? LIVE DUEL ${result}!\n${emojiGrid}\nMy score: ${score} | ${duelOpponentName}: ${duelOpponentScore}\nwhoisit.app`;
    }
    if (isChallengeMode) {
      const result = challengeWon ? 'WON' : challengeTied ? 'TIED' : 'LOST';
      return `⚔️ WHO IS IT? CHALLENGE ${result}!\n${emojiGrid}\nMy score: ${score} | ${challengerName}: ${challengerScore}\nwhoisit.app`;
    }
    if (isDailyMode) {
      return `WHO IS IT? 🏀 Day #${challengeNumber}\n${emojiGrid}\nScore: ${score} | 🔥 ${bestStreak} streak\nwhoisit.app`;
    }
    if (isBuzzerMode) {
      return `🚨 WHO IS IT? Buzzer Beater!\n${emojiGrid}\nScore: ${score} | 🔥 ${bestStreak} streak\nwhoisit.app`;
    }
    if (isHeatCheckMode) {
      return `🔥 WHO IS IT? Heat Check!\n${emojiGrid}\nScore: ${score} | 🔥 ${bestStreak} streak\nwhoisit.app`;
    }
    return `🏀 WHO IS IT? — ${config.label}\n${emojiGrid}\nScore: ${score} | 🔥 ${bestStreak} streak\nwhoisit.app`;
  };

  const handleChallengeFriend = async () => {
    if (playerHistory.length === 0) return;
    const url = buildChallengeURL({ playerIds: playerHistory, score, name: playerName, tier });
    const text = `⚔️ Beat my WHO IS IT? score of ${score}!\n${url}`;
    if (navigator.share) {
      try { await navigator.share({ text, url }); return; } catch {}
    }
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: 'Challenge link copied!', description: `Share it and dare your friends to beat ${score} pts` });
    } catch {
      toast({ title: 'Challenge link', description: url });
    }
  };

  const handleCopy = async () => {
    const text = getShareText();
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: 'Copied to clipboard!', description: 'Share it with your friends 🏀' });
    } catch {
      toast({ title: 'Could not copy', description: 'Try sharing manually' });
    }
  };

  const handleShare = async () => {
    const text = getShareText();
    if (navigator.share) {
      try { await navigator.share({ text }); } catch {}
    } else {
      handleCopy();
    }
  };

  const headerText = isDailyMode || isBuzzerMode || isHeatCheckMode ? 'SESSION COMPLETE' : 'GAME OVER';
  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="flex flex-col items-center justify-center min-h-screen-safe px-4 py-6 bg-background overflow-y-auto">
      {leveledUp && (
        <div className="text-center mb-4 animate-level-up">
          <span className="text-4xl">⬆️</span>
          <p className="font-display text-3xl tracking-wider mt-1 drop-shadow-[0_0_20px_hsl(var(--game-gold)/0.5)]"
            style={{ color: 'hsl(var(--game-gold))' }}>
            LEVEL UP → LVL {newLevel}
          </p>
        </div>
      )}
      {(isNewHighScore || isBuzzerNewHS || isHeatNewHS) && (
        <div className="text-center mb-4 animate-slam-down">
          <span className="text-4xl">🎉</span>
          <p className="text-game-gold font-display text-2xl tracking-wider mt-1 drop-shadow-[0_0_20px_hsl(var(--game-gold)/0.5)] animate-pulse">
            NEW RECORD!
          </p>
        </div>
      )}

      {/* Duel result banner */}
      {isDuelMode && (
        <div className="text-center mb-4 animate-slam-down">
          <p className={`font-display text-3xl tracking-wider drop-shadow-[0_0_20px_rgba(0,0,0,0.5)] ${
            duelWon ? 'text-game-correct' : duelTied ? 'text-game-gold' : 'text-game-wrong'
          }`}>
            {duelWon ? '⚔️ YOU WIN!' : duelTied ? '🤝 TIE GAME!' : '💀 YOU LOSE!'}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            You: <span className="text-foreground font-score font-bold">{score}</span> · {duelOpponentName}: <span className="font-score font-bold" style={{ color: duelWon ? 'hsl(var(--game-wrong))' : 'hsl(var(--game-correct))' }}>{duelOpponentScore}</span>
          </p>
        </div>
      )}

      {/* Challenge result banner */}
      {isChallengeMode && (
        <div className={`text-center mb-4 animate-slam-down`}>
          <p className={`font-display text-3xl tracking-wider drop-shadow-[0_0_20px_rgba(0,0,0,0.5)] ${
            challengeWon ? 'text-game-correct' : challengeTied ? 'text-game-gold' : 'text-game-wrong'
          }`}>
            {challengeWon ? '⚔️ YOU WIN!' : challengeTied ? '🤝 TIE GAME!' : '💀 YOU LOSE!'}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            You: <span className="text-foreground font-score font-bold">{score}</span> · {challengerName}: <span className="font-score font-bold" style={{ color: challengeWon ? 'hsl(var(--game-wrong))' : 'hsl(var(--game-correct))' }}>{challengerScore}</span>
          </p>
        </div>
      )}

      <h2 className="text-4xl font-display text-foreground tracking-wider mb-1 animate-slam-down">
        {headerText}
      </h2>

      {isBuzzerMode && (
        <div className="flex items-center gap-2 mb-2 animate-slide-up">
          <Timer className="w-5 h-5 text-accent" />
          <span className="text-sm font-display text-muted-foreground tracking-wider">BUZZER BEATER</span>
        </div>
      )}
      {isHeatCheckMode && (
        <div className="flex items-center gap-2 mb-2 animate-slide-up">
          <span className="text-xl">🔥</span>
          <span className="text-sm font-display tracking-wider" style={{ color: 'hsl(16 100% 58%)' }}>HEAT CHECK</span>
        </div>
      )}
      {isChallengeMode && (
        <div className="flex items-center gap-2 mb-2 animate-slide-up">
          <Swords className="w-5 h-5 text-game-gold" />
          <span className="text-sm font-display text-muted-foreground tracking-wider">CHALLENGE vs {challengerName}</span>
        </div>
      )}
      {isDuelMode && (
        <div className="flex items-center gap-2 mb-2 animate-slide-up">
          <Swords className="w-5 h-5 text-accent" />
          <span className="text-sm font-display text-muted-foreground tracking-wider">LIVE DUEL vs {duelOpponentName}</span>
        </div>
      )}
      {isDailyMode && !isChallengeMode && (
        <div className="flex items-center gap-2 mb-2 animate-slide-up">
          <Calendar className="w-5 h-5 text-primary" />
          <span className="text-sm font-display text-muted-foreground tracking-wider">DAILY CHALLENGE #{challengeNumber}</span>
        </div>
      )}
      {!isDailyMode && !isBuzzerMode && !isHeatCheckMode && (
        <div className="text-[10px] font-bold uppercase tracking-wider mb-4 px-3 py-1 rounded-full"
          style={{ color: `hsl(${config.color})`, backgroundColor: `hsl(${config.color} / 0.15)` }}>
          {config.label}
        </div>
      )}

      {/* Score */}
      <div className="text-6xl font-score text-accent mb-2 animate-score-pop drop-shadow-[0_0_25px_hsl(var(--accent)/0.4)]">
        {score}
      </div>

      <div className="flex items-center gap-1.5 mb-4 px-3 py-1 rounded-full bg-secondary animate-slide-up" style={{ animationDelay: '0.05s' }}>
        <Zap className="w-4 h-4 text-game-gold" />
        <span className="text-sm font-semibold text-game-gold font-score">+{xpEarned} XP</span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-5 mb-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <div className="flex flex-col items-center">
          <Target className="w-5 h-5 text-muted-foreground mb-1" />
          <span className="text-xl font-score">{accuracy}%</span>
          <span className="text-[10px] text-muted-foreground">Accuracy</span>
        </div>
        <div className="flex flex-col items-center">
          <Flame className="w-5 h-5 text-accent mb-1" />
          <span className="text-xl font-score">{bestStreak}</span>
          <span className="text-[10px] text-muted-foreground">Best Streak</span>
        </div>
        <div className="flex flex-col items-center">
          <Trophy className="w-5 h-5 text-game-gold mb-1" />
          <span className="text-xl font-score">{totalCorrect}/{totalAnswered}</span>
          <span className="text-[10px] text-muted-foreground">Correct</span>
        </div>
      </div>

      {/* Share Card Preview */}
      <div className="w-full max-w-xs mb-4 p-4 rounded-2xl glass-strong border border-[rgba(255,255,255,0.08)] animate-slide-up" style={{ animationDelay: '0.15s' }}>
        <p className="font-display text-lg text-foreground tracking-widest text-center mb-1">WHO IS IT? 🏀</p>
        <p className="text-[10px] text-muted-foreground text-center mb-3">
          {isDailyMode ? `${dateStr} — Daily Challenge #${challengeNumber}` : isBuzzerMode ? `${dateStr} — Buzzer Beater` : `${dateStr} — ${config.label}`}
        </p>

        {/* Emoji Grid */}
        {answerHistory.length > 0 && (
          <div className="text-2xl tracking-widest text-center mb-3">
            {answerHistory.map((entry, i) => (
              <span key={i}>{getEmojiForAnswer(entry)}</span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-center gap-4 text-sm mb-2">
          <span className="font-score text-accent font-bold">{score} pts</span>
          <span className="font-score text-foreground">🔥 {bestStreak} streak</span>
        </div>
        {streakMaintained && (
          <p className="text-[9px] text-game-correct text-center">✓ Streak maintained</p>
        )}
        <p className="text-[9px] text-muted-foreground text-center mt-2">whoisit.app</p>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-3 mb-4 animate-slide-up" style={{ animationDelay: '0.18s' }}>
        <span className="text-[9px] text-muted-foreground">🟢 No hints</span>
        <span className="text-[9px] text-muted-foreground">🟡 With hints</span>
        <span className="text-[9px] text-muted-foreground">🔴 Wrong/Timeout</span>
      </div>

      {/* Buttons */}
      <div className="flex flex-col gap-3 w-full max-w-xs animate-slide-up" style={{ animationDelay: '0.2s' }}>
        {/* Copy + Share side by side */}
        <div className="flex gap-2">
          <button onClick={handleCopy}
            className="flex-1 py-4 rounded-2xl glass border border-[rgba(255,255,255,0.1)] font-display tracking-widest press-scale flex items-center justify-center gap-2 text-foreground text-sm">
            <Copy className="w-4 h-4" /> COPY
          </button>
          <button onClick={handleShare}
            className="flex-1 py-4 rounded-2xl gradient-hero text-white font-display tracking-widest press-scale flex items-center justify-center gap-2 text-sm"
            style={{ boxShadow: '0 4px 25px rgba(59, 130, 246, 0.4)' }}>
            <Share2 className="w-4 h-4" /> SHARE
          </button>
        </div>

        {/* Save as Image */}
        <button
          onClick={handleSaveImage}
          disabled={sharingImage}
          className="w-full py-3.5 rounded-2xl glass border border-[rgba(255,255,255,0.1)] font-display tracking-widest press-scale flex items-center justify-center gap-2 text-foreground text-sm disabled:opacity-50"
        >
          {sharingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
          {sharingImage ? 'GENERATING...' : 'SAVE AS IMAGE'}
        </button>

        {/* Challenge a Friend */}
        {!isChallengeMode && playerHistory.length > 0 && (
          <button onClick={handleChallengeFriend}
            className="w-full py-4 rounded-2xl border font-display tracking-widest press-scale flex items-center justify-center gap-2 text-sm"
            style={{ borderColor: 'hsl(var(--game-gold) / 0.4)', color: 'hsl(var(--game-gold))', background: 'hsl(var(--game-gold) / 0.08)' }}>
            <Swords className="w-4 h-4" /> CHALLENGE A FRIEND
          </button>
        )}

        {!isDailyMode && !isChallengeMode && (
          <button onClick={() => {
            if (isHeatCheckMode && onPlayHeatCheck) onPlayHeatCheck();
            else if (isBuzzerMode && onPlayBuzzer) onPlayBuzzer();
            else onPlayAgain(tier);
          }}
            className="w-full py-4 rounded-2xl glass border border-[rgba(255,255,255,0.1)] font-display tracking-widest press-scale flex items-center justify-center gap-2 text-foreground">
            <RotateCcw className="w-4 h-4" /> PLAY AGAIN
          </button>
        )}
        {isChallengeMode && (
          <button onClick={() => onPlayAgain(tier)}
            className="w-full py-4 rounded-2xl glass border border-[rgba(255,255,255,0.1)] font-display tracking-widest press-scale flex items-center justify-center gap-2 text-foreground">
            <RotateCcw className="w-4 h-4" /> REMATCH
          </button>
        )}
        {nextTier && nextTierUnlocked && (
          <button onClick={() => onPlayAgain(nextTier)}
            className="w-full py-4 rounded-2xl border border-primary/40 text-primary font-display tracking-widest press-scale flex items-center justify-center gap-2 hover:bg-primary/10">
            <ArrowUp className="w-4 h-4" /> TRY {TIER_CONFIG[nextTier].label.toUpperCase()}
          </button>
        )}
        <button onClick={onHome}
          className="w-full py-4 rounded-2xl glass border border-[rgba(255,255,255,0.08)] font-display tracking-widest press-scale flex items-center justify-center gap-2 text-foreground">
          <Home className="w-4 h-4" /> HOME
        </button>
      </div>
    </div>
  );
}
