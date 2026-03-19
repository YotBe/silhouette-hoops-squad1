import { useState, useCallback, useEffect, useRef } from 'react';
import { Player, DifficultyTier, PLAYERS, TIER_CONFIG, getPlayersByTier, generateChoices, getPlayerEra } from '@/data/players';
import { generateAIClue } from '@/utils/aiClues';
import { SFX, setSFXMuted } from './useSoundEffects';
import { getDailyPlayers, getDailyChoices, isDailyChallengeCompleted, saveDailyResult, getDailyShareText, getDailySeed } from '@/utils/dailyChallenge';
import { hapticSuccess, hapticError, hapticLight, hapticCountdown } from '@/utils/haptics';
import { markCollected, markSeen } from '@/utils/collection';
import { getCollectedIds } from '@/utils/collection';
import { PowerUpType, getInventory, usePowerUp as usePowerUpUtil, awardRandomPowerUp, PowerUpInventory } from '@/utils/powerups';
import { updateAchievementStats, checkNewAchievements, getAchievementStats, Achievement } from '@/utils/achievements';
import { xpToLevel } from '@/utils/levels';
import { updateQuestProgress } from '@/utils/dailyQuests';
import { recordMastery } from '@/utils/mastery';
import { ChallengeData } from '@/utils/challenge';
import { storageGet, storageSet, storageGetJSON, storageSetJSON } from '@/utils/safeStorage';
import { calcRoundPoints, calcRoundXP } from './useScoring';

export const HEAT_LEVELS = [
  { level: 0, name: 'COLD', tier: 'rookie' as DifficultyTier, timerSeconds: 25, color: '210 100% 65%', emoji: '🥶' },
  { level: 1, name: 'WARMING UP', tier: 'pro' as DifficultyTier, timerSeconds: 12, color: '38 100% 60%', emoji: '🔥' },
  { level: 2, name: 'HEAT CHECK', tier: 'allstar' as DifficultyTier, timerSeconds: 10, color: '16 100% 58%', emoji: '🔥🔥' },
  { level: 3, name: 'ON FIRE', tier: 'mvp' as DifficultyTier, timerSeconds: 8, color: '0 100% 55%', emoji: '🔥🔥🔥' },
  { level: 4, name: 'UNSTOPPABLE', tier: 'legend' as DifficultyTier, timerSeconds: 6, color: '280 80% 60%', emoji: '👑' },
] as const;

export type GamePhase = 'home' | 'playing' | 'reveal' | 'gameover';

interface GameState {
  phase: GamePhase;
  tier: DifficultyTier;
  currentPlayer: Player | null;
  choices: Player[];
  lives: number;
  score: number;
  streak: number;
  bestStreak: number;
  hintsUsed: number;
  hintsRevealed: string[];
  totalAnswered: number;
  totalCorrect: number;
  lastAnswerCorrect: boolean | null;
  selectedAnswer: string | null;
  timeLeft: number;
  usedPlayerIds: string[];
  hintsRemaining: number;
  xpEarned: number;
  answerHistory: Array<{ correct: boolean; hintsUsed: number }>;
  isDailyMode: boolean;
  dailyPlayers: Player[];
  dailyRound: number;
  timerPaused: boolean;
  isBuzzerMode: boolean;
  buzzerTimeLeft: number;
  buzzerTimeDelta: number | null;
  activeSecondChance: boolean;
  eliminatedChoices: string[];
  gameHintsUsedTotal: number;
  prevStreak: number;
  isMysteryMode: boolean;
  mysteryCluesRevealed: number;
  leveledUp: boolean;
  newLevel: number;
  noHintCorrectThisGame: number;
  mysteryCompletedThisGame: boolean;
  // Heat Check Mode
  isHeatCheckMode: boolean;
  heatLevel: number;
  // Challenge Mode
  isChallengeMode: boolean;
  challengerScore: number;
  challengerName: string;
  challengePlayerIds: string[];
  challengeRound: number;
  // Player history for challenge sharing
  playerHistory: string[];
  // AI clues
  aiClues: string[];
  aiClueLoading: boolean;
  // Live Duel Mode
  isDuelMode: boolean;
  duelRoomId: string;
  duelRole: 'host' | 'guest' | null;
  duelOpponentName: string;
}

const INITIAL_LIVES = 3;
const TOTAL_HINTS = 3;
const BUZZER_START_TIME = 60;
const BUZZER_CORRECT_BONUS = 3;
const BUZZER_WRONG_PENALTY = 5;

const TIER_MIGRATION: Record<string, string> = { allstar: 'pro', mvp: 'allstar', halloffame: 'mvp' };

function getStoredHighScores(): Record<string, number> {
  const raw = storageGetJSON<Record<string, number>>('sg_highscores', {});
  const migrated: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw)) {
    const newKey = TIER_MIGRATION[k] || k;
    migrated[newKey] = Math.max(migrated[newKey] || 0, v as number);
  }
  return migrated;
}

function getStoredXP(): number {
  const raw = storageGet('sg_xp');
  return raw ? parseInt(raw, 10) : 0;
}

