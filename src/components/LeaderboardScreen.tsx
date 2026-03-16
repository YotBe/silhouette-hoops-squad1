import { useState, useEffect } from 'react';
import { DifficultyTier, TIER_CONFIG } from '@/data/players';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Trophy, Globe, Clock, Loader2 } from 'lucide-react';
import { getGlobalLeaderboard } from '@/utils/globalLeaderboard';
import { getCurrentSeasonId, getSeasonLabel, formatSeasonCountdown, getSeasonResetMs } from '@/utils/seasons';

interface ScoreEntry {
  score: number;
  tier: string;
  date: string;
  streak: number;
}

interface GlobalEntry {
  player_name: string;
  score: number;
  streak: number;
  accuracy: number;
}

interface Props {
  history: ScoreEntry[];
  highScores: Record<string, number>;
  onBack: () => void;
}

const RANK_ICONS = ['🥇', '🥈', '🥉'];

type TabKey = DifficultyTier | 'buzzer' | 'daily' | 'heatcheck';

const EXTRA_TABS: { key: TabKey; label: string; color: string }[] = [
  { key: 'heatcheck', label: 'Heat', color: '16 100% 58%' },
  { key: 'buzzer', label: 'Buzzer', color: '0 72% 51%' },
  { key: 'daily', label: 'Daily', color: '24 100% 50%' },
];

export function LeaderboardScreen({ history, highScores, onBack }: Props) {
  const tiers = Object.entries(TIER_CONFIG) as [DifficultyTier, typeof TIER_CONFIG[DifficultyTier]][];
  const [selectedTab, setSelectedTab] = useState<TabKey>('rookie');
  const [globalEntries, setGlobalEntries] = useState<GlobalEntry[]>([]);
  const [loadingGlobal, setLoadingGlobal] = useState(false);
  const [countdown, setCountdown] = useState(formatSeasonCountdown(getSeasonResetMs()));
  const seasonId = getCurrentSeasonId();
  const seasonLabel = getSeasonLabel(seasonId);

  const allTabs: { key: TabKey; label: string; color: string }[] = [
    ...tiers.map(([key, cfg]) => ({ key: key as TabKey, label: cfg.label, color: cfg.color })),
    ...EXTRA_TABS,
  ];

  const currentTab = allTabs.find(t => t.key === selectedTab)!;

  const tabEntries = history
    .filter(e => e.tier === selectedTab)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  useEffect(() => {
    setLoadingGlobal(true);
    setGlobalEntries([]);
    getGlobalLeaderboard(selectedTab, seasonId)
      .then(setGlobalEntries)
      .finally(() => setLoadingGlobal(false));
  }, [selectedTab]);

  useEffect(() => {
    const id = setInterval(() => setCountdown(formatSeasonCountdown(getSeasonResetMs())), 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col h-screen-safe px-4 pt-3 pb-4 animate-slide-up">
      <Button variant="ghost" onClick={onBack} className="self-start mb-3 press-scale -ml-2">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back
      </Button>

      <div className="flex flex-col items-center mb-2">
        <Trophy className="w-8 h-8 text-game-gold mb-1" />
        <h2 className="text-3xl font-display tracking-wider">HALL OF FAME</h2>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-[10px] text-muted-foreground font-display tracking-widest">{seasonLabel}</span>
          <span className="text-[10px] text-muted-foreground/50">·</span>
          <Clock className="w-3 h-3 text-muted-foreground/60" />
          <span className="text-[10px] text-muted-foreground/60">resets in {countdown}</span>
        </div>
      </div>

      {/* Tier tabs */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide -mx-4 px-4 mb-4">
        {allTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSelectedTab(tab.key)}
            className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all press-scale border ${
              selectedTab === tab.key
                ? 'border-primary/50 scale-105'
                : 'border-border bg-card hover:border-muted-foreground'
            }`}
            style={selectedTab === tab.key ? {
              color: `hsl(${tab.color})`,
              backgroundColor: `hsl(${tab.color} / 0.15)`,
              boxShadow: `0 0 12px hsl(${tab.color} / 0.2)`,
            } : { color: `hsl(${tab.color} / 0.6)` }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto -mx-4 px-4 space-y-5">
        {/* High score badge */}
        {highScores[selectedTab] ? (
          <div className="w-full max-w-md mx-auto flex items-center justify-between p-3 rounded-xl bg-game-gold/10 border border-game-gold/20">
            <span className="text-xs font-semibold text-game-gold">🏆 Personal Best</span>
            <span className="font-display text-2xl text-game-gold">{highScores[selectedTab]}</span>
          </div>
        ) : null}

        {/* Global leaderboard */}
        <div className="w-full max-w-md mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Global · {seasonLabel}</span>
            {loadingGlobal && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
          </div>
          {!loadingGlobal && globalEntries.length === 0 ? (
            <p className="text-muted-foreground text-center py-4 text-sm">No global scores yet — be the first!</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="w-12 text-center text-[10px]">RANK</TableHead>
                  <TableHead className="text-[10px]">PLAYER</TableHead>
                  <TableHead className="text-[10px]">SCORE</TableHead>
                  <TableHead className="text-[10px] text-right">STREAK</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {globalEntries.map((entry, i) => (
                  <TableRow key={i} className="border-border">
                    <TableCell className="text-center font-display text-lg">
                      {i < 3 ? RANK_ICONS[i] : <span className="text-muted-foreground text-sm">{i + 1}</span>}
                    </TableCell>
                    <TableCell className="text-sm font-semibold truncate max-w-[100px]">
                      {entry.player_name}
                    </TableCell>
                    <TableCell className="font-display text-xl" style={{ color: i === 0 ? `hsl(${currentTab.color})` : undefined }}>
                      {entry.score}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-xs">🔥 {entry.streak}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Local top 10 */}
        <div className="w-full max-w-md mx-auto pb-4">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Your Sessions</p>
          {tabEntries.length === 0 ? (
            <p className="text-muted-foreground text-center py-4 text-sm">No games played in {currentTab.label} yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="w-12 text-center text-[10px]">RANK</TableHead>
                  <TableHead className="text-[10px]">SCORE</TableHead>
                  <TableHead className="text-[10px] text-center">STREAK</TableHead>
                  <TableHead className="text-[10px] text-right">DATE</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tabEntries.map((entry, i) => (
                  <TableRow key={i} className="border-border">
                    <TableCell className="text-center font-display text-lg">
                      {i < 3 ? RANK_ICONS[i] : <span className="text-muted-foreground text-sm">{i + 1}</span>}
                    </TableCell>
                    <TableCell className="font-display text-xl" style={{ color: i === 0 ? `hsl(${currentTab.color})` : undefined }}>
                      {entry.score}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-xs">🔥 {entry.streak}</span>
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {new Date(entry.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
}
