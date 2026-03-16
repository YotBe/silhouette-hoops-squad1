import { type PartyPlayer } from '@/utils/party';

interface Props {
  players: PartyPlayer[];
  myPid: string;
}

export function PartyScoreTicker({ players, myPid }: Props) {
  const sorted = [...players].sort((a, b) => b.score - a.score);

  return (
    <div
      className="fixed top-4 right-4 z-50 animate-fade-in"
      style={{
        background: 'rgba(0, 0, 0, 0.55)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '12px',
        padding: '8px 10px',
        minWidth: '120px',
        maxWidth: '160px',
      }}
    >
      <p className="text-[8px] uppercase tracking-widest text-white/40 mb-1.5 font-bold">PARTY</p>
      {sorted.slice(0, 8).map((p, i) => {
        const isMe = p.pid === myPid;
        return (
          <div
            key={p.pid}
            className="flex items-center justify-between gap-2"
            style={{ height: '22px' }}
          >
            <div className="flex items-center gap-1 min-w-0">
              <span className="text-[9px] text-white/30 w-3 flex-shrink-0">{i + 1}</span>
              <span
                className="text-[11px] font-semibold truncate"
                style={{
                  color: isMe ? 'hsl(210 100% 65%)' : 'rgba(255,255,255,0.75)',
                  maxWidth: '72px',
                }}
              >
                {p.name.slice(0, 8)}
              </span>
            </div>
            <span
              className="text-[11px] font-score font-bold flex-shrink-0"
              style={{ color: isMe ? 'hsl(210 100% 65%)' : 'rgba(255,255,255,0.6)' }}
            >
              {p.score}
            </span>
          </div>
        );
      })}
    </div>
  );
}
