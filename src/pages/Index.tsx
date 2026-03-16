import { useState, useRef, lazy, Suspense, useEffect } from 'react';
import { useGameState } from '@/hooks/useGameState';
import { useBackgroundMusic } from '@/hooks/useBackgroundMusic';
import { useDuelSync } from '@/hooks/useDuelSync';
import { usePartySync } from '@/hooks/usePartySync';
import { HomeScreen } from '@/components/HomeScreen';
import { GameScreen } from '@/components/GameScreen';
import { RevealScreen } from '@/components/RevealScreen';
import { GameOverScreen } from '@/components/GameOverScreen';
import { DuelLobbyScreen } from '@/components/DuelLobbyScreen';
import { PartyLobbyScreen } from '@/components/PartyLobbyScreen';
import { PartyScoreTicker } from '@/components/PartyScoreTicker';
import { AchievementToast } from '@/components/AchievementToast';
import { PageTransition } from '@/components/PageTransition';
import { BottomNav, TabType } from '@/components/BottomNav';
import { getChallengeFromURL, type ChallengeData } from '@/utils/challenge';
import { type DuelRoom } from '@/utils/duels';
import { type PartyRoom } from '@/utils/party';

const StatsScreen = lazy(() => import('@/components/StatsScreen').then(m => ({ default: m.StatsScreen })));
const GalleryScreen = lazy(() => import('@/components/GalleryScreen').then(m => ({ default: m.GalleryScreen })));
const AchievementsScreen = lazy(() => import('@/components/AchievementsScreen').then(m => ({ default: m.AchievementsScreen })));
const LeaderboardScreen = lazy(() => import('@/components/LeaderboardScreen').then(m => ({ default: m.LeaderboardScreen })));

const TAB_ORDER: TabType[] = ['home', 'gallery', 'achievements', 'records', 'leaderboard'];

