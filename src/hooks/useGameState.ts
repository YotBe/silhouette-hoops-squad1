import { useState, useCallback, useEffect, useRef } from 'react';
import { Player, DifficultyTier, PLAYERS, TIER_CONFIG, getPlayersByTier, generateChoices, getPlayerEra } from '@/data/players';
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
}

const INITIAL_LIVES = 3;
const TOTAL_HINTS = 3;
const BUZZER_START_TIME = 60;
const BUZZER_CORRECT_BONUS = 3;
const BUZZER_WRONG_PENALTY = 5;

const TIER_MIGRATION: Record<string, string> = { allstar: 'pro', mvp: 'allstar', halloffame: 'mvp' };

function getStoredHighScores(): Record<string, number> {
  try {
    const raw = JSON.parse(localStorage.getItem('sg_highscores') || '{}');
    const migrated: Record<string, number> = {};
    for (const [k, v] of Object.entries(raw)) {
      const newKey = TIER_MIGRATION[k] || k;
      migrated[newKey] = Math.max(migrated[newKey] || 0, v as number);
    }
    return migrated;
  } catch { return {}; }
}

function getStoredXP(): number {
  try { return parseInt(localStorage.getItem('sg_xp') || '0', 10); } catch { return 0; }
}

function getStoredScoreHistory(): Array<{ score: number; tier: string; date: string; streak: number }> {
  try { return JSON.parse(localStorage.getItem('sg_history') || '[]'); } catch { return []; }
}

