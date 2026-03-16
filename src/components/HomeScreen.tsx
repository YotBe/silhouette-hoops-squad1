import { useState, useEffect } from 'react';
import { DifficultyTier, TIER_CONFIG } from '@/data/players';
import { Volume2, VolumeX, Calendar, Check, Smartphone, Timer, Flame, ChevronRight, Bell, Lock, Pencil, X as XIcon, Zap, Trophy } from 'lucide-react';
import { InstallBanner } from '@/components/InstallBanner';
import { isDailyChallengeCompleted, getDailyResult, getTimeUntilNextChallenge } from '@/utils/dailyChallenge';
import { isHapticsEnabled, setHapticsEnabled, isWelcomeHapticsEnabled, setWelcomeHapticsEnabled } from '@/utils/haptics';
import { checkAndUpdateStreak, getStreakInfo, claimStreakReward, type StreakInfo, type StreakReward } from '@/utils/dailyStreak';
import { trackEvent } from '@/utils/analytics';
import { checkDailyReward, type DailyReward } from '@/utils/dailyRewards';
import { DailyRewardModal } from '@/components/DailyRewardModal';
import { DailyQuestsWidget } from '@/components/DailyQuestsWidget';
import { TutorialOverlay } from '@/components/TutorialOverlay';
import { levelProgress } from '@/utils/levels';
import { getNextAchievement } from '@/utils/achievements';
import { ChallengeData } from '@/utils/challenge';

interface Props {
  tier: DifficultyTier;
  setTier: (t: DifficultyTier) => void;
  startGame: (t: DifficultyTier) => void;
  startDailyChallenge: () => void;
  startBuzzerBeater: () => void;
  startMysteryMode: () => void;
  startHeatCheckMode: () => void;
  startChallengeGame?: (challenge: ChallengeData) => void;
  pendingChallenge?: ChallengeData | null;
  highScores: Record<string, number>;
  xp: number;
  unlockedTiers: DifficultyTier[];
  isMuted: boolean;
  onToggleMute: () => void;
}

function getDailyChallengeNumber(): number {
  const start = new Date('2024-01-01').getTime();
  const now = new Date().getTime();
  return Math.floor((now - start) / (1000 * 60 * 60 * 24)) + 1;
}

function getStoredName(): string {
  try { return localStorage.getItem('sg_player_name') || ''; } catch { return ''; }
}

