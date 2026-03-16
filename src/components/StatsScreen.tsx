import { useMemo } from 'react';
import { useCountUp } from '@/hooks/useCountUp';
import { Progress } from '@/components/ui/progress';
import { Trophy, Target, Flame, Zap, TrendingUp } from 'lucide-react';
import { ERA_CONFIG, PlayerEra } from '@/data/players';

interface ScoreEntry {
  score: number;
  tier: string;
  date: string;
  streak: number;
  answerHistory?: Array<{ correct: boolean; hintsUsed: number }> | boolean[];
  playersGuessed?: string[];
}

interface GuessDistribution { [key: string]: number; }
interface EraStats { [era: string]: { correct: number; total: number }; }

interface Props {
  history: ScoreEntry[];
  highScores: Record<string, number>;
}

function getGuessDistribution(): GuessDistribution {
  try { return JSON.parse(localStorage.getItem('sg_guess_distribution') || '{}'); } catch { return {}; }
}
function getEraStats(): EraStats {
  try { return JSON.parse(localStorage.getItem('sg_era_stats') || '{}'); } catch { return {}; }
}
function getAchievementStats() {
  try { return JSON.parse(localStorage.getItem('sg_achievement_stats') || '{}'); } catch { return {}; }
}

export function StatsScreen({ history, highScores }: Props) {
  const stats = useMemo(() => getAchievementStats(), []);
  const guessDist = useMemo(() => getGuessDistribution(), []);
  const eraStats = useMemo(() => getEraStats(), []);

  const totalGames = stats.totalGames || 0;
  const totalCorrect = stats.totalCorrect || 0;
  const bestStreak = stats.bestStreak || 0;
  const totalAnswered = stats.totalAnswered || history.reduce((sum, e) => sum + (e.answerHistory?.length || 0), 0) || totalCorrect;

  const winRate = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
  const avgScore = totalGames > 0 ? Math.round(history.reduce((s, e) => s + e.score, 0) / Math.max(history.length, 1)) : 0;
  const highestScore = history.length > 0 ? Math.max(...history.map(e => e.score)) : 0;

  const distEntries = [
    { label: 'No hints', key: '0' },
    { label: '1 hint', key: '1' },
    { label: '2 hints', key: '2' },
    { label: '3 hints', key: '3' },
    { label: 'Timeout', key: 'timeout' },
  ];
  const totalDist = Object.values(guessDist).reduce((s, v) => s + (v || 0), 0) || 1;
  const maxDist = Math.max(1, ...distEntries.map(d => guessDist[d.key] || 0));

  const eras: { era: PlayerEra; label: string; emoji: string }[] = [
    { era: 'modern', ...ERA_CONFIG.modern },
    { era: 'classic', ...ERA_CONFIG.classic },
    { era: 'og', ...ERA_CONFIG.og },
  ];

  const recentGames = history.slice(0, 20);

  const animGames = useCountUp(totalGames);
  const animWinRate = useCountUp(winRate);
  const animAvgScore = useCountUp(avgScore);
  const animBestStreak = useCountUp(bestStreak);
  const animHighestScore = useCountUp(highestScore);

  const headerStats = [
    { label: 'Games', value: animGames, icon: Target },
    { label: 'Win Rate', value: `${animWinRate}%`, icon: TrendingUp },
    { label: 'Avg Score', value: animAvgScore, icon: Zap },
    { label: 'Best Streak', value: animBestStreak, icon: Flame },
  ];

  return (
    <div className="flex flex-col h-screen-safe bg-background animate-slide-up">
      <div className="flex-shrink-0 px-4 pt-6">
        <div className="flex flex-col items-center mb-4">
          <Trophy className="w-8 h-8 text-primary mb-1" />
          <h2 className="text-3xl font-display text-gradient-title tracking-wider">YOUR RECORDS</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-24 space-y-5 scrollbar-hide">
        <div className="grid grid-cols-4 gap-2">
          {headerStats.map((s) => (
            <div key={s.label} className="flex flex-col items-center p-2.5 rounded-xl glass border border-[rgba(255,255,255,0.08)]">
              <s.icon className="w-4 h-4 text-primary mb-1" />
              <span className="font-score text-xl text-foreground">{s.value}</span>
              <span className="text-[9px] text-muted-foreground uppercase tracking-wider">{s.label}</span>
            </div>
          ))}
        </div>

        <div className="rounded-xl glass border border-[rgba(255,255,255,0.08)] p-4">
          <h3 className="font-display text-lg text-foreground mb-3">GUESS DISTRIBUTION</h3>
          <div className="space-y-2">
            {distEntries.map((d) => {
              const count = guessDist[d.key] || 0;
              const pct = (count / maxDist) * 100;
              const pctOfTotal = Math.round((count / totalDist) * 100);
              return (
                <div key={d.key} className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground w-14 text-right flex-shrink-0">{d.label}</span>
                  <div className="flex-1 h-6 rounded bg-secondary relative overflow-hidden">
                    <div
                      className="h-full rounded transition-all duration-500"
                      style={{
                        width: `${Math.max(pct, count > 0 ? 8 : 0)}%`,
                        background: d.key === 'timeout'
                          ? 'hsl(var(--game-wrong))'
                          : 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--gradient-hero-to)))',
                      }}
                    />
                  </div>
                  <span className="text-xs font-score text-foreground w-16 text-right">{count} ({pctOfTotal}%)</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl glass border border-[rgba(255,255,255,0.08)] p-4">
          <h3 className="font-display text-lg text-foreground mb-3">ERA ACCURACY</h3>
          <div className="space-y-3">
            {eras.map(({ era, label, emoji }) => {
              const data = eraStats[era] || { correct: 0, total: 0 };
              const pct = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
              return (
                <div key={era}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-foreground">{emoji} {label}</span>
                    <span className="text-xs text-muted-foreground font-score">{pct}% ({data.correct}/{data.total})</span>
                  </div>
                  <Progress value={pct} className="h-2 bg-secondary" style={{ '--progress-color': 'hsl(var(--primary))' } as React.CSSProperties} />
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl glass border border-[rgba(255,255,255,0.08)] p-4">
          <h3 className="font-display text-lg text-foreground mb-3">PERSONAL BESTS</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col items-center p-3 rounded-lg bg-secondary">
              <span className="text-2xl mb-1">🏆</span>
              <span className="font-score text-2xl text-primary">{animHighestScore}</span>
              <span className="text-[9px] text-muted-foreground uppercase">Highest Score</span>
            </div>
            <div className="flex flex-col items-center p-3 rounded-lg bg-secondary">
              <span className="text-2xl mb-1">🔥</span>
              <span className="font-score text-2xl text-accent">{bestStreak}</span>
              <span className="text-[9px] text-muted-foreground uppercase">Longest Streak</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl glass border border-[rgba(255,255,255,0.08)] p-4">
          <h3 className="font-display text-lg text-foreground mb-3">RECENT GAMES</h3>
          {recentGames.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No games played yet</p>
          ) : (
            <div className="space-y-2">
              {recentGames.map((game, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-[rgba(255,255,255,0.06)] last:border-0">
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">
                      {new Date(game.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                    <span className="text-[9px] text-muted-foreground/60 uppercase">{game.tier}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {game.answerHistory?.slice(0, 10).map((entry, j) => {
                      const isObj = typeof entry === 'object' && entry !== null;
                      const wasCorrect = isObj ? (entry as { correct: boolean }).correct : entry;
                      const hadHints = isObj ? (entry as { hintsUsed: number }).hintsUsed > 0 : false;
                      return <span key={j} className="text-[10px]">{!wasCorrect ? '🔴' : hadHints ? '🟡' : '🟢'}</span>;
                    })}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">🔥{game.streak}</span>
                    <span className="font-score text-lg text-primary">{game.score}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