function getStoredMuted(): boolean {
  try { return localStorage.getItem('sg_muted') === '1'; } catch { return false; }
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
      localStorage.setItem('sg_muted', next ? '1' : '0');
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
    // Fall back to all players if tier has no content
    const pool_all = tierPlayers.length > 0 ? tierPlayers : PLAYERS;
    const available = pool_all.filter(p => !usedIds.includes(p.id));
    const pool = available.length > 0 ? available : pool_all;
    const player = pool[Math.floor(Math.random() * pool.length)];
    const choices = generateChoices(player, PLAYERS);
    return { player, choices, usedIds: [...usedIds, player.id] };
  }, []);

  const nextRandomPlayer = useCallback((usedIds: string[]) => {
    const available = PLAYERS.filter(p => !usedIds.includes(p.id));
    const pool = available.length > 0 ? available : PLAYERS;
    const player = pool[Math.floor(Math.random() * pool.length)];
    const choices = generateChoices(player, PLAYERS);
    return { player, choices, usedIds: [...usedIds, player.id] };
  }, []);

  const startGame = useCallback((tier: DifficultyTier) => {
    clearTimer();
    clearBuzzerTimer();
    SFX.start();
    const { player, choices, usedIds } = nextPlayer(tier, []);
    const timerSeconds = TIER_CONFIG[tier].timerSeconds;
    refreshInventory();
    setState({
      phase: 'playing', tier, currentPlayer: player, choices,
      lives: INITIAL_LIVES, score: 0, streak: 0, bestStreak: 0,
      hintsUsed: 0, hintsRevealed: [], totalAnswered: 0, totalCorrect: 0,
      lastAnswerCorrect: null, selectedAnswer: null, timeLeft: timerSeconds,
      usedPlayerIds: usedIds, hintsRemaining: TOTAL_HINTS, xpEarned: 0,
      answerHistory: [], isDailyMode: false, dailyPlayers: [], dailyRound: 0,
      timerPaused: true, isBuzzerMode: false, buzzerTimeLeft: BUZZER_START_TIME,
      buzzerTimeDelta: null, activeSecondChance: false, eliminatedChoices: [],
      gameHintsUsedTotal: 0, prevStreak: 0,
      isMysteryMode: false, mysteryCluesRevealed: 0,
      leveledUp: false, newLevel: xpToLevel(xp), noHintCorrectThisGame: 0, mysteryCompletedThisGame: false,
    });
  }, [clearTimer, clearBuzzerTimer, nextPlayer, refreshInventory, xp]);

  const startBuzzerBeater = useCallback(() => {
    clearTimer();
    clearBuzzerTimer();
    SFX.start();
    const { player, choices, usedIds } = nextRandomPlayer([]);
    refreshInventory();
    setState({
      phase: 'playing', tier: 'rookie', currentPlayer: player, choices,
      lives: 99, score: 0, streak: 0, bestStreak: 0,
      hintsUsed: 0, hintsRevealed: [], totalAnswered: 0, totalCorrect: 0,
      lastAnswerCorrect: null, selectedAnswer: null, timeLeft: 999,
      usedPlayerIds: usedIds, hintsRemaining: TOTAL_HINTS, xpEarned: 0,
      answerHistory: [], isDailyMode: false, dailyPlayers: [], dailyRound: 0,
      timerPaused: true, isBuzzerMode: true, buzzerTimeLeft: BUZZER_START_TIME,
      buzzerTimeDelta: null, activeSecondChance: false, eliminatedChoices: [],
      gameHintsUsedTotal: 0, prevStreak: 0,
      isMysteryMode: false, mysteryCluesRevealed: 0,
      leveledUp: false, newLevel: xpToLevel(xp), noHintCorrectThisGame: 0, mysteryCompletedThisGame: false,
    });
  }, [clearTimer, clearBuzzerTimer, nextRandomPlayer, refreshInventory, xp]);

  const startMysteryMode = useCallback(() => {
    clearTimer();
    clearBuzzerTimer();
    SFX.start();
    const { player, choices, usedIds } = nextRandomPlayer([]);
    refreshInventory();
    setState({
      phase: 'playing', tier: 'allstar', currentPlayer: player, choices,
      lives: INITIAL_LIVES, score: 0, streak: 0, bestStreak: 0,
      hintsUsed: 0, hintsRevealed: [], totalAnswered: 0, totalCorrect: 0,
      lastAnswerCorrect: null, selectedAnswer: null, timeLeft: 999,
      usedPlayerIds: usedIds, hintsRemaining: TOTAL_HINTS, xpEarned: 0,
      answerHistory: [], isDailyMode: false, dailyPlayers: [], dailyRound: 0,
      timerPaused: false, isBuzzerMode: false, buzzerTimeLeft: BUZZER_START_TIME,
      buzzerTimeDelta: null, activeSecondChance: false, eliminatedChoices: [],
      gameHintsUsedTotal: 0, prevStreak: 0,
      isMysteryMode: true, mysteryCluesRevealed: 0,
      leveledUp: false, newLevel: xpToLevel(xp), noHintCorrectThisGame: 0, mysteryCompletedThisGame: false,
    });
  }, [clearTimer, clearBuzzerTimer, nextRandomPlayer, refreshInventory, xp]);

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
      phase: 'playing', tier: 'rookie', currentPlayer: firstPlayer, choices,
      lives: 99, score: 0, streak: 0, bestStreak: 0,
      hintsUsed: 0, hintsRevealed: [], totalAnswered: 0, totalCorrect: 0,
      lastAnswerCorrect: null, selectedAnswer: null, timeLeft: 15,
      usedPlayerIds: [firstPlayer.id], hintsRemaining: TOTAL_HINTS, xpEarned: 0,
      answerHistory: [], isDailyMode: true, dailyPlayers, dailyRound: 0,
      timerPaused: true, isBuzzerMode: false, buzzerTimeLeft: BUZZER_START_TIME,
      buzzerTimeDelta: null, activeSecondChance: false, eliminatedChoices: [],
      gameHintsUsedTotal: 0, prevStreak: 0,
      isMysteryMode: false, mysteryCluesRevealed: 0,
      leveledUp: false, newLevel: xpToLevel(xp), noHintCorrectThisGame: 0, mysteryCompletedThisGame: false,
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
        try {
          const dist = JSON.parse(localStorage.getItem('sg_guess_distribution') || '{}');
          const key = String(prev.hintsRevealed.length);
          dist[key] = (dist[key] || 0) + 1;
          localStorage.setItem('sg_guess_distribution', JSON.stringify(dist));
        } catch {}
        // Track era stats
        try {
          const era = getPlayerEra(prev.currentPlayer!);
          const eraStats = JSON.parse(localStorage.getItem('sg_era_stats') || '{}');
          if (!eraStats[era]) eraStats[era] = { correct: 0, total: 0 };
          eraStats[era].correct += 1;
          eraStats[era].total += 1;
          localStorage.setItem('sg_era_stats', JSON.stringify(eraStats));
        } catch {}
      } else {
        SFX.wrong(); hapticError();
        // Track era stats for wrong answers too
        try {
          const era = getPlayerEra(prev.currentPlayer!);
          const eraStats = JSON.parse(localStorage.getItem('sg_era_stats') || '{}');
          if (!eraStats[era]) eraStats[era] = { correct: 0, total: 0 };
          eraStats[era].total += 1;
          localStorage.setItem('sg_era_stats', JSON.stringify(eraStats));
        } catch {}
      }
      const newStreak = correct ? prev.streak + 1 : 0;
      if (newStreak > 0 && newStreak % 3 === 0) { setTimeout(() => SFX.streak(), 300); }

      if (newStreak > 0 && newStreak % 5 === 0) {
        awardRandomPowerUp();
        refreshInventory();
      }

      const streakMultiplier = Math.min(1 + Math.floor(prev.streak / 3) * 0.5, 3);
      const hintPenalty = prev.hintsRevealed.length * 20;
      const speedBonus = prev.isBuzzerMode ? 0 : Math.round(prev.timeLeft * 2);
      const mysteryBase = prev.isMysteryMode ? Math.max((3 - prev.mysteryCluesRevealed) * 30, 25) : 0;
      const basePoints = correct
        ? (prev.isMysteryMode ? mysteryBase : Math.max(100 - hintPenalty, 25))
        : 0;
      const points = Math.round(basePoints * streakMultiplier) + (correct && !prev.isMysteryMode ? speedBonus : 0);
      const baseXP = correct ? (newStreak > 3 ? 100 : 50) : 0;
      const roundXP = correct ? Math.max(baseXP - prev.hintsRevealed.length * Math.round(baseXP * 0.15), 10) : 0;
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
        };
      }

      const newLives = prev.isDailyMode ? prev.lives : (correct ? prev.lives : prev.lives - 1);
      return {
        ...prev, phase: 'reveal' as GamePhase,
        lastAnswerCorrect: correct, selectedAnswer: playerId,
        score: prev.score + points, streak: newStreak,
        bestStreak: Math.max(prev.bestStreak, newStreak),
        totalAnswered: prev.totalAnswered + 1,
        totalCorrect: prev.totalCorrect + (correct ? 1 : 0),
        lives: newLives, xpEarned: prev.xpEarned + roundXP,
        answerHistory: [...prev.answerHistory, { correct, hintsUsed: prev.hintsRevealed.length }],
        buzzerTimeDelta: null,
        prevStreak: prev.streak,
        noHintCorrectThisGame: prev.noHintCorrectThisGame + (noHintCorrect ? 1 : 0),
        mysteryCluesRevealed: 0, // reset for next round in mystery mode
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
      try {
        const dist = JSON.parse(localStorage.getItem('sg_guess_distribution') || '{}');
        dist['timeout'] = (dist['timeout'] || 0) + 1;
        localStorage.setItem('sg_guess_distribution', JSON.stringify(dist));
      } catch {}
      // Track era stats for timeout
      try {
        const era = getPlayerEra(prev.currentPlayer!);
        const eraStats = JSON.parse(localStorage.getItem('sg_era_stats') || '{}');
        if (!eraStats[era]) eraStats[era] = { correct: 0, total: 0 };
        eraStats[era].total += 1;
        localStorage.setItem('sg_era_stats', JSON.stringify(eraStats));
      } catch {}

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
          const result = {
            score: prev.score,
            answers: prev.answerHistory.map(a => a.correct),
            answerDetails: prev.answerHistory,
            players: prev.dailyPlayers.map(p => p.name),
            date: getDailySeed(),
          };
          saveDailyResult(result);
          const newXP = xp + prev.xpEarned;
          const prevLevel = xpToLevel(xp);
          const newLevel = xpToLevel(newXP);
          setXP(newXP);
          localStorage.setItem('sg_xp', String(newXP));

          // Save daily mode to history
          const entry = { score: prev.score, tier: 'daily', date: new Date().toISOString(), streak: prev.bestStreak, answerHistory: prev.answerHistory };
          const newHistory = [entry, ...scoreHistory].slice(0, 50);
          setScoreHistory(newHistory);
          localStorage.setItem('sg_history', JSON.stringify(newHistory));

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
          
        };
      }

      if (prev.lives <= 0) {
        SFX.gameOver();
        const newXP = xp + prev.xpEarned;
        const prevLevel = xpToLevel(xp);
        const newLevel = xpToLevel(newXP);
        setXP(newXP);
        localStorage.setItem('sg_xp', String(newXP));

        const tierHighScore = highScores[prev.tier] || 0;
        if (prev.score > tierHighScore) {
          const newHS = { ...highScores, [prev.tier]: prev.score };
          setHighScores(newHS);
          localStorage.setItem('sg_highscores', JSON.stringify(newHS));
        }

        const entry = { score: prev.score, tier: prev.tier, date: new Date().toISOString(), streak: prev.bestStreak, answerHistory: prev.answerHistory };
        const newHistory = [entry, ...scoreHistory].slice(0, 50);
        setScoreHistory(newHistory);
        localStorage.setItem('sg_history', JSON.stringify(newHistory));

        return {
          ...prev, phase: 'gameover' as GamePhase,
          leveledUp: newLevel > prevLevel,
          newLevel,
        };
      }

      const { player, choices, usedIds } = nextPlayer(prev.tier, prev.usedPlayerIds);
      return {
        ...prev, phase: 'playing' as GamePhase,
        currentPlayer: player, choices,
        lastAnswerCorrect: null, selectedAnswer: null,
        hintsRevealed: [], timeLeft: TIER_CONFIG[prev.tier].timerSeconds,
        usedPlayerIds: usedIds, timerPaused: true,
        eliminatedChoices: [], activeSecondChance: false,
        mysteryCluesRevealed: 0,
      };
    });
  }, [xp, highScores, scoreHistory, nextPlayer]);

  const useHint = useCallback(() => {
    setState(prev => {
      if (prev.hintsRemaining <= 0 || !prev.currentPlayer) return prev;
      SFX.hint();
      hapticLight();
      const hintOrder = ['position', 'number', 'team'];
      const nextHint = hintOrder.find(h => !prev.hintsRevealed.includes(h));
      if (!nextHint) return prev;
      return {
        ...prev,
        hintsRevealed: [...prev.hintsRevealed, nextHint],
        hintsRemaining: prev.hintsRemaining - 1,
        hintsUsed: prev.hintsUsed + 1,
        gameHintsUsedTotal: prev.gameHintsUsedTotal + 1,
      };
    });
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

      if (state.isBuzzerMode) {
        const newXP = xp + state.xpEarned;
        const prevLevel = xpToLevel(xp);
        const newLevel = xpToLevel(newXP);
        setXP(newXP);
        localStorage.setItem('sg_xp', String(newXP));

        const buzzerHS = highScores['buzzer'] || 0;
        if (state.score > buzzerHS) {
          const newHS = { ...highScores, buzzer: state.score };
          setHighScores(newHS);
          localStorage.setItem('sg_highscores', JSON.stringify(newHS));
        }

        const entry = { score: state.score, tier: 'buzzer', date: new Date().toISOString(), streak: state.bestStreak, answerHistory: state.answerHistory };
        const newHistory = [entry, ...scoreHistory].slice(0, 50);
        setScoreHistory(newHistory);
        localStorage.setItem('sg_history', JSON.stringify(newHistory));

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
    revealNextClue,
    setVideoReady,
    submitAnswer,
    continueGame,
    useHint,
    goHome,
    setTier,
    handleUsePowerUp,
    clearNewAchievements,
  };
}