export function HomeScreen({ tier, setTier, startGame, startDailyChallenge, startBuzzerBeater, startMysteryMode, startHeatCheckMode, startChallengeGame, pendingChallenge, highScores, xp, unlockedTiers, isMuted, onToggleMute }: Props) {
  const [hapticsOn, setHapticsOn] = useState(isHapticsEnabled);
  const [welcomeHapticsOn, setWelcomeHapticsOn] = useState(isWelcomeHapticsEnabled);
  const [playerName, setPlayerName] = useState(getStoredName);
  const [editingName, setEditingName] = useState(() => !getStoredName());
  const [nameInput, setNameInput] = useState(getStoredName);
  const dailyCompleted = isDailyChallengeCompleted();
  const dailyResult = getDailyResult();
  const [countdown, setCountdown] = useState(getTimeUntilNextChallenge());
  const buzzerHS = highScores['buzzer'] || 0;
  const endlessHS = highScores[tier] || 0;
  const [streak, setStreak] = useState<StreakInfo>(getStreakInfo());
  const [streakReward, setStreakReward] = useState<StreakReward | null>(null);
  const dailyNum = getDailyChallengeNumber();
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  const [dailyReward, setDailyReward] = useState<DailyReward | null>(null);
  const [showTutorial, setShowTutorial] = useState(() => !localStorage.getItem('sg_tutorial_seen'));
  const lvl = levelProgress(xp);
  const nextAchievement = getNextAchievement();

  useEffect(() => {
    const interval = setInterval(() => setCountdown(getTimeUntilNextChallenge()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const info = checkAndUpdateStreak();
    setStreak(info);
    trackEvent('session_start', { streak: info.count });
    const reward = claimStreakReward(info.count);
    if (reward) {
      setStreakReward(reward);
      setTimeout(() => setStreakReward(null), 4000);
    }
    const dr = checkDailyReward();
    if (dr) setDailyReward(dr);
  }, []);

  const toggleHaptics = () => {
    const next = !hapticsOn;
    setHapticsOn(next);
    setHapticsEnabled(next);
  };

  const saveName = () => {
    const trimmed = nameInput.trim().slice(0, 20);
    if (!trimmed) return;
    setPlayerName(trimmed);
    setNameInput(trimmed);
    try { localStorage.setItem('sg_player_name', trimmed); } catch {}
    setEditingName(false);
  };

  return (
    <>
    {showTutorial && <TutorialOverlay onDone={() => setShowTutorial(false)} />}
    {dailyReward && <DailyRewardModal reward={dailyReward} onClose={() => setDailyReward(null)} />}
    <div className="relative flex flex-col items-center min-h-screen-safe px-5 pb-24 animate-slide-up bg-background overflow-y-auto">
      {/* Top bar */}
      <div className="w-full flex items-center justify-between pt-4 mb-6">
        <div className="flex items-center gap-2">
          {streak.count >= 2 && (
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full glass border border-[rgba(255,255,255,0.08)] ${
              streak.atRisk ? 'border-destructive/30' : ''
            }`}>
              <Flame className={`w-4 h-4 ${streak.atRisk ? 'text-destructive animate-pulse' : 'text-accent animate-fire-flicker'}`} />
              <span className="font-score text-sm font-bold text-accent">{streak.count}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { const next = !welcomeHapticsOn; setWelcomeHapticsOn(next); setWelcomeHapticsEnabled(next); }} className="p-2 rounded-full glass border border-[rgba(255,255,255,0.08)] press-scale" aria-label={welcomeHapticsOn ? 'Disable welcome buzz' : 'Enable welcome buzz'} title={welcomeHapticsOn ? 'Welcome buzz on' : 'Welcome buzz off'}>
            <Bell className={`w-4 h-4 ${welcomeHapticsOn ? 'text-primary' : 'text-muted-foreground'}`} />
          </button>
          <button onClick={toggleHaptics} className="p-2 rounded-full glass border border-[rgba(255,255,255,0.08)] press-scale" aria-label={hapticsOn ? 'Disable haptics' : 'Enable haptics'}>
            <Smartphone className={`w-4 h-4 ${hapticsOn ? 'text-primary' : 'text-muted-foreground'}`} />
          </button>
          <button onClick={onToggleMute} className="p-2 rounded-full glass border border-[rgba(255,255,255,0.08)] press-scale" aria-label={isMuted ? 'Unmute' : 'Mute'}>
            {isMuted ? <VolumeX className="w-4 h-4 text-muted-foreground" /> : <Volume2 className="w-4 h-4 text-muted-foreground" />}
          </button>
        </div>
      </div>

      {/* Player name / greeting */}
      {editingName ? (
        <div className="w-full max-w-sm mb-4 animate-scale-in">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest text-center mb-2">
            {playerName ? 'Change your name' : "What's your name?"}
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') { if (playerName) setEditingName(false); } }}
              placeholder="Enter your name..."
              maxLength={20}
              autoFocus
              className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.07] border border-white/[0.12] text-foreground text-sm font-semibold placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
            />
            <button
              onClick={saveName}
              disabled={!nameInput.trim()}
              className="px-4 py-2.5 rounded-xl gradient-hero text-white text-sm font-bold press-scale disabled:opacity-40"
            >
              Save
            </button>
            {playerName && (
              <button onClick={() => setEditingName(false)} className="p-2.5 rounded-xl glass border border-white/[0.08] press-scale">
                <XIcon className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="w-full max-w-sm mb-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Welcome back</p>
            <h2 className="font-display text-xl text-foreground tracking-wider" style={{ textShadow: '0 0 20px hsl(var(--primary)/0.3)' }}>
              {playerName} 👋
            </h2>
          </div>
          <button
            onClick={() => { setNameInput(playerName); setEditingName(true); }}
            className="p-2 rounded-xl glass border border-white/[0.08] press-scale"
            aria-label="Edit name"
          >
            <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
      )}

      {/* Mystery Silhouette Icon */}
      <div className="relative mb-3 animate-mystery-pulse" style={{ filter: 'drop-shadow(0 0 15px rgba(59,130,246,0.4))' }}>
        <svg width="80" height="80" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="32" cy="56" rx="16" ry="4" fill="hsl(var(--primary) / 0.15)" />
          <path d="M32 8C26 8 22 12 22 18C22 24 26 28 32 28C38 28 42 24 42 18C42 12 38 8 32 8Z" fill="hsl(var(--muted-foreground) / 0.3)" stroke="hsl(var(--primary) / 0.5)" strokeWidth="1.5"/>
          <path d="M20 52V38C20 32 24 28 32 28C40 28 44 32 44 38V52" fill="hsl(var(--muted-foreground) / 0.2)" stroke="hsl(var(--primary) / 0.5)" strokeWidth="1.5"/>
          <text x="32" y="22" textAnchor="middle" fill="hsl(var(--primary))" fontSize="14" fontFamily="Bebas Neue, sans-serif" fontWeight="bold">?</text>
        </svg>
      </div>

      {/* Logo */}
      <h1 className="text-5xl sm:text-7xl font-display text-gradient-title tracking-wider mb-1"
        style={{ textShadow: '0 0 40px rgba(59, 130, 246, 0.3)' }}>
        WHO IS IT?
      </h1>
      <p className="text-muted-foreground text-sm mb-2 text-center">
        NBA players in disguise. Can you spot them?
      </p>

      {/* Daily info + XP bar */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs text-muted-foreground">{today}</span>
        <span className="text-xs text-primary font-semibold">· DAILY #{dailyNum}</span>
      </div>

      {/* Level badge + XP progress bar */}
      <div className="w-full max-w-sm mb-5">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="font-display text-lg text-game-gold" style={{ textShadow: '0 0 10px hsl(var(--game-gold)/0.5)' }}>
              LEVEL {lvl.level}
            </span>
            <span className="text-[10px] font-score text-muted-foreground">⭐ {xp} XP</span>
          </div>
          <span className="text-[10px] text-muted-foreground font-score">
            {lvl.nextLevelXP - xp} to Lvl {lvl.level + 1}
          </span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${lvl.pct}%`,
              background: 'linear-gradient(90deg, hsl(var(--game-gold)), hsl(var(--accent)))',
            }}
          />
        </div>

        {/* Next achievement widget */}
        {nextAchievement && (
          <div className="mt-2 flex items-center gap-2 px-2 py-1.5 rounded-lg glass border border-[rgba(255,255,255,0.06)]">
            <span className="text-base">{nextAchievement.achievement.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-foreground truncate">{nextAchievement.achievement.title}</span>
                <span className="text-[9px] text-muted-foreground ml-1">{nextAchievement.label}</span>
              </div>
              <div className="h-0.5 bg-secondary rounded-full overflow-hidden mt-0.5">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${nextAchievement.pct * 100}%` }} />
              </div>
            </div>
          </div>
        )}

        {/* Tier unlock bar (condensed) */}
        {(() => {
          const tiers = Object.keys(TIER_CONFIG) as DifficultyTier[];
          const nextTier = tiers.find(t => xp < TIER_CONFIG[t].xpRequired);
          if (!nextTier) return <span className="text-[9px] text-game-gold block text-right mt-1">MAX TIER UNLOCKED</span>;
          const nextTierConfig = TIER_CONFIG[nextTier];
          return (
            <p className="text-[9px] text-muted-foreground text-right mt-1" style={{ color: `hsl(${nextTierConfig.color})` }}>
              {nextTier} tier unlocks at {nextTierConfig.xpRequired} XP
            </p>
          );
        })()}
      </div>

      {/* Streak reward */}
      {streakReward && (
        <div className="w-full max-w-sm mb-4 flex items-center justify-center gap-2 py-2 rounded-xl glass border border-accent/20 animate-scale-in">
          <span className="text-sm">🎁</span>
          <span className="text-xs font-display text-accent tracking-wider">{streakReward.label} unlocked!</span>
        </div>
      )}

      {/* Pending challenge banner */}
      {pendingChallenge && startChallengeGame && (
        <div className="w-full max-w-sm mb-3 animate-scale-in">
          <button
            onClick={() => startChallengeGame(pendingChallenge)}
            className="w-full rounded-2xl overflow-hidden border border-game-gold/40 relative transition-all press-scale active:scale-[0.97]"
            style={{ background: 'linear-gradient(135deg, hsl(var(--game-gold) / 0.15) 0%, hsl(var(--game-gold) / 0.05) 100%)' }}
          >
            <div className="absolute top-0 left-0 right-0 h-[1.5px] animate-shimmer" style={{ background: 'linear-gradient(90deg, hsl(var(--game-gold)), transparent)' }} />
            <div className="flex items-center gap-3.5 p-4">
              <div className="w-11 h-11 rounded-xl bg-game-gold/20 flex items-center justify-center flex-shrink-0 text-xl">⚔️</div>
              <div className="text-left flex-1">
                <span className="font-display text-base tracking-wider block text-game-gold">CHALLENGE WAITING!</span>
                <span className="text-[11px] text-muted-foreground">
                  Beat <span className="text-foreground font-semibold">{pendingChallenge.name}</span>'s score of <span className="text-game-gold font-score font-bold">{pendingChallenge.score}</span>
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-game-gold/60 flex-shrink-0" />
            </div>
          </button>
        </div>
      )}

      {/* Tier Selector */}
      <div className="w-full max-w-sm mb-3">
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest text-center mb-2">Select Difficulty</p>
        <div className="flex gap-1.5 justify-center flex-wrap">
          {(Object.keys(TIER_CONFIG) as DifficultyTier[]).map((t) => {
            const cfg = TIER_CONFIG[t];
            const unlocked = unlockedTiers.includes(t);
            const isSelected = tier === t;
            const tierHS = highScores[t] || 0;
            return (
              <button
                key={t}
                onClick={() => unlocked && setTier(t)}
                disabled={!unlocked}
                title={unlocked ? `${cfg.label}` : `Unlock at ${cfg.xpRequired} XP`}
                className={`relative flex flex-col items-center px-3 py-2 rounded-xl border transition-all press-scale ${
                  !unlocked
                    ? 'border-border/20 bg-card/20 opacity-40 cursor-not-allowed'
                    : isSelected
                    ? 'border-2 bg-card/80 shadow-lg'
                    : 'border-border/30 bg-card/40 hover:bg-card/60'
                }`}
                style={isSelected && unlocked ? {
                  borderColor: `hsl(${cfg.color})`,
                  boxShadow: `0 0 12px hsl(${cfg.color} / 0.3)`,
                } : {}}
              >
                {!unlocked && <Lock className="w-2.5 h-2.5 absolute top-1 right-1 text-muted-foreground/50" />}
                <span
                  className="font-display text-[11px] tracking-wider"
                  style={{ color: unlocked ? `hsl(${cfg.color})` : undefined }}
                >
                  {cfg.label}
                </span>
                <span className="text-[8px] text-muted-foreground font-score">{cfg.timerSeconds}s</span>
                {tierHS > 0 && (
                  <span className="text-[7px] text-game-gold font-score">🏆{tierHS}</span>
                )}
                {!unlocked && (
                  <span className="text-[7px] text-muted-foreground/60">{cfg.xpRequired}xp</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* PLAY Button with shimmer */}
      <div className="relative w-full max-w-sm mb-1.5">
        <button
          onClick={() => startGame(tier)}
          className="relative w-full py-4 rounded-2xl gradient-hero text-white font-display text-2xl tracking-widest press-scale transition-all active:scale-[0.97] overflow-hidden"
          style={{ boxShadow: '0 6px 30px rgba(59, 130, 246, 0.45), 0 2px 8px rgba(59, 130, 246, 0.2)' }}
        >
          <span className="relative z-10 drop-shadow-sm">PLAY {TIER_CONFIG[tier].label.toUpperCase()}</span>
          <div className="absolute inset-0 animate-shimmer rounded-2xl" />
          {/* inner top highlight */}
          <div className="absolute inset-x-0 top-0 h-px bg-white/30 rounded-t-2xl" />
        </button>
      </div>
      {endlessHS > 0 && (
        <p className="text-xs text-game-gold mb-4 font-score">🏆 Best ({TIER_CONFIG[tier].label}): {endlessHS}</p>
      )}
      {!endlessHS && <div className="mb-4" />}

      {/* Game Modes */}
      <div className="w-full max-w-sm mb-5 flex flex-col gap-2.5">
        {/* Daily Challenge Card */}
        <button
          onClick={() => !dailyCompleted && startDailyChallenge()}
          disabled={dailyCompleted}
          className="w-full rounded-2xl overflow-hidden border border-primary/25 relative transition-all press-scale active:scale-[0.97]"
          style={{ background: 'linear-gradient(135deg, hsl(217 91% 60% / 0.12) 0%, hsl(217 91% 60% / 0.04) 100%)' }}
        >
          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-primary/80 via-primary/40 to-transparent" />
          {!dailyCompleted && <div className="absolute top-0 left-0 right-0 h-[1.5px] animate-daily-glow" style={{ background: 'linear-gradient(90deg, hsl(var(--primary)), transparent)' }} />}
          <div className="flex items-center gap-3.5 p-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${dailyCompleted ? 'bg-game-correct/15' : 'bg-primary/15'}`}>
              <Calendar className={`w-5 h-5 ${dailyCompleted ? 'text-game-correct' : 'text-primary'}`} />
            </div>
            <div className="text-left flex-1 min-w-0">
              <span className="font-display text-base tracking-wider block text-foreground">DAILY CHALLENGE</span>
              {dailyCompleted ? (
                <span className="text-[11px] text-game-correct flex items-center gap-1">
                  <Check className="w-3 h-3" /> Score: {dailyResult?.score ?? 0}
                </span>
              ) : (
                <span className="text-[11px] text-muted-foreground">3 players · 1 attempt · resets daily</span>
              )}
            </div>
            {dailyCompleted ? (
              <div className="text-right flex-shrink-0">
                <span className="text-[10px] text-muted-foreground font-score block">{countdown.hours}h {String(countdown.minutes).padStart(2, '0')}m</span>
                <span className="text-[9px] text-muted-foreground/60">until reset</span>
              </div>
            ) : (
              <ChevronRight className="w-4 h-4 text-primary/60 flex-shrink-0" />
            )}
          </div>
          {!dailyCompleted && (
            <div className="px-4 pb-3 -mt-1">
              <p className="text-[10px] text-muted-foreground/70 italic">
                {(() => {
                  const teasers = [
                    "Today's disguise: 🤡 Think you can spot them?",
                    "One player is in a wig — can you ID them? 🎭",
                    "Clown nose or face paint? Today's a tricky one 🤔",
                    "They're hiding in plain sight... 👀",
                    "Even their teammates wouldn't recognize them 😂",
                    "Sunglasses + fake mustache = chaos 🕶️",
                    "Today's players went ALL out with costumes 🎪",
                  ];
                  const seed = new Date().toISOString().slice(0, 10).split('-').reduce((a, b) => a + parseInt(b), 0);
                  return teasers[seed % teasers.length];
                })()}
              </p>
            </div>
          )}
        </button>

        {/* Buzzer Beater Card */}
        <button
          onClick={startBuzzerBeater}
          className="w-full rounded-2xl overflow-hidden border border-accent/25 relative transition-all press-scale active:scale-[0.97]"
          style={{ background: 'linear-gradient(135deg, hsl(16 100% 58% / 0.12) 0%, hsl(16 100% 58% / 0.04) 100%)' }}
        >
          <div className="absolute top-0 left-0 right-0 h-[1.5px] animate-buzzer-glow" style={{ background: 'linear-gradient(90deg, hsl(var(--accent)), transparent)' }} />
          <div className="flex items-center gap-3.5 p-4">
            <div className="w-11 h-11 rounded-xl bg-accent/15 flex items-center justify-center flex-shrink-0">
              <Timer className="w-5 h-5 text-accent" />
            </div>
            <div className="text-left flex-1">
              <span className="font-display text-base tracking-wider block text-foreground">BUZZER BEATER</span>
              <span className="text-[11px] text-muted-foreground">60s survival · correct +3s · wrong −5s</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {buzzerHS > 0 && (
                <div className="text-right">
                  <span className="text-[9px] text-muted-foreground/60 block">best</span>
                  <span className="text-[11px] text-game-gold font-score">🏆 {buzzerHS}</span>
                </div>
              )}
              <ChevronRight className="w-4 h-4 text-accent/60" />
            </div>
          </div>
        </button>

        {/* Mystery Mode Card */}
        <button
          onClick={startMysteryMode}
          className="w-full rounded-2xl overflow-hidden relative transition-all press-scale active:scale-[0.97]"
          style={{
            background: 'linear-gradient(135deg, hsl(280 67% 52% / 0.12) 0%, hsl(280 67% 52% / 0.04) 100%)',
            borderColor: 'hsl(280 67% 52% / 0.25)',
            borderWidth: '1px',
            borderStyle: 'solid',
          }}
        >
          <div className="absolute top-0 left-0 right-0 h-[1.5px]" style={{ background: 'linear-gradient(90deg, hsl(280 67% 52% / 0.8), transparent)' }} />
          <div className="flex items-center gap-3.5 p-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-xl" style={{ background: 'hsl(280 67% 52% / 0.15)' }}>
              🔮
            </div>
            <div className="text-left flex-1">
              <span className="font-display text-base tracking-wider block text-foreground">MYSTERY MODE</span>
              <span className="text-[11px] text-muted-foreground">Clues only — no video · pure knowledge</span>
            </div>
            <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: 'hsl(280 67% 52% / 0.6)' }} />
          </div>
        </button>

        {/* Heat Check Card */}
        <button
          onClick={startHeatCheckMode}
          className="w-full rounded-2xl overflow-hidden relative transition-all press-scale active:scale-[0.97]"
          style={{
            background: 'linear-gradient(135deg, hsl(16 100% 58% / 0.15) 0%, hsl(0 100% 55% / 0.05) 100%)',
            borderColor: 'hsl(16 100% 58% / 0.3)',
            borderWidth: '1px',
            borderStyle: 'solid',
          }}
        >
          <div className="absolute top-0 left-0 right-0 h-[1.5px] animate-buzzer-glow" style={{ background: 'linear-gradient(90deg, hsl(16 100% 58% / 0.9), hsl(0 100% 55% / 0.3), transparent)' }} />
          <div className="flex items-center gap-3.5 p-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-xl" style={{ background: 'hsl(16 100% 58% / 0.15)' }}>
              🔥
            </div>
            <div className="text-left flex-1">
              <div className="flex items-center gap-2">
                <span className="font-display text-base tracking-wider text-foreground">HEAT CHECK</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'hsl(16 100% 58% / 0.2)', color: 'hsl(16 100% 58%)' }}>NEW</span>
              </div>
              <span className="text-[11px] text-muted-foreground">Get hot · difficulty climbs · 5 heat levels</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {(highScores['heatcheck'] ?? 0) > 0 && (
                <div className="text-right">
                  <span className="text-[9px] text-muted-foreground/60 block">best</span>
                  <span className="text-[11px] text-game-gold font-score">🏆 {highScores['heatcheck']}</span>
                </div>
              )}
              <ChevronRight className="w-4 h-4" style={{ color: 'hsl(16 100% 58% / 0.6)' }} />
            </div>
          </div>
          {/* Heat level ladder preview */}
          <div className="px-4 pb-3 -mt-1 flex items-center gap-1">
            {['🥶', '🔥', '🔥🔥', '🔥🔥🔥', '👑'].map((emoji, i) => (
              <span key={i} className="text-[10px] opacity-70">{emoji}</span>
            ))}
            <span className="text-[9px] text-muted-foreground/60 ml-1">Cold → Unstoppable</span>
          </div>
        </button>
      </div>

      {/* Daily Quests */}
      <DailyQuestsWidget />

      {/* Install banner — in flow, not fixed */}
      <div className="w-full max-w-sm mb-20">
        <InstallBanner />
      </div>
    </div>
    </>
  );
}
