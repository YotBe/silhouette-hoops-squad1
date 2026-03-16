import { useState } from 'react';
import { DailyReward, claimDailyReward, getRewards } from '@/utils/dailyRewards';
import { Gift, Check } from 'lucide-react';
import { hapticSuccess } from '@/utils/haptics';

interface Props {
  reward: DailyReward;
  onClose: () => void;
}

export function DailyRewardModal({ reward, onClose }: Props) {
  const [claimed, setClaimed] = useState(false);
  const allRewards = getRewards();
  const completedDay = reward.day - 1; // days already done before this one

  const handleClaim = () => {
    claimDailyReward(reward.day);
    hapticSuccess();
    setClaimed(true);
    setTimeout(onClose, 1200);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-6" style={{ background: 'rgba(5, 8, 18, 0.9)' }}>
      <div className="w-full max-w-sm glass-strong rounded-3xl border border-[rgba(255,255,255,0.08)] p-6 animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <Gift className="w-6 h-6 text-primary" />
          <h2 className="font-display text-2xl tracking-wider text-foreground">DAILY BONUS</h2>
        </div>

        {/* 7-day progress */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {allRewards.map((r, i) => {
            const dayNum = i + 1;
            const isDone = dayNum < reward.day;
            const isCurrent = dayNum === reward.day;
            const isFuture = dayNum > reward.day;

            return (
              <div key={dayNum} className="flex flex-col items-center gap-1">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm border-2 transition-all relative ${
                    isDone
                      ? 'bg-primary/30 border-primary text-primary'
                      : isCurrent
                        ? `border-primary bg-primary/20 text-primary ${claimed ? '' : 'animate-reward-glow'}`
                        : 'border-muted bg-muted/30 text-muted-foreground'
                  }`}
                >
                  {isDone ? <Check className="w-4 h-4" /> : <span>{r.icon}</span>}
                </div>
                <span className={`text-[8px] font-bold ${isCurrent ? 'text-primary' : 'text-muted-foreground'}`}>
                  D{dayNum}
                </span>
              </div>
            );
          })}
        </div>

        {/* Current reward */}
        <div className="text-center mb-6">
          <span className="text-4xl mb-2 block">{reward.icon}</span>
          <p className="font-display text-lg tracking-wider text-foreground">{reward.label}</p>
          <p className="text-xs text-muted-foreground mt-1">Day {reward.day} of 7</p>
        </div>

        {/* Claim button */}
        <button
          onClick={handleClaim}
          disabled={claimed}
          className={`relative z-10 w-full py-3.5 rounded-2xl font-display text-xl tracking-widest press-scale transition-all ${
            claimed
              ? 'bg-game-correct/20 text-game-correct border border-game-correct/30'
              : 'gradient-hero text-white'
          }`}
          style={!claimed ? { boxShadow: '0 4px 25px rgba(59, 130, 246, 0.4)' } : undefined}
        >
          {claimed ? '✓ CLAIMED!' : 'CLAIM'}
        </button>
      </div>
    </div>
  );
}
