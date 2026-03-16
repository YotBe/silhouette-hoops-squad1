import { useState, useEffect } from 'react';
import { DifficultyTier, TIER_CONFIG } from '@/data/players';
import { Volume2, VolumeX, Calendar, Check, Smartphone, Timer, Flame, ChevronRight, Bell, Lock } from 'lucide-react';
import { InstallBanner } from '@/components/InstallBanner';
import { isDailyChallengeCompleted, getDailyResult, getTimeUntilNextChallenge } from '@/utils/dailyChallenge';
import { isHapticsEnabled, setHapticsEnabled, isWelcomeHapticsEnabled, setWelcomeHapticsEnabled } from '@/utils/haptics';
import { checkAndUpdateStreak, getStreakInfo, claimStreakReward, type StreakInfo, type StreakReward } from '@/utils/dailyStreak';
import { trackEvent } from '@/utils/analytics';
import { checkDailyReward, type DailyReward } from '@/utils/dailyRewards';
import { DailyRewardModal } from '@/components/DailyRewardModal';

interface Props {
  tier: DifficultyTier;
  setTier: (t: DifficultyTier) => void;
  startGame: (t: DifficultyTier) => void;
  startDailyChallenge: () => void;
  startBuzzerBeater: () => void;
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

export function HomeScreen({ tier, setTier, startGame, startDailyChallenge, startBuzzerBeater, highScores, xp, unlockedTiers, isMuted, onToggleMute }: Props) {
  const [hapticsOn, setHapticsOn] = useState(isHapticsEnabled);
  const [welcomeHapticsOn, setWelcomeHapticsOn] = useState(isWelcomeHapticsEnabled);
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

  useEffect(() => {
    const interval = setInterval(() => setCountdown(getTimeUntilNextChallenge()), 100);
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

  return (
    <>
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

      {/* XP progress bar */}
      {(() => {
        const tiers = Object.keys(TIER_CONFIG) as DifficultyTier[];
        const nextTier = tiers.find(t => xp < TIER_CONFIG[t].xpRequired);
        const currentTierConfig = TIER_CONFIG[tiers.filter(t => xp >= TIER_CONFIG[t].xpRequired).pop()!];
        const nextTierConfig = nextTier ? TIER_CONFIG[nextTier] : null;
        const fromXP = nextTier ? tiers.filter(t => TIER_CONFIG[t].xpRequired < TIER_CONFIG[nextTier].xpRequired).pop() : null;
        const fromXPVal = fromXP ? TIER_CONFIG[fromXP].xpRequired : 0;
        const pct = nextTierConfig
          ? Math.min(((xp - fromXPVal) / (nextTierConfig.xpRequired - fromXPVal)) * 100, 100)
          : 100;
        return (
          <div className="w-full max-w-sm mb-5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-score text-muted-foreground">⭐ {xp} XP</span>
              {nextTierConfig ? (
                <span className="text-[10px] text-muted-foreground" style={{ color: `hsl(${nextTierConfig.color})` }}>
                  {nextTier} unlocks at {nextTierConfig.xpRequired} XP
                </span>
              ) : (
                <span className="text-[10px] text-game-gold">MAX TIER UNLOCKED</span>
              )}
            </div>
            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${pct}%`,
                  background: nextTierConfig
                    ? `hsl(${nextTierConfig.color})`
                    : 'hsl(var(--game-gold))',
                }}
              />
            </div>
          </div>
        );
      })()}

      {/* Streak reward */}
      {streakReward && (
        <div className="w-full max-w-sm mb-4 flex items-center justify-center gap-2 py-2 rounded-xl glass border border-accent/20 animate-scale-in">
          <span className="text-sm">🎁</span>
          <span className="text-xs font-display text-accent tracking-wider">{streakReward.label} unlocked!</span>
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
      <div className="relative w-full max-w-sm mb-2">
        <button
          onClick={() => startGame(tier)}
          className="relative w-full py-4 rounded-2xl gradient-hero text-white font-display text-2xl tracking-widest press-scale transition-all active:scale-[0.97] overflow-hidden"
          style={{ boxShadow: '0 4px 25px rgba(59, 130, 246, 0.4)' }}
        >
          <span className="relative z-10">PLAY {TIER_CONFIG[tier].label.toUpperCase()}</span>
          <div className="absolute inset-0 animate-shimmer rounded-2xl" />
        </button>
      </div>
      {endlessHS > 0 && (
        <p className="text-xs text-game-gold mb-4 font-score">🏆 Best ({TIER_CONFIG[tier].label}): {endlessHS}</p>
      )}
      {!endlessHS && <div className="mb-4" />}

      {/* Daily Challenge Card */}
      <button
        onClick={() => !dailyCompleted && startDailyChallenge()}
        disabled={dailyCompleted}
        className="w-full max-w-sm mb-1 p-4 rounded-2xl glass border border-[rgba(255,255,255,0.08)] transition-all press-scale active:scale-[0.97] relative overflow-hidden"
      >
        <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl bg-primary" />
        {!dailyCompleted && <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl bg-primary animate-daily-glow" />}
        <div className="flex items-center gap-3 pl-3">
          <Calendar className={`w-5 h-5 flex-shrink-0 ${dailyCompleted ? 'text-game-correct' : 'text-primary'}`} />
          <div className="text-left flex-1">
            <span className="font-display text-sm tracking-wider block text-foreground">📅 DAILY CHALLENGE</span>
            {dailyCompleted ? (
              <span className="text-[11px] text-game-correct flex items-center gap-1">
                <Check className="w-3 h-3" /> Score: {dailyResult?.score ?? 0}
              </span>
            ) : (
              <span className="text-[11px] text-muted-foreground">3 players · 1 attempt</span>
            )}
          </div>
          {dailyCompleted ? (
            <span className="text-[10px] text-muted-foreground font-score">
              {countdown.hours}h {String(countdown.minutes).padStart(2, '0')}m
            </span>
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </button>
      {/* Daily teaser */}
      {!dailyCompleted && (
        <p className="text-[10px] text-muted-foreground italic mb-3 max-w-sm text-center">
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
      )}
      {dailyCompleted && <div className="mb-3" />}

      {/* Buzzer Beater Card */}
      <button
        onClick={startBuzzerBeater}
        className="w-full max-w-sm mb-4 p-4 rounded-2xl glass border border-[rgba(255,255,255,0.08)] transition-all press-scale active:scale-[0.97] relative overflow-hidden"
      >
        <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl bg-accent animate-buzzer-glow" />
        <div className="flex items-center gap-3 pl-3">
          <Timer className="w-5 h-5 text-accent flex-shrink-0" />
          <div className="text-left flex-1">
            <span className="font-display text-sm tracking-wider block text-foreground">🚨 BUZZER BEATER</span>
            <span className="text-[11px] text-muted-foreground">60s survival · +3s/-5s</span>
          </div>
          <div className="flex items-center gap-2">
            {buzzerHS > 0 && (
              <span className="text-[10px] text-game-gold font-score">🏆 {buzzerHS}</span>
            )}
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      </button>

      {/* Install banner — in flow, not fixed */}
      <div className="w-full max-w-sm mb-20">
        <InstallBanner />
      </div>
    </div>
    </>
  );
}
