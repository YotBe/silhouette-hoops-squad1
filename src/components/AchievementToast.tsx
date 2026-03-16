import { useEffect, useState } from 'react';
import { Achievement } from '@/utils/achievements';
import { fireConfetti } from '@/utils/confetti';

interface Props {
  achievements: Achievement[];
  onDone: () => void;
}

export function AchievementToast({ achievements, onDone }: Props) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (achievements.length === 0) { onDone(); return; }
    // Fire confetti on first achievement
    if (current === 0) {
      fireConfetti();
    }
    const timer = setTimeout(() => {
      if (current + 1 >= achievements.length) {
        onDone();
      } else {
        setCurrent(c => c + 1);
      }
    }, 2500);
    return () => clearTimeout(timer);
  }, [current, achievements.length, onDone]);

  if (achievements.length === 0 || current >= achievements.length) return null;

  const a = achievements[current];

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] animate-slide-up">
      <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-card border-2 border-primary/40 shadow-[0_0_30px_hsl(var(--primary)/0.3)]">
        <span className="text-3xl">{a.icon}</span>
        <div>
          <p className="text-xs text-primary font-bold uppercase tracking-wider">Achievement Unlocked!</p>
          <p className="text-sm font-display text-foreground tracking-wider">{a.title}</p>
          <p className="text-[10px] text-muted-foreground">{a.description}</p>
        </div>
      </div>
    </div>
  );
}
