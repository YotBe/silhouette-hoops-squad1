import { useState, useEffect, useRef } from 'react';
import { Home, Grid3X3, Trophy, BarChart3, Medal } from 'lucide-react';

export type TabType = 'home' | 'gallery' | 'achievements' | 'records' | 'leaderboard';

interface Props {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const tabs: { id: TabType; icon: typeof Home; label: string }[] = [
  { id: 'home', icon: Home, label: 'Play' },
  { id: 'gallery', icon: Grid3X3, label: 'Gallery' },
  { id: 'achievements', icon: Trophy, label: 'Badges' },
  { id: 'records', icon: BarChart3, label: 'Stats' },
  { id: 'leaderboard', icon: Medal, label: 'Ranks' },
];

export function BottomNav({ activeTab, onTabChange }: Props) {
  const [bouncing, setBouncing] = useState<TabType | null>(null);
  const activeIndex = tabs.findIndex(t => t.id === activeTab);
  const pillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setBouncing(activeTab);
    const t = setTimeout(() => setBouncing(null), 400);
    return () => clearTimeout(t);
  }, [activeTab]);

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50">
      <div className="glass-strong rounded-3xl border border-[rgba(255,255,255,0.08)] px-2 py-2 flex items-center justify-around relative">
        {/* Sliding pill */}
        <div
          ref={pillRef}
          className="absolute top-1/2 -translate-y-1/2 h-10 rounded-2xl bg-primary/15 border border-primary/20 pointer-events-none"
          style={{
            width: `calc(20% - 4px)`,
            left: `calc(${activeIndex * 20}% + 2px)`,
            transition: 'left 300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
            animation: 'pill-enter 300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        />
        {tabs.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className="flex flex-col items-center gap-0.5 py-2 px-1 rounded-2xl press-scale transition-colors relative z-10"
            style={{ width: '20%' }}
          >
            <Icon
              className={`w-5 h-5 transition-colors ${
                activeTab === id ? 'text-primary' : 'text-muted-foreground'
              } ${bouncing === id ? 'animate-tab-bounce' : ''}`}
            />
            <span className={`text-[9px] font-semibold tracking-wide transition-colors ${
              activeTab === id ? 'text-primary' : 'text-muted-foreground/60'
            }`}>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
