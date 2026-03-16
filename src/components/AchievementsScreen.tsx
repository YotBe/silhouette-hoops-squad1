import { ACHIEVEMENTS, getUnlockedAchievements, getAchievementStats } from '@/utils/achievements';
import { Lock } from 'lucide-react';

export function AchievementsScreen() {
  const unlocked = new Set(getUnlockedAchievements());
  const stats = getAchievementStats();
  const unlockedCount = unlocked.size;

  return (
    <div className="flex flex-col min-h-screen-safe bg-background px-4 pt-6 pb-24 animate-slide-up">
      <div className="mb-4">
        <h1 className="text-3xl font-display text-gradient-title tracking-wider">ACHIEVEMENTS</h1>
        <p className="text-xs text-muted-foreground">{unlockedCount}/{ACHIEVEMENTS.length} unlocked</p>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-4 gap-2 mb-6">
        {[
          { label: 'Correct', value: stats.totalCorrect },
          { label: 'Best Streak', value: stats.bestStreak },
          { label: 'Games', value: stats.totalGames },
          { label: 'Collection', value: stats.collectedPlayers },
        ].map(s => (
          <div key={s.label} className="flex flex-col items-center p-2 rounded-xl glass border border-[rgba(255,255,255,0.08)]">
            <span className="font-score text-lg text-primary">{s.value}</span>
            <span className="text-[9px] text-muted-foreground">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-secondary rounded-full mb-6 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 gradient-hero"
          style={{ width: `${(unlockedCount / ACHIEVEMENTS.length) * 100}%` }}
        />
      </div>

      <div className="flex flex-col gap-2 flex-1 overflow-y-auto pb-6">
        {ACHIEVEMENTS.map((a, i) => {
          const isUnlocked = unlocked.has(a.id);
          const pct = a.progress ? a.progress(stats) : 0;
          const hasProgress = !isUnlocked && pct > 0 && a.progress;
          return (
            <div
              key={a.id}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all animate-slide-up ${
                isUnlocked
                  ? 'border-primary/30 glass card-glow'
                  : 'border-[rgba(255,255,255,0.06)] glass opacity-50'
              }`}
              style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'both' }}
            >
              <span className={`text-2xl ${isUnlocked ? '' : 'grayscale opacity-40'}`}>{a.icon}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold ${isUnlocked ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {a.title}
                </p>
                <p className="text-[10px] text-muted-foreground">{a.description}</p>
                {hasProgress && (
                  <div className="mt-1">
                    <div className="h-1 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct * 100}%`, background: 'hsl(var(--primary))' }}
                      />
                    </div>
                    <span className="text-[9px] text-muted-foreground">{a.progressLabel?.(stats)}</span>
                  </div>
                )}
              </div>
              {isUnlocked ? (
                <span className="text-game-correct text-xs font-bold">✓</span>
              ) : (
                <Lock className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