function getStoredScoreHistory(): Array<{ score: number; tier: string; date: string; streak: number }> {
  return storageGetJSON<Array<{ score: number; tier: string; date: string; streak: number }>>('sg_history', []);
}

function getStoredMuted(): boolean {
  return storageGet('sg_muted') === '1';
}

export function useGameState() {
  const [state, setState] = useState<GameState>({
    phase: 'home',
    tier: 'rookie',
    currentPlayer: null,
    choices: [],
    lives: INITIAL_LIVES,
    score: 0,
    streak: 0,
    bestStreak: 0,
    hintsUsed: 0,
    hintsRevealed: [],
    totalAnswered: 0,
    totalCorrect: 0,
    lastAnswerCorrect: null,
    selectedAnswer: null,
    timeLeft: 15,
    usedPlayerIds: [],
    hintsRemaining: TOTAL_HINTS,
    xpEarned: 0,
    answerHistory: [],
    isDailyMode: false,
    dailyPlayers: [],
    dailyRound: 0,
    timerPaused: true,
    isBuzzerMode: false,
    buzzerTimeLeft: BUZZER_START_TIME,
    buzzerTimeDelta: null,
    activeSecondChance: false,
    eliminatedChoices: [],
    gameHintsUsedTotal: 0,
    prevStreak: 0,
    isMysteryMode: false,
    mysteryCluesRevealed: 0,
    leveledUp: false,
    newLevel: 1,
    noHintCorrectThisGame: 0,
    mysteryCompletedThisGame: false,
    isHeatCheckMode: false,
    heatLevel: 0,
    isChallengeMode: false,
    challengerScore: 0,
    challengerName: '',
    challengePlayerIds: [],
    challengeRound: 0,
    playerHistory: [],
    aiClues: [],
    aiClueLoading: false,
    isDuelMode: false,
    duelRoomId: '',
    duelRole: null,
    duelOpponentName: '',
  });

  const [xp, setXP] = useState(getStoredXP);
  const [highScores, setHighScores] = useState(getStoredHighScores);
  const [scoreHistory, setScoreHistory] = useState(getStoredScoreHistory);
  const [powerUpInventory, setPowerUpInventory] = useState<PowerUpInventory>(getInventory);
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);
  const [isMuted, setIsMuted] = useState(() => {
    const m = getStoredMuted();
    setSFXMuted(m);
    return m;
  });
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const buzzerTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refreshInventory = useCallback(() => setPowerUpInventory(getInventory()), []);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const next = !prev;
      setSFXMuted(next);
      storageSet('sg_muted', next ? '1' : '0');
      return next;
    });
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const clearBuzzerTimer = useCallback(() => {
    if (buzzerTimerRef.current) { clearInterval(buzzerTimerRef.current); buzzerTimerRef.current = null; }
  }, []);

  const nextPlayer = useCallback((tier: DifficultyTier, usedIds: string[]) => {
    const tierPlayers = getPlayersByTier(tier);
    const pool_all = tierPlayers.length > 0 ? tierPlayers : PLAYERS;
    const available = pool_all.filter(p => !usedIds.includes(p.id));
    const pool = available.length > 0 ? available : pool_all;

    // Era-weighted selection: Modern 50%, Classic 30%, OG 20%
    const modern = pool.filter(p => getPlayerEra(p) === 'modern');
    const classic = pool.filter(p => getPlayerEra(p) === 'classic');
    const og = pool.filter(p => getPlayerEra(p) === 'og');
    const eraWeights: [Player[], number][] = [];
    if (modern.length > 0) eraWeights.push([modern, 0.5]);
    if (classic.length > 0) eraWeights.push([classic, 0.3]);
    if (og.length > 0) eraWeights.push([og, 0.2]);

    let player: Player;
    if (eraWeights.length === 0) {
      player = pool[Math.floor(Math.random() * pool.length)];
    } else {
      const totalWeight = eraWeights.reduce((s, [, w]) => s + w, 0);
      let r = Math.random() * totalWeight;
      let chosen = eraWeights[eraWeights.length - 1][0];
      for (const [players, weight] of eraWeights) {
        r -= weight;
        if (r <= 0) { chosen = players; break; }
      }
      player = chosen[Math.floor(Math.random() * chosen.length)];
    }

    // MVP/Legend get 4 choices (harder); other tiers get 2 choices
    const wrongCount: 1 | 3 = (tier === 'mvp' || tier === 'legend') ? 3 : 1;
    const choices = generateChoices(player, PLAYERS, wrongCount);
    return { player, choices, usedIds: [...usedIds, player.id] };
  }, []);

  const nextRandomPlayer = useCallback((usedIds: string[]) => {
    const available = PLAYERS.filter(p => !usedIds.includes(p.id));
    const pool = available.length > 0 ? available : PLAYERS;
    const player = pool[Math.floor(Math.random() * pool.length)];
    const choices = generateChoices(player, PLAYERS);
    return { player, choices, usedIds: [...usedIds, player.id] };
  }, []);

  const BASE_STATE_RESET = {
    lives: INITIAL_LIVES, score: 0, streak: 0, bestStreak: 0,
    hintsUsed: 0, hintsRevealed: [] as string[], totalAnswered: 0, totalCorrect: 0,
    lastAnswerCorrect: null as null, selectedAnswer: null as null,
    usedPlayerIds: [] as string[], hintsRemaining: TOTAL_HINTS, xpEarned: 0,
    answerHistory: [] as Array<{ correct: boolean; hintsUsed: number }>,
    isDailyMode: false, dailyPlayers: [] as Player[], dailyRound: 0,
    timerPaused: true, isBuzzerMode: false, buzzerTimeLeft: BUZZER_START_TIME,
    buzzerTimeDelta: null as null, activeSecondChance: false, eliminatedChoices: [] as string[],
    gameHintsUsedTotal: 0, prevStreak: 0,
    isMysteryMode: false, mysteryCluesRevealed: 0,
    leveledUp: false, noHintCorrectThisGame: 0, mysteryCompletedThisGame: false,
    isHeatCheckMode: false, heatLevel: 0,
    isChallengeMode: false, challengerScore: 0, challengerName: '', challengePlayerIds: [] as string[], challengeRound: 0,
    playerHistory: [] as string[],
    aiClues: [] as string[], aiClueLoading: false,
    isDuelMode: false, duelRoomId: '', duelRole: null as null, duelOpponentName: '',
  };

  const startGame = useCallback((tier: DifficultyTier) => {
    clearTimer();
    clearBuzzerTimer();
    SFX.start();
    const { player, choices, usedIds } = nextPlayer(tier, []);
    const timerSeconds = TIER_CONFIG[tier].timerSeconds;
    refreshInventory();
    setState({
      ...BASE_STATE_RESET,
      phase: 'playing', tier, currentPlayer: player, choices,
      timeLeft: timerSeconds, usedPlayerIds: usedIds,
      newLevel: xpToLevel(xp),
      playerHistory: [player.id],
    });
  }, [clearTimer, clearBuzzerTimer, nextPlayer, refreshInventory, xp]);

  const startBuzzerBeater = useCallback(() => {
    clearTimer();
    clearBuzzerTimer();
    SFX.start();
    const { player, choices, usedIds } = nextRandomPlayer([]);
    refreshInventory();
    setState({
      ...BASE_STATE_RESET,
      phase: 'playing', tier: 'rookie', currentPlayer: player, choices,
      timeLeft: 999, usedPlayerIds: usedIds,
      newLevel: xpToLevel(xp),
      lives: 99, isBuzzerMode: true, buzzerTimeLeft: BUZZER_START_TIME,
      playerHistory: [player.id],
    });
  }, [clearTimer, clearBuzzerTimer, nextRandomPlayer, refreshInventory, xp]);

  const startMysteryMode = useCallback(() => {
    clearTimer();
    clearBuzzerTimer();
    SFX.start();
    const { player, choices, usedIds } = nextRandomPlayer([]);
    refreshInventory();
    setState({
      ...BASE_STATE_RESET,
      phase: 'playing', tier: 'allstar', currentPlayer: player, choices,
      timeLeft: 999, usedPlayerIds: usedIds,
      newLevel: xpToLevel(xp),
      timerPaused: false, isMysteryMode: true,
      playerHistory: [player.id],
    });
  }, [clearTimer, clearBuzzerTimer, nextRandomPlayer, refreshInventory, xp]);

  const startHeatCheckMode = useCallback(() => {
    clearTimer();
    clearBuzzerTimer();
    SFX.start();
    const { player, choices, usedIds } = nextPlayer('rookie', []);
    refreshInventory();
    setState({
      ...BASE_STATE_RESET,
      phase: 'playing', tier: 'rookie', currentPlayer: player, choices,
      timeLeft: HEAT_LEVELS[0].timerSeconds, usedPlayerIds: usedIds,
      newLevel: xpToLevel(xp),
      isHeatCheckMode: true, heatLevel: 0,
      playerHistory: [player.id],
    });
  }, [clearTimer, clearBuzzerTimer, nextPlayer, refreshInventory, xp]);

  const startChallengeGame = useCallback((challenge: ChallengeData) => {
    const challengePlayers = challenge.playerIds
      .map(id => PLAYERS.find(p => p.id === id))
      .filter((p): p is Player => !!p);
    if (challengePlayers.length === 0) return;
    clearTimer();
    clearBuzzerTimer();
    SFX.start();
    const firstPlayer = challengePlayers[0];
    const choices = generateChoices(firstPlayer, PLAYERS);
    refreshInventory();
    setState({
      ...BASE_STATE_RESET,
      phase: 'playing', tier: 'rookie', currentPlayer: firstPlayer, choices,
      timeLeft: 15, usedPlayerIds: [firstPlayer.id],
      newLevel: xpToLevel(xp),
      isDailyMode: true, dailyPlayers: challengePlayers, dailyRound: 0,
      lives: 99,
      isChallengeMode: true,
      challengerScore: challenge.score,
      challengerName: challenge.name,
      challengePlayerIds: challenge.playerIds,
      playerHistory: [firstPlayer.id],
    });
  }, [clearTimer, clearBuzzerTimer, refreshInventory, xp]);

  const revealNextClue = useCallback(() => {
    setState(prev => {
      if (!prev.isMysteryMode || prev.mysteryCluesRevealed >= 3) return prev;
      return { ...prev, mysteryCluesRevealed: prev.mysteryCluesRevealed + 1 };
    });
  }, []);

  const startDailyChallenge = useCallback(() => {
    if (isDailyChallengeCompleted()) return;
    clearTimer();
    clearBuzzerTimer();
    SFX.start();
    const dailyPlayers = getDailyPlayers();
    const firstPlayer = dailyPlayers[0];
    const choices = getDailyChoices(firstPlayer);
    refreshInventory();
    setState({
      ...BASE_STATE_RESET,
      phase: 'playing', tier: 'rookie', currentPlayer: firstPlayer, choices,
      timeLeft: 15, usedPlayerIds: [firstPlayer.id],
      newLevel: xpToLevel(xp),
      lives: 99, isDailyMode: true, dailyPlayers, dailyRound: 0,
      playerHistory: [firstPlayer.id],
    });
  }, [clearTimer, clearBuzzerTimer, refreshInventory, xp]);

  const startDuelGame = useCallback((
    roomId: string,
    playerIds: string[],
    role: 'host' | 'guest',
    opponentName: string
  ) => {
    const duelPlayers = playerIds
      .map(id => PLAYERS.find(p => p.id === id))
      .filter((p): p is Player => !!p);
    if (duelPlayers.length === 0) return;
    clearTimer();
    clearBuzzerTimer();
    SFX.start();
    const firstPlayer = duelPlayers[0];
    const choices = generateChoices(firstPlayer, PLAYERS);
    refreshInventory();
    setState({
      ...BASE_STATE_RESET,
      phase: 'playing', tier: 'allstar', currentPlayer: firstPlayer, choices,
      timeLeft: 12, usedPlayerIds: [firstPlayer.id],
      newLevel: xpToLevel(xp),
      isDailyMode: true, dailyPlayers: duelPlayers, dailyRound: 0,
      lives: 99,
      isDuelMode: true, duelRoomId: roomId, duelRole: role, duelOpponentName: opponentName,
      playerHistory: [firstPlayer.id],
    });
  }, [clearTimer, clearBuzzerTimer, refreshInventory, xp]);

  const setVideoReady = useCallback(() => {
    setState(prev => ({ ...prev, timerPaused: false }));
  }, []);

  const handleUsePowerUp = useCallback((type: PowerUpType) => {
    setState(prev => {
      if (prev.phase !== 'playing' || !prev.currentPlayer) return prev;

      if (type === 'fiftyFifty') {
        if (!usePowerUpUtil('fiftyFifty')) return prev;
        SFX.hint();
        hapticLight();
        const wrongChoices = prev.choices
          .filter(c => c.id !== prev.currentPlayer!.id && !prev.eliminatedChoices.includes(c.id));
        const toEliminate = wrongChoices.sort(() => Math.random() - 0.5).slice(0, 2).map(c => c.id);
        refreshInventory();
        return { ...prev, eliminatedChoices: [...prev.eliminatedChoices, ...toEliminate] };
      }

      if (type === 'extraTime') {
        if (!usePowerUpUtil('extraTime')) return prev;
        SFX.hint();
        hapticLight();
        refreshInventory();
        return { ...prev, timeLeft: prev.timeLeft + 5 };
      }

      if (type === 'secondChance') {
        if (prev.activeSecondChance) return prev;
        if (!usePowerUpUtil('secondChance')) return prev;
        SFX.hint();
        hapticLight();
        refreshInventory();
        return { ...prev, activeSecondChance: true };
      }

      return prev;
    });
  }, [refreshInventory]);

  const submitAnswer = useCallback((playerId: string) => {
    if (!state.isBuzzerMode) clearTimer();
    setState(prev => {
      if (!prev.currentPlayer || prev.phase !== 'playing') return prev;
      const correct = playerId === prev.currentPlayer.id;

      if (!correct && prev.activeSecondChance) {
        SFX.hint();
        hapticLight();
        return {
          ...prev,
          activeSecondChance: false,
          eliminatedChoices: [...prev.eliminatedChoices, playerId],
        };
      }

      markSeen(prev.currentPlayer!.id);

      if (correct) {
        SFX.correct(); hapticSuccess(); markCollected(prev.currentPlayer!.id);
        // Record mastery
        const maxTime = prev.isBuzzerMode ? 999 : TIER_CONFIG[prev.tier].timerSeconds;
        recordMastery(prev.currentPlayer!.id, prev.timeLeft / maxTime, prev.hintsRevealed.length);
        // Track guess distribution by hints used
        const dist = storageGetJSON<Record<string, number>>('sg_guess_distribution', {});
        const distKey = String(prev.hintsRevealed.length);
        dist[distKey] = (dist[distKey] || 0) + 1;
        storageSetJSON('sg_guess_distribution', dist);
        // Track era stats
        const era = getPlayerEra(prev.currentPlayer!);
        const eraStats = storageGetJSON<Record<string, { correct: number; total: number }>>('sg_era_stats', {});
        if (!eraStats[era]) eraStats[era] = { correct: 0, total: 0 };
        eraStats[era].correct += 1;
        eraStats[era].total += 1;
        storageSetJSON('sg_era_stats', eraStats);
      } else {
        SFX.wrong(); hapticError();
        // Track era stats for wrong answers too
        const era = getPlayerEra(prev.currentPlayer!);
        const eraStats = storageGetJSON<Record<string, { correct: number; total: number }>>('sg_era_stats', {});
        if (!eraStats[era]) eraStats[era] = { correct: 0, total: 0 };
        eraStats[era].total += 1;
        storageSetJSON('sg_era_stats', eraStats);
      }
      const newStreak = correct ? prev.streak + 1 : 0;
      if (newStreak > 0 && newStreak % 3 === 0) { setTimeout(() => SFX.streak(), 300); }

      if (newStreak > 0 && newStreak % 5 === 0) {
        awardRandomPowerUp();
        refreshInventory();
      }

      const points = calcRoundPoints({
        correct,
        streak: prev.streak,
        hintsRevealed: prev.hintsRevealed.length,
        timeLeft: prev.timeLeft,
        timerSeconds: TIER_CONFIG[prev.tier]?.timerSeconds ?? 15,
        isMysteryMode: prev.isMysteryMode,
        mysteryCluesRevealed: prev.mysteryCluesRevealed,
        isBuzzerMode: prev.isBuzzerMode,
      });
      const roundXP = calcRoundXP(correct, newStreak, prev.hintsRevealed.length);
      const noHintCorrect = correct && prev.hintsRevealed.length === 0;

      // Buzzer mode
      if (prev.isBuzzerMode) {
        const delta = correct ? BUZZER_CORRECT_BONUS : -BUZZER_WRONG_PENALTY;
        const newBuzzerTime = Math.max(prev.buzzerTimeLeft + delta, 0);
        const { player, choices, usedIds } = (() => {
          const available = PLAYERS.filter(p => !prev.usedPlayerIds.includes(p.id));
          const pool = available.length > 0 ? available : PLAYERS;
          const pl = pool[Math.floor(Math.random() * pool.length)];
          const ch = generateChoices(pl, PLAYERS);
          return { player: pl, choices: ch, usedIds: [...prev.usedPlayerIds, pl.id] };
        })();

        if (newBuzzerTime <= 0) {
          SFX.gameOver();
          return {
            ...prev, phase: 'gameover' as GamePhase,
            score: prev.score + points, streak: newStreak,
            bestStreak: Math.max(prev.bestStreak, newStreak),
            totalAnswered: prev.totalAnswered + 1,
            totalCorrect: prev.totalCorrect + (correct ? 1 : 0),
            xpEarned: prev.xpEarned + roundXP,
            answerHistory: [...prev.answerHistory, { correct, hintsUsed: prev.hintsRevealed.length }],
            buzzerTimeLeft: 0, buzzerTimeDelta: delta,
          };
        }

        return {
          ...prev, currentPlayer: player, choices, usedPlayerIds: usedIds,
          score: prev.score + points, streak: newStreak,
          bestStreak: Math.max(prev.bestStreak, newStreak),
          totalAnswered: prev.totalAnswered + 1,
          totalCorrect: prev.totalCorrect + (correct ? 1 : 0),
          xpEarned: prev.xpEarned + roundXP,
          answerHistory: [...prev.answerHistory, { correct, hintsUsed: prev.hintsRevealed.length }],
          buzzerTimeLeft: newBuzzerTime, buzzerTimeDelta: delta,
          hintsRevealed: [], hintsRemaining: TOTAL_HINTS,
          selectedAnswer: null, lastAnswerCorrect: correct,
          eliminatedChoices: [], activeSecondChance: false,
          aiClues: [], aiClueLoading: false,
        };
      }

      const newLives = prev.isDailyMode ? prev.lives : (correct ? prev.lives : prev.lives - 1);
      // Heat check: update heat level based on correct count
      const newTotalCorrect = prev.totalCorrect + (correct ? 1 : 0);
      const newHeatLevel = prev.isHeatCheckMode
        ? Math.min(Math.floor(newTotalCorrect / 3), 4)
        : prev.heatLevel;

      return {
        ...prev, phase: 'reveal' as GamePhase,
        lastAnswerCorrect: correct, selectedAnswer: playerId,
        score: prev.score + points, streak: newStreak,
        bestStreak: Math.max(prev.bestStreak, newStreak),
        totalAnswered: prev.totalAnswered + 1,
        totalCorrect: newTotalCorrect,
        lives: newLives, xpEarned: prev.xpEarned + roundXP,
        answerHistory: [...prev.answerHistory, { correct, hintsUsed: prev.hintsRevealed.length }],
        buzzerTimeDelta: null,
        prevStreak: prev.streak,
        noHintCorrectThisGame: prev.noHintCorrectThisGame + (noHintCorrect ? 1 : 0),
        mysteryCluesRevealed: 0,
        heatLevel: newHeatLevel,
        tier: prev.isHeatCheckMode ? HEAT_LEVELS[newHeatLevel].tier : prev.tier,
      };
    });
  }, [clearTimer, state.isBuzzerMode, refreshInventory]);

  const timeUp = useCallback(() => {
    clearTimer();
    SFX.timeout();
    hapticError();
    setState(prev => {
      if (prev.phase !== 'playing') return prev;

      if (prev.activeSecondChance) {
        SFX.hint();
        return { ...prev, activeSecondChance: false, timeLeft: 5 };
      }

      // Track timeout in guess distribution
      const dist = storageGetJSON<Record<string, number>>('sg_guess_distribution', {});
      dist['timeout'] = (dist['timeout'] || 0) + 1;
      storageSetJSON('sg_guess_distribution', dist);
      // Track era stats for timeout
      const era = getPlayerEra(prev.currentPlayer!);
      const eraStats = storageGetJSON<Record<string, { correct: number; total: number }>>('sg_era_stats', {});
      if (!eraStats[era]) eraStats[era] = { correct: 0, total: 0 };
      eraStats[era].total += 1;
      storageSetJSON('sg_era_stats', eraStats);

      return {
        ...prev, phase: 'reveal' as GamePhase,
        lastAnswerCorrect: false, selectedAnswer: null,
        streak: 0, totalAnswered: prev.totalAnswered + 1,
        lives: prev.isDailyMode ? prev.lives : prev.lives - 1,
        answerHistory: [...prev.answerHistory, { correct: false, hintsUsed: prev.hintsRevealed.length }],
        prevStreak: prev.streak,
      };
    });
  }, [clearTimer]);

  const continueGame = useCallback(() => {
    setState(prev => {
      if (prev.isDailyMode) {
        const nextRound = prev.dailyRound + 1;
        if (nextRound >= prev.dailyPlayers.length) {
          SFX.gameOver();
          if (!prev.isChallengeMode) {
            const result = {
              score: prev.score,
              answers: prev.answerHistory.map(a => a.correct),
              answerDetails: prev.answerHistory,
              players: prev.dailyPlayers.map(p => p.name),
              date: getDailySeed(),
            };
            saveDailyResult(result);
          }
          const newXP = xp + prev.xpEarned;
          const prevLevel = xpToLevel(xp);
          const newLevel = xpToLevel(newXP);
          setXP(newXP);
          storageSet('sg_xp', String(newXP));

          // Save daily/challenge mode to history
          const entry = { score: prev.score, tier: prev.isChallengeMode ? 'challenge' : 'daily', date: new Date().toISOString(), streak: prev.bestStreak, answerHistory: prev.answerHistory };
          const newHistory = [entry, ...scoreHistory].slice(0, 50);
          setScoreHistory(newHistory);
          storageSetJSON('sg_history', newHistory);

          return { ...prev, phase: 'gameover' as GamePhase, leveledUp: newLevel > prevLevel, newLevel };
        }
        const nextPlayerDaily = prev.dailyPlayers[nextRound];
        const choices = getDailyChoices(nextPlayerDaily);
        return {
          ...prev, phase: 'playing' as GamePhase,
          currentPlayer: nextPlayerDaily, choices,
          lastAnswerCorrect: null, selectedAnswer: null,
          hintsRevealed: [], timeLeft: 15, dailyRound: nextRound,
          timerPaused: true, eliminatedChoices: [], activeSecondChance: false,
          aiClues: [], aiClueLoading: false,
        };
      }

      if (prev.lives <= 0) {
        SFX.gameOver();
        const newXP = xp + prev.xpEarned;
        const prevLevel = xpToLevel(xp);
        const newLevel = xpToLevel(newXP);
        setXP(newXP);
        storageSet('sg_xp', String(newXP));

        const tierHighScore = highScores[prev.tier] || 0;
        if (prev.score > tierHighScore) {
          const newHS = { ...highScores, [prev.tier]: prev.score };
          setHighScores(newHS);
          storageSetJSON('sg_highscores', newHS);
        }

        const entry = { score: prev.score, tier: prev.tier, date: new Date().toISOString(), streak: prev.bestStreak, answerHistory: prev.answerHistory };
        const newHistory = [entry, ...scoreHistory].slice(0, 50);
        setScoreHistory(newHistory);
        storageSetJSON('sg_history', newHistory);

        return {
          ...prev, phase: 'gameover' as GamePhase,
          leveledUp: newLevel > prevLevel,
          newLevel,
        };
      }

      const { player, choices, usedIds } = nextPlayer(prev.tier, prev.usedPlayerIds);
      const nextTimeLeft = prev.isHeatCheckMode
        ? HEAT_LEVELS[prev.heatLevel].timerSeconds
        : TIER_CONFIG[prev.tier].timerSeconds;
      return {
        ...prev, phase: 'playing' as GamePhase,
        currentPlayer: player, choices,
        lastAnswerCorrect: null, selectedAnswer: null,
        hintsRevealed: [], timeLeft: nextTimeLeft,
        usedPlayerIds: usedIds, timerPaused: true,
        eliminatedChoices: [], activeSecondChance: false,
        mysteryCluesRevealed: 0,
        aiClues: [], aiClueLoading: false,
        playerHistory: [...prev.playerHistory, player.id],
      };
    });
  }, [xp, highScores, scoreHistory, nextPlayer]);

  const useHint = useCallback(() => {
    const apiKey = import.meta.env.VITE_CLAUDE_API_KEY as string | undefined;
    const apiKeyAvailable = !!apiKey;

    let currentPlayerSnapshot: Player | null = null;
    let alreadyShownClueTexts: string[] = [];
    let hintNumber = 1;

    setState(prev => {
      if (prev.hintsRemaining <= 0 || !prev.currentPlayer) return prev;
      SFX.hint();
      hapticLight();
      const hintOrder = ['position', 'number', 'team'];
      const nextHint = hintOrder.find(h => !prev.hintsRevealed.includes(h));
      if (!nextHint) return prev;

      // Capture data for AI clue generation outside of setState
      currentPlayerSnapshot = prev.currentPlayer;
      hintNumber = prev.hintsRevealed.length + 1;
      // Build the already-shown clue texts from the static hint values
      const hintTypes = [
        { key: 'position', value: prev.currentPlayer.position },
        { key: 'number', value: `#${prev.currentPlayer.number}` },
        { key: 'team', value: prev.currentPlayer.team },
      ];
      alreadyShownClueTexts = prev.hintsRevealed
        .map(k => hintTypes.find(h => h.key === k)?.value ?? '')
        .filter(Boolean);
      // Also include already-generated AI clues
      alreadyShownClueTexts = [...alreadyShownClueTexts, ...prev.aiClues];

      return {
        ...prev,
        hintsRevealed: [...prev.hintsRevealed, nextHint],
        hintsRemaining: prev.hintsRemaining - 1,
        hintsUsed: prev.hintsUsed + 1,
        gameHintsUsedTotal: prev.gameHintsUsedTotal + 1,
      };
    });

    // Generate AI clue asynchronously after state update
    if (apiKeyAvailable) {
      // We need to wait a tick so currentPlayerSnapshot is populated
      setTimeout(() => {
        if (!currentPlayerSnapshot) return;
        setState(prev => ({ ...prev, aiClueLoading: true }));
        generateAIClue(currentPlayerSnapshot!, alreadyShownClueTexts, hintNumber)
          .then(clue => {
            if (clue) {
              setState(prev => ({ ...prev, aiClues: [...prev.aiClues, clue], aiClueLoading: false }));
            } else {
              setState(prev => ({ ...prev, aiClueLoading: false }));
            }
          })
          .catch(() => setState(prev => ({ ...prev, aiClueLoading: false })));
      }, 0);
    }
  }, []);

  const goHome = useCallback(() => {
    clearTimer();
    clearBuzzerTimer();
    setState(prev => ({ ...prev, phase: 'home' as GamePhase, isBuzzerMode: false }));
  }, [clearTimer, clearBuzzerTimer]);

  const setTier = useCallback((tier: DifficultyTier) => {
    setState(prev => ({ ...prev, tier }));
  }, []);

  const clearNewAchievements = useCallback(() => {
    setNewAchievements([]);
  }, []);

  // Per-round timer
  useEffect(() => {
    if (state.phase === 'playing' && state.currentPlayer && !state.timerPaused && !state.isBuzzerMode) {
      clearTimer();
      timerRef.current = setInterval(() => {
        setState(prev => {
          if (prev.timeLeft <= 0) return prev;
          const newTime = prev.timeLeft - 1;
          if (newTime <= 3) { SFX.tickUrgent(); hapticCountdown(); } else if (newTime <= 5) { SFX.tick(); }
          return { ...prev, timeLeft: newTime };
        });
      }, 1000);
    }
    return clearTimer;
  }, [state.phase, state.currentPlayer?.id, state.timerPaused, state.isBuzzerMode, clearTimer]);

  // Buzzer mode global timer
  useEffect(() => {
    if (state.phase === 'playing' && state.isBuzzerMode && !state.timerPaused) {
      clearBuzzerTimer();
      buzzerTimerRef.current = setInterval(() => {
        setState(prev => {
          if (prev.buzzerTimeLeft <= 1) {
            SFX.gameOver();
            hapticError();
            return { ...prev, phase: 'gameover' as GamePhase, buzzerTimeLeft: 0 };
          }
          const newTime = prev.buzzerTimeLeft - 1;
          if (newTime <= 5) { SFX.tickUrgent(); hapticCountdown(); } else if (newTime <= 10) { SFX.tick(); }
          return { ...prev, buzzerTimeLeft: newTime };
        });
      }, 1000);
    }
    return clearBuzzerTimer;
  }, [state.phase, state.isBuzzerMode, state.timerPaused, clearBuzzerTimer]);

  // Check time up
  useEffect(() => {
    if (state.phase === 'playing' && state.timeLeft <= 0 && !state.isBuzzerMode) { timeUp(); }
  }, [state.timeLeft, state.phase, state.isBuzzerMode, timeUp]);

  // Save buzzer high score + achievements on game over
  useEffect(() => {
    if (state.phase === 'gameover') {
      const isPerfect = state.totalAnswered > 0 && state.totalCorrect === state.totalAnswered;
      const currentStats = getAchievementStats();
      updateAchievementStats({
        totalCorrect: currentStats.totalCorrect + state.totalCorrect,
        totalGames: currentStats.totalGames + 1,
        totalAnswered: (currentStats.totalAnswered || 0) + state.totalAnswered,
        bestStreak: state.bestStreak,
        totalXP: xp + state.xpEarned,
        collectedPlayers: getCollectedIds().length,
        perfectGames: currentStats.perfectGames + (isPerfect ? 1 : 0),
        dailyChallengesCompleted: currentStats.dailyChallengesCompleted + (state.isDailyMode ? 1 : 0),
        buzzerGamesPlayed: currentStats.buzzerGamesPlayed + (state.isBuzzerMode ? 1 : 0),
        hintsNeverUsed: currentStats.hintsNeverUsed + (state.gameHintsUsedTotal === 0 && state.totalCorrect > 0 ? 1 : 0),
      });

      // Update daily quests
      updateQuestProgress({
        bestStreak: state.bestStreak,
        noHintCorrect: state.noHintCorrectThisGame,
        dailyCompleted: state.isDailyMode,
        totalCorrect: state.totalCorrect,
        mysteryCompleted: state.mysteryCompletedThisGame,
      });

      const newlyUnlocked = checkNewAchievements();
      if (newlyUnlocked.length > 0) {
        setNewAchievements(newlyUnlocked);
      }

      if (state.isBuzzerMode || state.isHeatCheckMode) {
        const newXP = xp + state.xpEarned;
        const prevLevel = xpToLevel(xp);
        const newLevel = xpToLevel(newXP);
        setXP(newXP);
        storageSet('sg_xp', String(newXP));

        const modeKey = state.isBuzzerMode ? 'buzzer' : 'heatcheck';
        const modeHS = highScores[modeKey] || 0;
        if (state.score > modeHS) {
          const newHS = { ...highScores, [modeKey]: state.score };
          setHighScores(newHS);
          storageSetJSON('sg_highscores', newHS);
        }

        const entry = { score: state.score, tier: modeKey, date: new Date().toISOString(), streak: state.bestStreak, answerHistory: state.answerHistory };
        const newHistory = [entry, ...scoreHistory].slice(0, 50);
        setScoreHistory(newHistory);
        storageSetJSON('sg_history', newHistory);

        if (newLevel > prevLevel) {
          setState(prev => ({ ...prev, leveledUp: true, newLevel }));
        }
      }
    }
  }, [state.phase]);

  const unlockedTiers = (Object.keys(TIER_CONFIG) as DifficultyTier[]).filter(
    t => xp >= TIER_CONFIG[t].xpRequired
  );

  // Precompute next player image URL and video file for prefetching during reveal AND playing
  const nextPlayerImageUrl = (() => {
    if ((state.phase !== 'reveal' && state.phase !== 'playing') || !state.currentPlayer) return null;
    if (state.isDailyMode) {
      const nextRound = state.dailyRound + 1;
      if (nextRound < state.dailyPlayers.length) return state.dailyPlayers[nextRound].imageUrl;
      return null;
    }
    if (state.lives <= 0) return null;
    const tierPlayers = getPlayersByTier(state.tier);
    const available = tierPlayers.filter(p => !state.usedPlayerIds.includes(p.id));
    return available.length > 0 ? available[0].imageUrl : null;
  })();

  const nextPlayerVideoFile = (() => {
    if ((state.phase !== 'reveal' && state.phase !== 'playing') || !state.currentPlayer) return null;
    if (state.isDailyMode) {
      const nextRound = state.dailyRound + 1;
      if (nextRound < state.dailyPlayers.length) return state.dailyPlayers[nextRound].videoFile;
      return null;
    }
    if (state.lives <= 0) return null;
    const tierPlayers = getPlayersByTier(state.tier);
    const available = tierPlayers.filter(p => !state.usedPlayerIds.includes(p.id));
    return available.length > 0 ? available[0].videoFile : null;
  })();

  return {
    ...state,
    xp,
    highScores,
    scoreHistory,
    unlockedTiers,
    isMuted,
    powerUpInventory,
    newAchievements,
    nextPlayerImageUrl,
    nextPlayerVideoFile,
    toggleMute,
    startGame,
    startBuzzerBeater,
    startDailyChallenge,
    startMysteryMode,
    startHeatCheckMode,
    startChallengeGame,
    startDuelGame,
    revealNextClue,
    setVideoReady,
    submitAnswer,
    continueGame,
    useHint,
    goHome,
    setTier,
    handleUsePowerUp,
    clearNewAchievements,
    aiClues: state.aiClues,
    aiClueLoading: state.aiClueLoading,
  };
}