const Index = () => {
  const game = useGameState();
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const prevTabRef = useRef<TabType>('home');
  const [pendingChallenge, setPendingChallenge] = useState<ChallengeData | null>(null);
  const [showDuelLobby, setShowDuelLobby] = useState(false);
  const [showPartyLobby, setShowPartyLobby] = useState(false);
  const [partyRoom, setPartyRoom] = useState<PartyRoom | null>(null);
  const [partyPid, setPartyPid] = useState('');

  useBackgroundMusic(game.isMuted);

  const duelSync = useDuelSync({
    enabled: game.isDuelMode,
    roomId: game.duelRoomId,
    role: game.duelRole,
    myRound: game.totalAnswered,
    myScore: game.score,
    myDone: game.phase === 'gameover',
    totalRounds: game.dailyPlayers.length,
  });

  const isInGame = game.phase === 'playing' || game.phase === 'reveal' || game.phase === 'gameover';
  const isPartyMode = !!partyRoom;

  const partySync = usePartySync({
    enabled: isPartyMode && isInGame,
    room: partyRoom,
    pid: partyPid,
    myScore: game.score,
    myRound: game.totalAnswered,
    myDone: game.phase === 'gameover',
  });

  // Parse challenge from URL on mount
  useEffect(() => {
    const challenge = getChallengeFromURL();
    if (challenge) {
      setPendingChallenge(challenge);
      // Clean URL so refresh doesn't re-trigger
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Clear party state when game ends and user goes home
  useEffect(() => {
    if (game.phase === 'home') {
      setPartyRoom(null);
      setPartyPid('');
    }
  }, [game.phase]);

  const handleTabChange = (tab: TabType) => {
    prevTabRef.current = activeTab;
    setActiveTab(tab);
  };

  const getTabDirection = (tab: TabType): 'left' | 'right' | undefined => {
    const prev = TAB_ORDER.indexOf(prevTabRef.current);
    const next = TAB_ORDER.indexOf(tab);
    if (prev === -1 || next === -1) return undefined;
    return next > prev ? 'right' : 'left';
  };

  const handleDuelStart = (room: DuelRoom, role: 'host' | 'guest') => {
    setShowDuelLobby(false);
    game.startDuelGame(room, role);
  };

  const handlePartyStart = (room: PartyRoom, pid: string) => {
    setShowPartyLobby(false);
    setPartyRoom(room);
    setPartyPid(pid);
    // Start the game using the duel engine: reuse startDuelGame with party player IDs
    game.startDuelGame(
      room.id,
      room.player_ids,
      'host',  // party mode: everyone is essentially "host" of their own game
      'Party'
    );
  };

  const renderTabContent = () => {
    const direction = getTabDirection(activeTab);
    switch (activeTab) {
      case 'gallery':
        return (
          <PageTransition transitionKey="gallery" direction={direction}>
            <Suspense fallback={<div className="flex-1 flex items-center justify-center min-h-screen-safe"><span className="text-3xl animate-spin-basketball">🏀</span></div>}>
              <GalleryScreen />
            </Suspense>
          </PageTransition>
        );
      case 'achievements':
        return (
          <PageTransition transitionKey="achievements" direction={direction}>
            <Suspense fallback={<div className="flex-1 flex items-center justify-center min-h-screen-safe"><span className="text-3xl animate-spin-basketball">🏀</span></div>}>
              <AchievementsScreen />
            </Suspense>
          </PageTransition>
        );
      case 'records':
        return (
          <PageTransition transitionKey="stats" direction={direction}>
            <Suspense fallback={<div className="flex-1 flex items-center justify-center min-h-screen-safe"><span className="text-3xl animate-spin-basketball">🏀</span></div>}>
              <StatsScreen
                history={game.scoreHistory}
                highScores={game.highScores}
              />
            </Suspense>
          </PageTransition>
        );
      case 'leaderboard':
        return (
          <PageTransition transitionKey="leaderboard" direction={direction}>
            <Suspense fallback={<div className="flex-1 flex items-center justify-center min-h-screen-safe"><span className="text-3xl animate-spin-basketball">🏀</span></div>}>
              <LeaderboardScreen
                history={game.scoreHistory}
                highScores={game.highScores}
                onBack={() => handleTabChange('home')}
              />
            </Suspense>
          </PageTransition>
        );
      case 'home':
      default:
        return (
          <PageTransition transitionKey="home" direction={direction}>
            <HomeScreen
              tier={game.tier}
              setTier={game.setTier}
              startGame={game.startGame}
              startDailyChallenge={game.startDailyChallenge}
              startBuzzerBeater={game.startBuzzerBeater}
              startMysteryMode={game.startMysteryMode}
              startHeatCheckMode={game.startHeatCheckMode}
              startDuelMode={() => setShowDuelLobby(true)}
              startPartyMode={() => setShowPartyLobby(true)}
              startChallengeGame={(c) => { game.startChallengeGame(c); setPendingChallenge(null); }}
              pendingChallenge={pendingChallenge}
              highScores={game.highScores}
              xp={game.xp}
              unlockedTiers={game.unlockedTiers}
              isMuted={game.isMuted}
              onToggleMute={game.toggleMute}
            />
          </PageTransition>
        );
    }
  };

  const showingLobby = showDuelLobby || showPartyLobby;

  return (
    <>
      {game.newAchievements.length > 0 && (
        <AchievementToast
          achievements={game.newAchievements}
          onDone={game.clearNewAchievements}
        />
      )}

      {showDuelLobby && !isInGame && (
        <DuelLobbyScreen
          playerName={localStorage.getItem('sg_player_name') || 'Anonymous'}
          onStart={handleDuelStart}
          onBack={() => setShowDuelLobby(false)}
        />
      )}

      {showPartyLobby && !isInGame && (
        <PartyLobbyScreen
          playerName={localStorage.getItem('sg_player_name') || 'Anonymous'}
          onStart={handlePartyStart}
          onBack={() => setShowPartyLobby(false)}
        />
      )}

      {!showingLobby && isInGame ? (
        <>
          {/* Keep GameScreen mounted during reveal for seamless transition */}
          {(game.phase === 'playing' || game.phase === 'reveal') && game.currentPlayer && (
            <div className={game.phase === 'reveal' ? 'pointer-events-none' : ''}>
              <PageTransition transitionKey={`playing-${game.currentPlayer.id}`}>
                <GameScreen
                  currentPlayer={game.currentPlayer}
                  choices={game.choices}
                  lives={game.lives}
                  score={game.score}
                  streak={game.streak}
                  timeLeft={game.timeLeft}
                  hintsRevealed={game.hintsRevealed}
                  hintsRemaining={game.hintsRemaining}
                  tier={game.tier}
                  isMuted={game.isMuted}
                  isDailyMode={game.isDailyMode}
                  isBuzzerMode={game.isBuzzerMode}
                  buzzerTimeLeft={game.buzzerTimeLeft}
                  buzzerTimeDelta={game.buzzerTimeDelta}
                  powerUpInventory={game.powerUpInventory}
                  activeSecondChance={game.activeSecondChance}
                  eliminatedChoices={game.eliminatedChoices}
                  nextPlayerVideoFile={game.nextPlayerVideoFile}
                  isMysteryMode={game.isMysteryMode}
                  mysteryCluesRevealed={game.mysteryCluesRevealed}
                  isHeatCheckMode={game.isHeatCheckMode}
                  heatLevel={game.heatLevel}
                  aiClues={game.aiClues ?? []}
                  aiClueLoading={game.aiClueLoading ?? false}
                  onAnswer={game.submitAnswer}
                  onHint={game.useHint}
                  onHome={game.goHome}
                  onToggleMute={game.toggleMute}
                  onVideoReady={game.setVideoReady}
                  onUsePowerUp={game.handleUsePowerUp}
                  onRevealClue={game.revealNextClue}
                />
              </PageTransition>
            </div>
          )}

          {/* Party score ticker overlay */}
          {isPartyMode && (game.phase === 'playing' || game.phase === 'reveal') && (
            <PartyScoreTicker players={partySync.players} myPid={partyPid} />
          )}

          {game.phase === 'reveal' && game.currentPlayer && (
            <div className="animate-fade-in" style={{ animationDuration: '150ms' }}>
              <RevealScreen
                player={game.currentPlayer}
                correct={game.lastAnswerCorrect ?? false}
                selectedAnswer={game.selectedAnswer}
                choices={game.choices}
                lives={game.isDailyMode ? 99 : game.lives}
                score={game.score}
                streak={game.streak}
                prevStreak={game.prevStreak}
                hintsUsedThisRound={game.hintsUsed}
                onContinue={game.continueGame}
                isDailyMode={game.isDailyMode}
                dailyRound={game.dailyRound}
                dailyTotal={game.dailyPlayers.length}
                nextPlayerImageUrl={game.nextPlayerImageUrl}
                nextPlayerVideoFile={game.nextPlayerVideoFile}
              />
            </div>
          )}
          {game.phase === 'gameover' && (
            <PageTransition transitionKey="gameover">
              <GameOverScreen
                score={game.score}
                bestStreak={game.bestStreak}
                totalCorrect={game.totalCorrect}
                totalAnswered={game.totalAnswered}
                tier={game.tier}
                highScores={game.highScores}
                xpEarned={game.xpEarned}
                answerHistory={game.answerHistory}
                isDailyMode={game.isDailyMode}
                isBuzzerMode={game.isBuzzerMode}
                isHeatCheckMode={game.isHeatCheckMode}
                isChallengeMode={game.isChallengeMode}
                isDuelMode={game.isDuelMode}
                challengerScore={game.challengerScore}
                challengerName={game.challengerName}
                duelOpponentName={game.duelOpponentName}
                duelOpponentScore={duelSync.opponentScore}
                duelRole={game.duelRole}
                playerHistory={game.playerHistory}
                leveledUp={game.leveledUp}
                newLevel={game.newLevel}
                onPlayAgain={game.startGame}
                onHome={game.goHome}
              />
            </PageTransition>
          )}
        </>
      ) : !showingLobby ? (
        <>
          {renderTabContent()}
          <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
        </>
      ) : null}
    </>
  );
};

export default Index;
