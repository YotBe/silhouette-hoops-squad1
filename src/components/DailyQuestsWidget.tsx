import { useMemo } from 'react';
import { getTodayQuests, getQuestProgress } from '@/utils/dailyQuests';

export function DailyQuestsWidget() {
  const { quests, progress, completed } = useMemo(() => getQuestProgress(), []);

  return (
    <div className="w-full max-w-sm mb-4">
      <p className="text-[10px] text-muted-foreground uppercase tracking-widest text-center mb-2">Daily Quests</p>
      <div className="flex flex-col gap-2">
        {quests.map(quest => {
          const isDone = completed.includes(quest.id);
          const prog = progress[quest.id] || 0;
          const pct = Math.min((prog / quest.target) * 100, 100);
          return (
            <div
              key={quest.id}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl glass border transition-all ${
                isDone ? 'border-game-correct/30 opacity-80' : 'border-[rgba(255,255,255,0.08)]'
              }`}
            >
              <span className="text-lg flex-shrink-0">{quest.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-bold ${isDone ? 'text-game-correct' : 'text-foreground'}`}>
                    {quest.title}
                  </span>
                  <span className="text-[10px] text-game-gold font-score ml-2">+{quest.xpReward}xp</span>
                </div>
                <div className="w-full h-1 bg-secondary rounded-full overflow-hidden mt-1">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      background: isDone
                        ? 'hsl(var(--game-correct))'
                        : 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))',
                    }}
                  />
                </div>
                <span className="text-[9px] text-muted-foreground">
                  {isDone ? 'Completed!' : `${prog}/${quest.target} — ${quest.description}`}
                </span>
              </div>
              {isDone && <span className="text-game-correct text-sm flex-shrink-0">✓</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
