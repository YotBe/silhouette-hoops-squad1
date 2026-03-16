// @ts-nocheck
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  Dimensions, Share, Alert, TextInput, Animated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Video, ResizeMode } from 'expo-av';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { useGameState } from '@/hooks/useGameState';
import { TIER_CONFIG, DifficultyTier } from '@/data/players';
import { isDailyChallengeCompleted, getDailyResult, getTimeUntilNextChallenge, getDailyChallengeNumber } from '@/utils/dailyChallenge';
import { levelProgress } from '@/utils/levels';
import { storage } from '@/utils/storage';

const C = {
  primary: '#4f8ef7',
  accent: '#fb923c',
  gameGold: '#fbbf24',
  gameCorrect: '#34d399',
  gameWrong: '#f87171',
  background: '#03060f',
  foreground: '#f8fafc',
  mutedForeground: '#6b7280',
  card: '#0c1525',
  secondary: '#162032',
  border: 'rgba(255,255,255,0.09)',
  purple: '#c084fc',
};

const { width: SCREEN_W } = Dimensions.get('window');

const HEAT_LEVELS = ['🥶', '🔥', '🔥🔥', '🔥🔥🔥', '👑'];
const HEAT_COLORS = ['#60a5fa', '#f97316', '#ef4444', '#dc2626', '#f59e0b'];
const CONFETTI_COLORS = [C.primary, C.accent, C.gameGold, C.gameCorrect, '#a855f7', '#ec4899', '#06b6d4', '#84cc16'];

// ─── Helpers ─────────────────────────────────────────────────────────────────


function getStoredName(): string {
  return storage.getItem('sg_player_name') || '';
}

// ─── VideoPlayer ─────────────────────────────────────────────────────────────

function VideoPlayer({ videoFile, imageUrl, onReady }: {
  videoFile: string;
  imageUrl?: string;
  onReady?: () => void;
}) {
  const [useFallback, setUseFallback] = useState(false);
  const [showPlaceholder, setShowPlaceholder] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const readyFired = useRef(false);
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const shimmerLoop = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    // Start shimmer pulse while loading
    shimmerLoop.current = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(shimmerAnim, { toValue: 0.3, duration: 700, useNativeDriver: true }),
      ])
    );
    shimmerLoop.current.start();
    return () => shimmerLoop.current?.stop();
  }, [videoFile]);

  const fireReady = useCallback(() => {
    if (!readyFired.current) {
      readyFired.current = true;
      setLoaded(true);
      shimmerLoop.current?.stop();
      shimmerAnim.setValue(1);
      onReady?.();
    }
  }, [onReady]);

  useEffect(() => {
    readyFired.current = false;
    setUseFallback(false);
    setShowPlaceholder(false);
    setLoaded(false);
  }, [videoFile]);

  return (
    <View style={styles.videoContainer}>
      {/* Shimmer overlay while loading */}
      {!loaded && !showPlaceholder && (
        <Animated.View
          style={[StyleSheet.absoluteFillObject, styles.shimmerOverlay, { opacity: shimmerAnim }]}
          pointerEvents="none"
        />
      )}

      {showPlaceholder ? (
        <View style={styles.placeholderCenter}>
          <Text style={{ fontSize: 48, opacity: 0.3 }}>🏀</Text>
          <Text style={[styles.mutedText, { marginTop: 8, letterSpacing: 2 }]}>MYSTERY PLAYER</Text>
        </View>
      ) : useFallback && imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={StyleSheet.absoluteFillObject}
          contentFit="cover"
          onLoad={fireReady}
          onError={() => { setShowPlaceholder(true); fireReady(); }}
        />
      ) : (
        <Video
          source={{ uri: videoFile }}
          style={StyleSheet.absoluteFillObject}
          resizeMode={ResizeMode.COVER}
          shouldPlay
          isLooping
          isMuted
          onReadyForDisplay={fireReady}
          onError={() => {
            if (imageUrl) setUseFallback(true);
            else { setShowPlaceholder(true); fireReady(); }
          }}
        />
      )}
      {/* Bottom fade */}
      <View style={styles.videoFade} pointerEvents="none" />
    </View>
  );
}

// ─── ConfettiBlast ────────────────────────────────────────────────────────────

const CONFETTI_COUNT = 22;

function ConfettiBlast({ active }: { active: boolean }) {
  const particles = useRef(
    Array.from({ length: CONFETTI_COUNT }, (_, i) => {
      const angle = (i / CONFETTI_COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      return {
        angle,
        dist: 55 + Math.random() * 90,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        size: 5 + Math.random() * 5,
        anim: new Animated.ValueXY({ x: 0, y: 0 }),
        opacity: new Animated.Value(0),
        scale: new Animated.Value(0),
      };
    })
  ).current;

  const prevActive = useRef(false);

  useEffect(() => {
    if (active && !prevActive.current) {
      prevActive.current = true;
      particles.forEach((p) => {
        p.anim.setValue({ x: 0, y: 0 });
        p.opacity.setValue(1);
        p.scale.setValue(0);
        const dx = Math.cos(p.angle) * p.dist;
        const dy = Math.sin(p.angle) * p.dist - 20;
        Animated.parallel([
          Animated.timing(p.anim, { toValue: { x: dx, y: dy }, duration: 520, useNativeDriver: true }),
          Animated.spring(p.scale, { toValue: 1, tension: 220, friction: 7, useNativeDriver: true }),
          Animated.sequence([
            Animated.delay(300),
            Animated.timing(p.opacity, { toValue: 0, duration: 220, useNativeDriver: true }),
          ]),
        ]).start();
      });
    } else if (!active) {
      prevActive.current = false;
    }
  }, [active]);

  if (!active) return null;

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {particles.map((p, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            left: SCREEN_W / 2 - p.size / 2,
            top: '50%',
            width: p.size,
            height: p.size,
            borderRadius: p.size / 2,
            backgroundColor: p.color,
            opacity: p.opacity,
            transform: [{ translateX: p.anim.x }, { translateY: p.anim.y }, { scale: p.scale }],
          }}
        />
      ))}
    </View>
  );
}

// ─── HomeScreen ───────────────────────────────────────────────────────────────

function HomeScreen({ game }: { game: ReturnType<typeof useGameState> }) {
  const [playerName, setPlayerName] = useState(getStoredName);
  const [editingName, setEditingName] = useState(() => !getStoredName());
  const [nameInput, setNameInput] = useState(getStoredName);
  const [countdown, setCountdown] = useState(getTimeUntilNextChallenge());
  const dailyCompleted = isDailyChallengeCompleted();
  const dailyResult = getDailyResult();
  const dailyNum = getDailyChallengeNumber();
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  const lvl = levelProgress(game.xp);
  const endlessHS = game.highScores[game.tier] || 0;
  const buzzerHS = game.highScores['buzzer'] || 0;

  // Animate XP bar fill
  const xpBarAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(xpBarAnim, { toValue: lvl.pct / 100, duration: 800, useNativeDriver: false }).start();
  }, [lvl.pct]);

  useEffect(() => {
    const interval = setInterval(() => setCountdown(getTimeUntilNextChallenge()), 1000);
    return () => clearInterval(interval);
  }, []);

  const saveName = () => {
    const trimmed = nameInput.trim().slice(0, 20);
    if (!trimmed) return;
    setPlayerName(trimmed);
    setNameInput(trimmed);
    storage.setItem('sg_player_name', trimmed);
    setEditingName(false);
  };

  return (
    <ScrollView
      style={styles.homeScroll}
      contentContainerStyle={styles.homeContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Top bar */}
      <View style={styles.topBar}>
        <View />
        <View style={styles.topBarRight}>
          <TouchableOpacity onPress={game.toggleMute} style={styles.iconBtn}>
            <Ionicons name={game.isMuted ? 'volume-mute' : 'volume-high'} size={18} color={C.mutedForeground} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Player name */}
      {editingName ? (
        <View style={styles.nameEditRow}>
          <TextInput
            style={styles.nameInput}
            value={nameInput}
            onChangeText={setNameInput}
            placeholder="Enter your name..."
            placeholderTextColor={C.mutedForeground}
            maxLength={20}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={saveName}
          />
          <TouchableOpacity
            onPress={saveName}
            disabled={!nameInput.trim()}
            style={[styles.saveBtn, !nameInput.trim() && { opacity: 0.4 }]}
          >
            <Text style={styles.saveBtnText}>Save</Text>
          </TouchableOpacity>
          {playerName ? (
            <TouchableOpacity onPress={() => setEditingName(false)} style={styles.iconBtn}>
              <Ionicons name="close" size={18} color={C.mutedForeground} />
            </TouchableOpacity>
          ) : null}
        </View>
      ) : (
        <View style={styles.nameRow}>
          <View>
            <Text style={styles.welcomeBack}>WELCOME BACK</Text>
            <Text style={styles.playerNameText}>{playerName || 'Player'} 👋</Text>
          </View>
          <TouchableOpacity onPress={() => { setNameInput(playerName); setEditingName(true); }} style={styles.iconBtn}>
            <Ionicons name="pencil" size={16} color={C.mutedForeground} />
          </TouchableOpacity>
        </View>
      )}

      {/* Logo area */}
      <View style={styles.logoArea}>
        <Text style={styles.logoEmoji}>🏀</Text>
        <Text style={styles.logoTitle}>WHO IS IT?</Text>
        <Text style={styles.logoSubtitle}>Guess the NBA player · Can you spot them?</Text>
        <View style={styles.dailyRow}>
          <Text style={styles.dailyDate}>{today}</Text>
          <Text style={styles.dailyNum}> · DAILY #{dailyNum}</Text>
        </View>
      </View>

      {/* Level + XP — animated bar */}
      <View style={styles.xpContainer}>
        <View style={styles.xpHeader}>
          <Text style={[styles.levelText, { color: C.gameGold }]}>LEVEL {lvl.level}</Text>
          <Text style={styles.mutedText}>⭐ {game.xp} XP</Text>
          <Text style={styles.mutedText}>{lvl.nextLevelXP - game.xp} to Lvl {lvl.level + 1}</Text>
        </View>
        <View style={styles.xpBarBg}>
          <Animated.View style={[styles.xpBarFill, {
            width: xpBarAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] })
          }]} />
        </View>
      </View>

      {/* Tier Selector */}
      <View style={styles.tierSection}>
        <Text style={styles.sectionLabel}>SELECT DIFFICULTY</Text>
        <View style={styles.tierRow}>
          {(Object.keys(TIER_CONFIG) as DifficultyTier[]).map((t) => {
            const cfg = TIER_CONFIG[t];
            const unlocked = game.unlockedTiers.includes(t);
            const isSelected = game.tier === t;
            const tierHS = game.highScores[t] || 0;
            return (
              <TouchableOpacity
                key={t}
                onPress={() => unlocked && game.setTier(t)}
                disabled={!unlocked}
                style={[
                  styles.tierBtn,
                  isSelected && unlocked && { borderColor: C.primary, borderWidth: 2, backgroundColor: `${C.primary}15` },
                  !unlocked && { opacity: 0.4 },
                ]}
              >
                {!unlocked && <Ionicons name="lock-closed" size={10} color={C.mutedForeground} style={styles.lockIcon} />}
                <Text style={[styles.tierLabel, { color: unlocked ? (isSelected ? C.primary : C.foreground) : C.mutedForeground }]}>
                  {cfg.label}
                </Text>
                <Text style={styles.tierSecs}>{cfg.timerSeconds}s</Text>
                {tierHS > 0 && <Text style={[styles.tierHS, { color: C.gameGold }]}>🏆{tierHS}</Text>}
                {!unlocked && <Text style={styles.tierXP}>{cfg.xpRequired}xp</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* PLAY button */}
      <TouchableOpacity onPress={() => game.startGame(game.tier)} style={styles.playBtn} activeOpacity={0.85}>
        <Text style={styles.playBtnText}>PLAY {TIER_CONFIG[game.tier].label.toUpperCase()} →</Text>
      </TouchableOpacity>
      {endlessHS > 0 && (
        <Text style={[styles.mutedText, { textAlign: 'center', marginBottom: 12, color: C.gameGold }]}>
          🏆 Best ({TIER_CONFIG[game.tier].label}): {endlessHS}
        </Text>
      )}

      {/* Game modes */}
      <View style={styles.modesList}>

        {/* Daily Challenge */}
        <TouchableOpacity
          onPress={() => !dailyCompleted && game.startDailyChallenge()}
          disabled={dailyCompleted}
          style={[styles.modeCard, { borderColor: dailyCompleted ? `${C.gameCorrect}50` : `${C.primary}40` }]}
          activeOpacity={0.85}
        >
          <View style={[styles.modeIcon, { backgroundColor: dailyCompleted ? `${C.gameCorrect}20` : `${C.primary}20` }]}>
            <Ionicons name="calendar" size={22} color={dailyCompleted ? C.gameCorrect : C.primary} />
          </View>
          <View style={styles.modeInfo}>
            <Text style={styles.modeTitle}>DAILY CHALLENGE</Text>
            {dailyCompleted ? (
              <Text style={[styles.modeDesc, { color: C.gameCorrect }]}>
                ✓ Completed · Score: {dailyResult?.score ?? 0}
              </Text>
            ) : (
              <Text style={styles.modeDesc}>3 players · 1 attempt · resets daily</Text>
            )}
          </View>
          {dailyCompleted ? (
            <Text style={[styles.mutedText, { color: C.gameGold }]}>{countdown.hours}h {String(countdown.minutes).padStart(2, '0')}m</Text>
          ) : (
            <Ionicons name="chevron-forward" size={16} color={`${C.primary}99`} />
          )}
        </TouchableOpacity>

        {/* Buzzer Beater */}
        <TouchableOpacity onPress={game.startBuzzerBeater} style={[styles.modeCard, { borderColor: `${C.accent}40` }]} activeOpacity={0.85}>
          <View style={[styles.modeIcon, { backgroundColor: `${C.accent}20` }]}>
            <Ionicons name="timer" size={22} color={C.accent} />
          </View>
          <View style={styles.modeInfo}>
            <Text style={styles.modeTitle}>BUZZER BEATER</Text>
            <Text style={styles.modeDesc}>60s survival · correct +3s · wrong −5s</Text>
          </View>
          {buzzerHS > 0 && <Text style={[styles.mutedText, { color: C.gameGold }]}>🏆 {buzzerHS}</Text>}
          <Ionicons name="chevron-forward" size={16} color={`${C.accent}99`} />
        </TouchableOpacity>

        {/* Mystery Mode */}
        <TouchableOpacity onPress={game.startMysteryMode} style={[styles.modeCard, { borderColor: `${C.purple}40` }]} activeOpacity={0.85}>
          <View style={[styles.modeIcon, { backgroundColor: `${C.purple}20` }]}>
            <Text style={{ fontSize: 22 }}>🔮</Text>
          </View>
          <View style={styles.modeInfo}>
            <Text style={styles.modeTitle}>MYSTERY MODE</Text>
            <Text style={styles.modeDesc}>Clues only — no video · pure knowledge</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={`${C.purple}99`} />
        </TouchableOpacity>

        {/* Heat Check */}
        <TouchableOpacity onPress={game.startHeatCheckMode} style={[styles.modeCard, { borderColor: `${C.accent}50` }]} activeOpacity={0.85}>
          <View style={[styles.modeIcon, { backgroundColor: `${C.accent}20` }]}>
            <Text style={{ fontSize: 22 }}>🔥</Text>
          </View>
          <View style={styles.modeInfo}>
            <View style={styles.modeTitleRow}>
              <Text style={styles.modeTitle}>HEAT CHECK</Text>
              <View style={styles.newBadge}><Text style={styles.newBadgeText}>NEW</Text></View>
            </View>
            <Text style={styles.modeDesc}>Get hot · difficulty climbs · 5 heat levels</Text>
            <Text style={[styles.modeDesc, { marginTop: 2 }]}>🥶 → 🔥 → 🔥🔥 → 🔥🔥🔥 → 👑</Text>
          </View>
          {(game.highScores['heatcheck'] ?? 0) > 0 && (
            <Text style={[styles.mutedText, { color: C.gameGold }]}>🏆 {game.highScores['heatcheck']}</Text>
          )}
          <Ionicons name="chevron-forward" size={16} color={`${C.accent}99`} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// ─── GameScreen ───────────────────────────────────────────────────────────────

const CORRECT_HYPE = ['BUCKETS!', 'TOO EASY!', 'LOCK IN!', 'GOATED!', 'SPLASH!', 'CAUGHT 4K!', 'AUTOMATIC!', 'ICE COLD!', 'TORCH!'];
const WRONG_HYPE = ['BRICKED!', 'CAUGHT LACKIN!', 'DO YOUR RESEARCH!', 'GET COOKED!', 'YIKES!', 'NOT EVEN CLOSE!'];

function GameScreen({ game }: { game: ReturnType<typeof useGameState> }) {
  const insets = useSafeAreaInsets();
  const { currentPlayer, choices, lives, score, streak, timeLeft, hintsRevealed, hintsRemaining,
    tier, isMuted, isDailyMode, isBuzzerMode, buzzerTimeLeft, buzzerTimeDelta,
    powerUpInventory, activeSecondChance, eliminatedChoices,
    isMysteryMode, mysteryCluesRevealed, isHeatCheckMode, heatLevel } = game;

  if (!currentPlayer) return null;

  const config = TIER_CONFIG[tier];
  const maxTime = isDailyMode ? 15 : config.timerSeconds;
  const timerPct = timeLeft / maxTime;

  const [imageReady, setImageReady] = useState(false);
  const [answeredId, setAnsweredId] = useState<string | null>(null);
  const [feedbackState, setFeedbackState] = useState<'correct' | 'wrong' | null>(null);
  const [hypeText, setHypeText] = useState<string | null>(null);
  const [scoreFloat, setScoreFloat] = useState<{ pts: number; speedBonus: number } | null>(null);
  const [deltaFlash, setDeltaFlash] = useState<number | null>(null);
  const [confettiActive, setConfettiActive] = useState(false);
  const [displayScore, setDisplayScore] = useState(score);

  // Score float upward animation
  const scoreFloatY = useRef(new Animated.Value(0)).current;
  const scoreFloatOpacity = useRef(new Animated.Value(1)).current;

  // Hype text scale animation
  const hypeScale = useRef(new Animated.Value(0.5)).current;
  const hypeOpacity = useRef(new Animated.Value(0)).current;

  // Answer card stagger + press animations
  const cardAnims = useRef([0, 1, 2, 3].map(() => new Animated.Value(0))).current;
  const pressAnims = useRef([0, 1, 2, 3].map(() => new Animated.Value(1))).current;

  // Answer grid shake (wrong answer)
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Streak pulse
  const streakScale = useRef(new Animated.Value(1)).current;
  const prevStreak = useRef(streak);

  // Timer bar animated width
  const timerBarAnim = useRef(new Animated.Value(timerPct)).current;

  useEffect(() => {
    Animated.timing(timerBarAnim, { toValue: timerPct, duration: 250, useNativeDriver: false }).start();
  }, [timerPct]);

  // Score count-up when score changes
  useEffect(() => {
    const diff = score - displayScore;
    if (diff === 0) return;
    const steps = Math.min(Math.abs(diff), 20);
    let step = 0;
    const start = displayScore;
    const tick = setInterval(() => {
      step++;
      setDisplayScore(Math.round(start + (diff * step) / steps));
      if (step >= steps) { clearInterval(tick); setDisplayScore(score); }
    }, 22);
    return () => clearInterval(tick);
  }, [score]);

  // Streak pulse
  useEffect(() => {
    if (streak > prevStreak.current && streak >= 2) {
      streakScale.setValue(1.6);
      Animated.spring(streakScale, { toValue: 1, tension: 300, friction: 8, useNativeDriver: true }).start();
    }
    prevStreak.current = streak;
  }, [streak]);

  const handleVideoReady = useCallback(() => {
    setImageReady(true);
    game.setVideoReady();
  }, [game.setVideoReady]);

  // Stagger answer cards in when ready
  useEffect(() => {
    if (imageReady) {
      Animated.stagger(55, cardAnims.map(anim =>
        Animated.spring(anim, { toValue: 1, tension: 110, friction: 9, useNativeDriver: true })
      )).start();
    } else {
      cardAnims.forEach(a => a.setValue(0));
    }
  }, [imageReady, currentPlayer.id]);

  // For mystery mode: no video to wait for — auto-ready immediately
  useEffect(() => {
    setImageReady(false);
    setAnsweredId(null);
    setFeedbackState(null);
    if (isMysteryMode) {
      const t = setTimeout(() => {
        setImageReady(true);
        game.setVideoReady();
      }, 50);
      return () => clearTimeout(t);
    }
  }, [currentPlayer.id, isMysteryMode]);

  useEffect(() => {
    if (buzzerTimeDelta != null) {
      setDeltaFlash(buzzerTimeDelta);
      const t = setTimeout(() => setDeltaFlash(null), 800);
      return () => clearTimeout(t);
    }
  }, [buzzerTimeDelta, currentPlayer.id]);

  // Animate score float
  useEffect(() => {
    if (scoreFloat) {
      scoreFloatY.setValue(0);
      scoreFloatOpacity.setValue(1);
      Animated.parallel([
        Animated.timing(scoreFloatY, { toValue: -50, duration: 700, useNativeDriver: true }),
        Animated.sequence([
          Animated.delay(300),
          Animated.timing(scoreFloatOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
        ]),
      ]).start();
    }
  }, [scoreFloat]);

  // Animate hype text
  useEffect(() => {
    if (hypeText) {
      hypeScale.setValue(0.5);
      hypeOpacity.setValue(0);
      Animated.parallel([
        Animated.spring(hypeScale, { toValue: 1, tension: 200, friction: 7, useNativeDriver: true }),
        Animated.timing(hypeOpacity, { toValue: 1, duration: 80, useNativeDriver: true }),
      ]).start();
    }
  }, [hypeText]);

  const handleAnswer = useCallback((playerId: string) => {
    if (!imageReady || eliminatedChoices.includes(playerId) || answeredId) return;
    const isCorrect = playerId === currentPlayer.id;
    setFeedbackState(isCorrect ? 'correct' : 'wrong');
    setAnsweredId(playerId);
    const pool = isCorrect ? CORRECT_HYPE : WRONG_HYPE;
    setHypeText(pool[Math.floor(Math.random() * pool.length)]);
    setTimeout(() => setHypeText(null), isBuzzerMode ? 500 : 900);
    if (isCorrect) {
      const sm = Math.min(1 + Math.floor(streak / 3) * 0.5, 3);
      const hp = hintsRevealed.length * 20;
      const basePts = Math.round(Math.max(100 - hp, 25) * sm);
      const speedBonus = isBuzzerMode ? 0 : Math.round(timeLeft * 2);
      setScoreFloat({ pts: basePts + speedBonus, speedBonus });
      // Confetti burst
      setConfettiActive(true);
      setTimeout(() => setConfettiActive(false), 600);
    } else {
      // Shake the answer grid
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 9, duration: 55, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -9, duration: 55, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 7, duration: 45, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -5, duration: 45, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 35, useNativeDriver: true }),
      ]).start();
    }
    setTimeout(() => {
      setFeedbackState(null); setScoreFloat(null); setAnsweredId(null);
      game.submitAnswer(playerId);
    }, isBuzzerMode ? 150 : 600);
  }, [imageReady, eliminatedChoices, answeredId, currentPlayer.id, streak, hintsRevealed.length, timeLeft, game.submitAnswer, isBuzzerMode]);

  const timerColor = timerPct > 0.5 ? C.primary : timerPct > 0.25 ? C.gameGold : C.gameWrong;
  const heatColor = isHeatCheckMode ? HEAT_COLORS[Math.min(heatLevel ?? 0, 4)] : C.accent;

  const hintData = [
    { key: 'position', icon: '📍', label: 'POS', value: currentPlayer.position },
    { key: 'number', icon: '#️⃣', label: 'NUM', value: `#${currentPlayer.number}` },
    { key: 'team', icon: '🏟️', label: 'TEAM', value: currentPlayer.team },
  ];

  return (
    <View style={[styles.gameContainer, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Background glow */}
      <View style={[styles.bgGlow, { opacity: 0.12 }]} pointerEvents="none" />

      {/* Feedback flash overlay */}
      {feedbackState && (
        <View
          style={[StyleSheet.absoluteFillObject, styles.feedbackOverlay, { borderColor: feedbackState === 'correct' ? C.gameCorrect : C.gameWrong }]}
          pointerEvents="none"
        />
      )}

      {/* Hype text with scale bounce */}
      {hypeText && (
        <Animated.View
          style={[styles.hypeContainer, { opacity: hypeOpacity, transform: [{ scale: hypeScale }] }]}
          pointerEvents="none"
        >
          <Text style={[styles.hypeText, { color: feedbackState === 'correct' ? C.gameCorrect : C.gameWrong }]}>
            {hypeText}
          </Text>
        </Animated.View>
      )}

      {/* Score float — animates upward */}
      {scoreFloat && (
        <Animated.View
          style={[styles.scoreFloat, { opacity: scoreFloatOpacity, transform: [{ translateY: scoreFloatY }] }]}
          pointerEvents="none"
        >
          <Text style={[styles.scoreFloatText, { color: C.gameGold }]}>+{scoreFloat.pts}</Text>
          {scoreFloat.speedBonus > 0 && (
            <Text style={[styles.scoreFloatSub, { color: C.primary }]}>⚡ +{scoreFloat.speedBonus} speed</Text>
          )}
        </Animated.View>
      )}

      {/* HUD */}
      <View style={styles.hud}>
        <TouchableOpacity onPress={game.goHome} style={styles.hudBtn}>
          <Ionicons name="close" size={22} color={C.mutedForeground} />
        </TouchableOpacity>

        <View style={styles.hudCenter}>
          {isBuzzerMode ? (
            <View style={styles.hudTimer}>
              <Ionicons name="timer" size={14} color={buzzerTimeLeft <= 5 ? C.gameWrong : buzzerTimeLeft <= 10 ? C.gameGold : C.primary} />
              <Text style={[styles.hudTimerText, { color: buzzerTimeLeft <= 5 ? C.gameWrong : buzzerTimeLeft <= 10 ? C.gameGold : C.foreground }]}>
                {buzzerTimeLeft}s
              </Text>
              {deltaFlash != null && (
                <Text style={{ color: deltaFlash > 0 ? C.gameCorrect : C.gameWrong, fontSize: 13, fontWeight: 'bold', marginLeft: 2 }}>
                  {deltaFlash > 0 ? `+${deltaFlash}s` : `${deltaFlash}s`}
                </Text>
              )}
            </View>
          ) : (
            <Text style={[styles.timerNum, { color: timerColor }]}>
              {imageReady ? timeLeft : '…'}
            </Text>
          )}
        </View>

        <View style={styles.hudRight}>
          <Text style={[styles.hudScore, { color: C.accent }]}>{displayScore}</Text>
          <Text style={styles.mutedText}>pts</Text>
        </View>

        {!isBuzzerMode && !isDailyMode && (
          <View style={styles.hudLives}>
            {Array.from({ length: 3 }).map((_, i) => (
              <Text key={i} style={{ fontSize: 14, opacity: i < lives ? 1 : 0.2 }}>🏀</Text>
            ))}
          </View>
        )}

        {/* Streak — pulses when it grows */}
        <Animated.View style={[styles.hudStreak, { transform: [{ scale: streakScale }] }]}>
          <Text style={[styles.hudStreakText, { color: streak >= 2 ? C.accent : C.mutedForeground }]}>
            {streak >= 2 ? `${streak}🔥` : `×${streak}`}
          </Text>
        </Animated.View>

        {/* Heat level badge */}
        {isHeatCheckMode && heatLevel != null && (
          <View style={[styles.heatBadge, { borderColor: `${heatColor}60`, backgroundColor: `${heatColor}15` }]}>
            <Text style={{ fontSize: 13 }}>{HEAT_LEVELS[Math.min(heatLevel, 4)]}</Text>
          </View>
        )}

        <TouchableOpacity onPress={game.toggleMute} style={styles.hudBtn}>
          <Ionicons name={isMuted ? 'volume-mute' : 'volume-high'} size={16} color={C.mutedForeground} />
        </TouchableOpacity>
      </View>

      {/* Timer bar — full width, outside HUD */}
      {!isBuzzerMode && imageReady && (
        <View style={styles.timerBarTrack}>
          <Animated.View style={[styles.timerBarFill, {
            backgroundColor: timerColor,
            width: timerBarAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
          }]} />
        </View>
      )}

      {/* Confetti */}
      <ConfettiBlast active={confettiActive} />

      {/* Daily round progress */}
      {isDailyMode && game.dailyPlayers?.length > 0 && (
        <View style={styles.dailyProgressRow}>
          {game.dailyPlayers.map((_: any, i: number) => (
            <View
              key={i}
              style={[
                styles.dailyDot,
                i < game.dailyRound
                  ? { backgroundColor: C.gameCorrect }
                  : i === game.dailyRound
                  ? { backgroundColor: C.primary, transform: [{ scale: 1.3 }] }
                  : { backgroundColor: C.secondary },
              ]}
            />
          ))}
        </View>
      )}

      {/* Protection badge */}
      {activeSecondChance && (
        <View style={styles.badgeRow}>
          <View style={styles.badge}><Text style={[styles.badgeText, { color: C.primary }]}>🛡️ Protected</Text></View>
        </View>
      )}

      {/* Video / Mystery */}
      <View style={styles.mediaContainer}>
        {isMysteryMode ? (
          <View style={styles.mysteryCard}>
            <Text style={[styles.mysteryTitle, { color: C.purple }]}>🔮 MYSTERY MODE</Text>
            <View style={styles.clueList}>
              {Array.from({ length: mysteryCluesRevealed + 1 }).map((_, i) => {
                const clues = [
                  { icon: '📍', label: 'POSITION', value: currentPlayer.position },
                  { icon: '#️⃣', label: 'NUMBER', value: `#${currentPlayer.number}` },
                  { icon: '🏟️', label: 'TEAM', value: currentPlayer.team },
                  { icon: '📅', label: 'ERA', value: (currentPlayer as any).era || 'Modern' },
                ];
                const clue = clues[i];
                if (!clue) return null;
                return (
                  <View key={i} style={styles.clueChip}>
                    <Text style={styles.clueChipIcon}>{clue.icon}</Text>
                    <Text style={styles.clueChipLabel}>{clue.label}</Text>
                    <Text style={styles.clueChipValue}>{clue.value}</Text>
                  </View>
                );
              })}
            </View>
            {mysteryCluesRevealed < 3 && (
              <TouchableOpacity onPress={game.revealNextClue} style={styles.revealClueBtn}>
                <Ionicons name="add-circle-outline" size={16} color={C.purple} />
                <Text style={[styles.revealClueBtnText, { color: C.purple }]}>Reveal Next Clue</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <VideoPlayer
            key={currentPlayer.id}
            videoFile={currentPlayer.videoFile}
            imageUrl={currentPlayer.imageUrl}
            onReady={handleVideoReady}
          />
        )}
      </View>

      {/* Power-ups */}
      <View style={styles.powerUpRow}>
        {([
          { type: 'fiftyFifty' as const, icon: '✂️', label: '50/50', count: powerUpInventory.fiftyFifty },
          { type: 'extraTime' as const, icon: '⏱️', label: '+5s', count: powerUpInventory.extraTime },
          { type: 'secondChance' as const, icon: '🛡️', label: '2nd Life', count: powerUpInventory.secondChance },
        ]).map(({ type, icon, label, count }) => (
          <TouchableOpacity
            key={type}
            onPress={() => imageReady && count > 0 && game.handleUsePowerUp(type)}
            disabled={!imageReady || count <= 0}
            style={[styles.powerUpBtn, (count <= 0 || !imageReady) && { opacity: 0.3 }]}
          >
            <Text style={{ fontSize: 18 }}>{icon}</Text>
            <Text style={[styles.powerUpLabel, { color: C.mutedForeground }]}>{label}</Text>
            <Text style={[styles.powerUpCount, { color: count > 0 ? C.gameGold : C.mutedForeground }]}>×{count}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Hints */}
      <View style={styles.hintsRow}>
        {hintData.map((hint, idx) => {
          const isRevealed = hintsRevealed.includes(hint.key);
          const nextUnlockable = hintData.find(h => !hintsRevealed.includes(h.key));
          const isNext = nextUnlockable?.key === hint.key;
          return (
            <TouchableOpacity
              key={hint.key}
              onPress={() => isNext && !isRevealed && hintsRemaining > 0 && game.useHint()}
              disabled={isRevealed || !isNext || hintsRemaining <= 0}
              style={[
                styles.hintBtn,
                isRevealed && styles.hintBtnRevealed,
                !isRevealed && isNext && styles.hintBtnNext,
                !isRevealed && !isNext && { opacity: 0.3 },
              ]}
            >
              {isRevealed ? (
                <Text style={styles.hintValue}>{hint.icon} {hint.value}</Text>
              ) : (
                <View style={{ alignItems: 'center' }}>
                  <Ionicons name="lock-closed" size={14} color={isNext ? C.primary : C.mutedForeground} />
                  <Text style={styles.hintLabel}>{hint.label}</Text>
                  {isNext && <Text style={[styles.hintCost, { color: C.gameWrong }]}>−20pts</Text>}
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Answer grid — stagger animated, shakes on wrong */}
      <Animated.View style={[styles.answerGrid, { transform: [{ translateX: shakeAnim }] }]}>
        {choices.map((choice, idx) => {
          const isEliminated = eliminatedChoices.includes(choice.id);
          const isAnswered = answeredId !== null;
          const isThis = choice.id === answeredId;
          const isCorrectChoice = choice.id === currentPlayer.id;

          let cardStyle: object = styles.answerCard;
          if (isAnswered && isThis && feedbackState === 'correct') {
            cardStyle = [styles.answerCard, styles.answerCorrect];
          } else if (isAnswered && isThis && feedbackState === 'wrong') {
            cardStyle = [styles.answerCard, styles.answerWrong];
          } else if (isAnswered && feedbackState === 'wrong' && isCorrectChoice) {
            cardStyle = [styles.answerCard, styles.answerCorrect];
          } else if (isAnswered && !isThis) {
            cardStyle = [styles.answerCard, { opacity: 0.2 }];
          } else if (isEliminated) {
            cardStyle = [styles.answerCard, styles.answerEliminated];
          }

          return (
            <Animated.View
              key={choice.id}
              style={{
                width: (SCREEN_W - 40 - 8) / 2,
                opacity: cardAnims[idx],
                transform: [
                  { translateY: cardAnims[idx].interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) },
                  { scale: pressAnims[idx] },
                ],
              }}
            >
              <TouchableOpacity
                onPress={() => handleAnswer(choice.id)}
                onPressIn={() => !answeredId && !isEliminated && Animated.spring(pressAnims[idx], { toValue: 0.94, useNativeDriver: true, tension: 300 }).start()}
                onPressOut={() => Animated.spring(pressAnims[idx], { toValue: 1, useNativeDriver: true, tension: 300 }).start()}
                disabled={!imageReady || isEliminated || !!answeredId}
                style={[cardStyle, { width: '100%' }]}
                activeOpacity={1}
              >
                <View style={styles.answerIndex}>
                  <Text style={styles.answerIndexText}>{idx + 1}</Text>
                </View>
                <Text style={[styles.answerName, isEliminated && { textDecorationLine: 'line-through', color: C.mutedForeground }]}>
                  {choice.name}
                </Text>
                {isAnswered && isThis && feedbackState === 'correct' && (
                  <Ionicons name="checkmark-circle" size={18} color={C.gameCorrect} />
                )}
                {isAnswered && isThis && feedbackState === 'wrong' && (
                  <Ionicons name="close-circle" size={18} color={C.gameWrong} />
                )}
                {isAnswered && feedbackState === 'wrong' && isCorrectChoice && !isThis && (
                  <Ionicons name="checkmark-circle" size={18} color={C.gameCorrect} />
                )}
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </Animated.View>
    </View>
  );
}

// ─── RevealScreen ─────────────────────────────────────────────────────────────

function RevealScreen({ game }: { game: ReturnType<typeof useGameState> }) {
  const { currentPlayer, lastAnswerCorrect, selectedAnswer, choices, lives, score, streak,
    prevStreak, hintsUsed, isDailyMode, dailyRound, dailyPlayers } = game;

  if (!currentPlayer) return null;

  const correct = lastAnswerCorrect ?? false;
  const selectedPlayer = choices.find(c => c.id === selectedAnswer);
  const isLastDaily = isDailyMode && dailyRound >= dailyPlayers.length - 1;
  const [canContinue, setCanContinue] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showImage, setShowImage] = useState(false);
  const [showButton, setShowButton] = useState(false);

  // Entry animations
  const resultScale = useRef(new Animated.Value(0.6)).current;
  const resultOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(resultScale, { toValue: 1, tension: 180, friction: 8, useNativeDriver: true }),
      Animated.timing(resultOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();

    const timers = [
      setTimeout(() => setShowDetails(true), 500),
      setTimeout(() => setShowImage(true), 700),
      setTimeout(() => setShowButton(true), 900),
      setTimeout(() => setCanContinue(true), 1500),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const getButtonText = () => {
    if (isLastDaily) return 'VIEW RESULTS';
    if (lives <= 0) return 'SEE RESULTS';
    return 'NEXT PLAYER →';
  };

  let hash = 0;
  for (let i = 0; i < currentPlayer.id.length; i++) hash = ((hash << 5) - hash) + currentPlayer.id.charCodeAt(i);
  const whoGotItPct = 25 + Math.abs((hash + new Date().getDate()) % 41);

  return (
    <View style={styles.revealContainer}>
      <ScrollView contentContainerStyle={styles.revealContent} showsVerticalScrollIndicator={false}>
        {/* Result with bounce */}
        <Animated.Text
          style={[styles.resultText, { color: correct ? C.gameCorrect : C.gameWrong, opacity: resultOpacity, transform: [{ scale: resultScale }] }]}
        >
          {correct ? 'CORRECT!' : selectedAnswer ? 'WRONG!' : "TIME'S UP!"}
        </Animated.Text>

        {/* Streak */}
        {correct && streak > 2 && (
          <View style={[styles.streakBadge, { backgroundColor: `${C.primary}20`, borderColor: `${C.primary}40` }]}>
            <Ionicons name="flame" size={16} color={C.primary} />
            <Text style={[styles.streakBadgeText, { color: C.primary }]}>STREAK ×{streak} 🔥</Text>
          </View>
        )}
        {!correct && prevStreak >= 2 && (
          <View style={[styles.streakBadge, { backgroundColor: `${C.gameWrong}20`, borderColor: `${C.gameWrong}40` }]}>
            <Text style={[styles.streakBadgeText, { color: C.gameWrong }]}>STREAK BROKEN! Peak: ×{prevStreak} 🔥</Text>
          </View>
        )}
        {!correct && (
          <Text style={[styles.revealSub, { color: C.gameWrong }]}>−1 ❤️</Text>
        )}
        {hintsUsed > 0 && (
          <Text style={styles.mutedText}>Used {hintsUsed} hint{hintsUsed > 1 ? 's' : ''} (−{hintsUsed * 20} pts)</Text>
        )}

        {/* Player name */}
        <Text style={styles.revealPlayerName}>{currentPlayer.name}</Text>
        {currentPlayer.nickname !== currentPlayer.name.split(' ')[0] && (
          <Text style={[styles.mutedText, { fontStyle: 'italic', marginBottom: 4 }]}>"{currentPlayer.nickname}"</Text>
        )}

        {/* Social proof */}
        {showDetails && (
          <View style={styles.whoGotIt}>
            <Ionicons name="people" size={14} color={C.mutedForeground} />
            <Text style={styles.mutedText}> {whoGotItPct}% got this right</Text>
            <View style={[styles.diffBadge, {
              backgroundColor: whoGotItPct <= 35 ? `${C.gameWrong}20` : whoGotItPct <= 65 ? `${C.gameGold}20` : `${C.gameCorrect}20`
            }]}>
              <Text style={{ fontSize: 10, color: whoGotItPct <= 35 ? C.gameWrong : whoGotItPct <= 65 ? C.gameGold : C.gameCorrect, fontWeight: 'bold' }}>
                {whoGotItPct <= 35 ? '🔴 Hard' : whoGotItPct <= 65 ? '🟡 Medium' : '🟢 Easy'}
              </Text>
            </View>
          </View>
        )}

        {/* Details */}
        {showDetails && (
          <Text style={styles.mutedText}>#{currentPlayer.number} · {currentPlayer.position} · {currentPlayer.team}</Text>
        )}
        {!correct && selectedPlayer && showDetails && (
          <Text style={styles.mutedText}>
            You guessed: <Text style={{ color: C.gameWrong, fontWeight: '600' }}>{selectedPlayer.name}</Text>
          </Text>
        )}

        {/* Player image */}
        {showImage && (
          <View style={styles.revealImageContainer}>
            <Image
              source={{ uri: currentPlayer.imageUrl }}
              style={styles.revealImage}
              contentFit="cover"
            />
          </View>
        )}

        {/* Continue button */}
        {showButton && (
          <TouchableOpacity
            onPress={() => canContinue && game.continueGame()}
            disabled={!canContinue}
            style={[styles.continueBtn, { opacity: canContinue ? 1 : 0.5, backgroundColor: correct ? C.primary : C.accent }]}
            activeOpacity={0.85}
          >
            <Text style={styles.continueBtnText}>{getButtonText()}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

// ─── GameOverScreen ───────────────────────────────────────────────────────────

function GameOverScreen({ game }: { game: ReturnType<typeof useGameState> }) {
  const { score, bestStreak, totalCorrect, totalAnswered, tier, highScores, xpEarned,
    answerHistory, isDailyMode, isBuzzerMode, isHeatCheckMode, leveledUp, newLevel, playerHistory } = game;

  const accuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
  const isNewHS = !isDailyMode && !isBuzzerMode && !isHeatCheckMode && score >= (highScores[tier] || 0) && score > 0;
  const config = TIER_CONFIG[tier];
  const dailyNum = getDailyChallengeNumber();
  const playerName = storage.getItem('sg_player_name') || 'Anonymous';
  const headerText = isDailyMode || isBuzzerMode || isHeatCheckMode ? 'SESSION COMPLETE' : 'GAME OVER';

  const getEmojiForAnswer = (entry: { correct: boolean; hintsUsed: number }) =>
    !entry.correct ? '🔴' : entry.hintsUsed > 0 ? '🟡' : '🟢';

  const getShareText = () => {
    if (isDailyMode) return `WHO IS IT? 🏀 Day #${dailyNum}\n${answerHistory.map(getEmojiForAnswer).join('')}\nScore: ${score} | 🔥 ${bestStreak} streak\nwhoisit.app`;
    if (isBuzzerMode) return `🚨 WHO IS IT? Buzzer Beater!\n${answerHistory.map(getEmojiForAnswer).join('')}\nScore: ${score} | 🔥 ${bestStreak} streak\nwhoisit.app`;
    if (isHeatCheckMode) return `🔥 WHO IS IT? Heat Check!\n${answerHistory.map(getEmojiForAnswer).join('')}\nScore: ${score} | 🔥 ${bestStreak} streak\nwhoisit.app`;
    return `🏀 WHO IS IT? — ${config.label}\n${answerHistory.map(getEmojiForAnswer).join('')}\nScore: ${score} | 🔥 ${bestStreak} streak\nwhoisit.app`;
  };

  const handleShare = async () => {
    try {
      await Share.share({ message: getShareText() });
    } catch {}
  };

  const handleCopy = async () => {
    await Clipboard.setStringAsync(getShareText());
    Alert.alert('Copied!', 'Share it with your friends 🏀');
  };

  return (
    <ScrollView style={styles.gameOverScroll} contentContainerStyle={styles.gameOverContent} showsVerticalScrollIndicator={false}>
      {leveledUp && (
        <View style={{ alignItems: 'center', marginBottom: 16 }}>
          <Text style={{ fontSize: 36 }}>⬆️</Text>
          <Text style={[styles.levelUpText, { color: C.gameGold }]}>LEVEL UP → LVL {newLevel}</Text>
        </View>
      )}
      {isNewHS && (
        <View style={{ alignItems: 'center', marginBottom: 16 }}>
          <Text style={{ fontSize: 36 }}>🎉</Text>
          <Text style={[styles.newRecordText, { color: C.gameGold }]}>NEW RECORD!</Text>
        </View>
      )}

      <Text style={styles.gameOverHeader}>{headerText}</Text>

      {isBuzzerMode && <Text style={[styles.modeTagText, { color: C.accent }]}>🚨 BUZZER BEATER</Text>}
      {isHeatCheckMode && <Text style={[styles.modeTagText, { color: C.accent }]}>🔥 HEAT CHECK</Text>}
      {isDailyMode && <Text style={[styles.modeTagText, { color: C.primary }]}>📅 DAILY CHALLENGE #{dailyNum}</Text>}
      {!isDailyMode && !isBuzzerMode && !isHeatCheckMode && (
        <View style={[styles.tierTag, { backgroundColor: `${C.primary}20` }]}>
          <Text style={[styles.tierTagText, { color: C.primary }]}>{config.label}</Text>
        </View>
      )}

      <Text style={styles.gameOverScore}>{score}</Text>

      <View style={styles.xpBadge}>
        <Ionicons name="flash" size={14} color={C.gameGold} />
        <Text style={[styles.xpBadgeText, { color: C.gameGold }]}>+{xpEarned} XP</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Ionicons name="radio-button-on" size={20} color={C.mutedForeground} />
          <Text style={styles.statValue}>{accuracy}%</Text>
          <Text style={styles.statLabel}>Accuracy</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="flame" size={20} color={C.accent} />
          <Text style={styles.statValue}>{bestStreak}</Text>
          <Text style={styles.statLabel}>Best Streak</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="trophy" size={20} color={C.gameGold} />
          <Text style={styles.statValue}>{totalCorrect}/{totalAnswered}</Text>
          <Text style={styles.statLabel}>Correct</Text>
        </View>
      </View>

      {/* Emoji grid */}
      {answerHistory.length > 0 && (
        <View style={styles.shareCard}>
          <Text style={styles.shareCardTitle}>WHO IS IT? 🏀</Text>
          <Text style={styles.emojiGrid}>{answerHistory.map(getEmojiForAnswer).join('')}</Text>
          <View style={styles.shareCardStats}>
            <Text style={[styles.statValue, { color: C.accent }]}>{score} pts</Text>
            <Text style={styles.statValue}>🔥 {bestStreak} streak</Text>
          </View>
          <View style={styles.legendRow}>
            <Text style={styles.legendText}>🟢 No hints</Text>
            <Text style={styles.legendText}>🟡 Hints used</Text>
            <Text style={styles.legendText}>🔴 Wrong</Text>
          </View>
        </View>
      )}

      {/* Buttons */}
      <View style={styles.gameOverButtons}>
        <View style={styles.shareRow}>
          <TouchableOpacity onPress={handleCopy} style={[styles.shareBtn, { borderWidth: 1, borderColor: C.border }]}>
            <Ionicons name="copy" size={16} color={C.foreground} />
            <Text style={styles.shareBtnText}>COPY</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} style={[styles.shareBtn, { backgroundColor: C.primary }]}>
            <Ionicons name="share-social" size={16} color="#fff" />
            <Text style={[styles.shareBtnText, { color: '#fff' }]}>SHARE</Text>
          </TouchableOpacity>
        </View>

        {!isDailyMode && (
          <TouchableOpacity onPress={() => game.startGame(tier)} style={styles.gameOverBtn}>
            <Ionicons name="refresh" size={16} color={C.foreground} />
            <Text style={styles.gameOverBtnText}>PLAY AGAIN</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={game.goHome} style={styles.gameOverBtn}>
          <Ionicons name="home" size={16} color={C.foreground} />
          <Text style={styles.gameOverBtnText}>HOME</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const game = useGameState();
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const prevPhase = useRef(game.phase);

  useEffect(() => {
    if (prevPhase.current !== game.phase) {
      prevPhase.current = game.phase;
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    }
  }, [game.phase]);

  const renderScreen = () => {
    switch (game.phase) {
      case 'playing': return <GameScreen game={game} />;
      case 'reveal': return <RevealScreen game={game} />;
      case 'gameover': return <GameOverScreen game={game} />;
      default: return <HomeScreen game={game} />;
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['left', 'right']}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        {renderScreen()}
      </Animated.View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background },

  // Home
  homeScroll: { flex: 1, backgroundColor: C.background },
  homeContent: { paddingHorizontal: 22, paddingBottom: 48 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, marginBottom: 12 },
  topBarRight: { flexDirection: 'row', gap: 8 },
  iconBtn: { padding: 9, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: C.border },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  nameEditRow: { flexDirection: 'row', gap: 8, marginBottom: 20, alignItems: 'center' },
  nameInput: { flex: 1, backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, color: C.foreground, fontSize: 15 },
  saveBtn: { backgroundColor: C.primary, borderRadius: 14, paddingHorizontal: 18, paddingVertical: 12 },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  welcomeBack: { fontSize: 10, color: C.mutedForeground, letterSpacing: 2, textTransform: 'uppercase' },
  playerNameText: { fontSize: 22, color: C.foreground, fontWeight: 'bold', marginTop: 2 },
  logoArea: { alignItems: 'center', marginBottom: 20, marginTop: 4 },
  logoEmoji: { fontSize: 44, marginBottom: 4 },
  logoTitle: { fontSize: 52, fontWeight: '900', color: C.foreground, letterSpacing: 6, textAlign: 'center' },
  logoSubtitle: { fontSize: 13, color: C.mutedForeground, textAlign: 'center', marginTop: 6, letterSpacing: 0.5 },
  dailyRow: { flexDirection: 'row', marginTop: 10 },
  dailyDate: { fontSize: 12, color: C.mutedForeground },
  dailyNum: { fontSize: 12, color: C.primary, fontWeight: '600' },
  xpContainer: { marginBottom: 22 },
  xpHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  levelText: { fontSize: 16, fontWeight: 'bold' },
  xpBarBg: { height: 8, backgroundColor: C.secondary, borderRadius: 4, overflow: 'hidden' },
  xpBarFill: { height: '100%', borderRadius: 4, backgroundColor: C.gameGold },
  tierSection: { marginBottom: 18 },
  sectionLabel: { fontSize: 10, color: C.mutedForeground, letterSpacing: 2, textAlign: 'center', marginBottom: 10 },
  tierRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, flexWrap: 'wrap' },
  tierBtn: { alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 14, borderWidth: 1, borderColor: C.border, backgroundColor: C.card, minWidth: 60 },
  lockIcon: { position: 'absolute', top: 5, right: 5 },
  tierLabel: { fontSize: 11, fontWeight: 'bold', letterSpacing: 1 },
  tierSecs: { fontSize: 9, color: C.mutedForeground, marginTop: 2 },
  tierHS: { fontSize: 9, marginTop: 2 },
  tierXP: { fontSize: 8, color: C.mutedForeground, marginTop: 2 },
  playBtn: { backgroundColor: C.primary, borderRadius: 18, paddingVertical: 20, alignItems: 'center', marginBottom: 10, shadowColor: C.primary, shadowOpacity: 0.55, shadowRadius: 24, elevation: 10 },
  playBtnText: { color: '#fff', fontSize: 21, fontWeight: '900', letterSpacing: 4 },
  modesList: { gap: 10 },
  modeCard: { flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: 18, borderWidth: 1, backgroundColor: `${C.card}cc`, gap: 14 },
  modeIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  modeInfo: { flex: 1 },
  modeTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  modeTitle: { fontSize: 14, fontWeight: '800', color: C.foreground, letterSpacing: 1 },
  modeDesc: { fontSize: 12, color: C.mutedForeground, marginTop: 3 },
  newBadge: { backgroundColor: `${C.accent}30`, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
  newBadgeText: { fontSize: 9, fontWeight: 'bold', color: C.accent },
  mutedText: { fontSize: 12, color: C.mutedForeground },

  // Game
  gameContainer: { flex: 1, backgroundColor: C.background, paddingHorizontal: 14, gap: 7 },
  bgGlow: { ...StyleSheet.absoluteFillObject, backgroundColor: C.primary },
  feedbackOverlay: { ...StyleSheet.absoluteFillObject, borderWidth: 4, zIndex: 50 },
  hypeContainer: { position: 'absolute', top: '35%', left: 0, right: 0, alignItems: 'center', zIndex: 58 },
  hypeText: { fontSize: 30, fontWeight: '900', letterSpacing: 3 },
  scoreFloat: { position: 'absolute', top: 80, left: 0, right: 0, alignItems: 'center', zIndex: 50 },
  scoreFloatText: { fontSize: 26, fontWeight: '900' },
  scoreFloatSub: { fontSize: 13, fontWeight: 'bold', marginTop: 2 },
  hud: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 18, paddingHorizontal: 12, paddingVertical: 10, gap: 8, borderWidth: 1, borderColor: C.border },
  hudBtn: { padding: 5 },
  hudCenter: { flex: 1, alignItems: 'center' },
  hudTimer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  hudTimerText: { fontSize: 22, fontWeight: 'bold' },
  timerNum: { fontSize: 20, fontWeight: 'bold' },
  hudRight: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  hudScore: { fontSize: 22, fontWeight: 'bold' },
  hudLives: { flexDirection: 'row', gap: 2 },
  hudStreak: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  hudStreakText: { fontSize: 14, fontWeight: 'bold' },
  heatBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, borderWidth: 1 },
  timerBarTrack: { height: 4, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden', marginHorizontal: 2 },
  timerBarFill: { height: '100%', borderRadius: 2 },
  dailyProgressRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  dailyDot: { width: 10, height: 10, borderRadius: 5 },
  badgeRow: { flexDirection: 'row', justifyContent: 'center' },
  badge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, backgroundColor: `${C.primary}20`, borderWidth: 1, borderColor: `${C.primary}40` },
  badgeText: { fontSize: 12, fontWeight: 'bold' },
  mediaContainer: { flex: 1, maxHeight: '44%' },
  videoContainer: { flex: 1, borderRadius: 18, overflow: 'hidden', backgroundColor: C.card, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  shimmerOverlay: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 18 },
  placeholderCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.card },
  videoFade: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '25%', backgroundColor: 'transparent' },
  mysteryCard: { flex: 1, backgroundColor: C.card, borderRadius: 18, padding: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: `${C.purple}30` },
  mysteryTitle: { fontSize: 14, fontWeight: '800', letterSpacing: 1, marginBottom: 16 },
  clueList: { gap: 10, alignSelf: 'stretch' },
  clueChip: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(192,132,252,0.1)', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: 'rgba(192,132,252,0.22)' },
  clueChipIcon: { fontSize: 17 },
  clueChipLabel: { fontSize: 10, fontWeight: 'bold', color: C.mutedForeground, letterSpacing: 1, width: 64 },
  clueChipValue: { fontSize: 16, fontWeight: '700', color: C.foreground, flex: 1 },
  revealClueBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: `${C.purple}60` },
  revealClueBtnText: { fontSize: 13, fontWeight: 'bold', letterSpacing: 1 },
  powerUpRow: { flexDirection: 'row', justifyContent: 'center', gap: 14 },
  powerUpBtn: { alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: C.border },
  powerUpLabel: { fontSize: 10, marginTop: 3 },
  powerUpCount: { fontSize: 10, fontWeight: 'bold', marginTop: 2 },
  hintsRow: { flexDirection: 'row', justifyContent: 'center', gap: 10 },
  hintBtn: { minWidth: 64, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.04)', alignItems: 'center' },
  hintBtnRevealed: { backgroundColor: 'rgba(79,142,247,0.12)', borderColor: `${C.primary}50` },
  hintBtnNext: { borderColor: 'rgba(255,255,255,0.22)' },
  hintValue: { fontSize: 11, fontWeight: '600', color: C.foreground },
  hintLabel: { fontSize: 8, fontWeight: 'bold', color: C.mutedForeground, marginTop: 2 },
  hintCost: { fontSize: 8, fontWeight: 'bold', marginTop: 2 },
  answerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  answerCard: { minHeight: 66, padding: 12, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)', flexDirection: 'row', alignItems: 'center', gap: 10 },
  answerCorrect: { borderColor: C.gameCorrect, backgroundColor: `${C.gameCorrect}22` },
  answerWrong: { borderColor: C.gameWrong, backgroundColor: `${C.gameWrong}22` },
  answerEliminated: { opacity: 0.25, borderColor: 'rgba(255,255,255,0.05)' },
  answerIndex: { width: 22, height: 22, borderRadius: 7, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  answerIndexText: { fontSize: 10, color: C.mutedForeground, fontWeight: 'bold' },
  answerName: { flex: 1, fontSize: 15, fontWeight: '700', color: C.foreground },

  // Reveal
  revealContainer: { flex: 1, backgroundColor: 'rgba(3,6,15,0.98)' },
  revealContent: { alignItems: 'center', paddingHorizontal: 28, paddingTop: 56, paddingBottom: 48 },
  resultText: { fontSize: 50, fontWeight: '900', letterSpacing: 5, marginBottom: 14 },
  revealSub: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  streakBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 22, borderWidth: 1, marginBottom: 10 },
  streakBadgeText: { fontWeight: 'bold', fontSize: 13, letterSpacing: 1 },
  revealPlayerName: { fontSize: 32, fontWeight: '900', color: C.foreground, textAlign: 'center', marginTop: 10 },
  whoGotIt: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  diffBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  revealImageContainer: { width: 240, borderRadius: 20, overflow: 'hidden', marginTop: 20, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  revealImage: { width: '100%', aspectRatio: 4 / 3 },
  continueBtn: { width: '100%', paddingVertical: 18, borderRadius: 18, alignItems: 'center', marginTop: 10 },
  continueBtnText: { color: '#fff', fontSize: 17, fontWeight: '900', letterSpacing: 3 },

  // Game over
  gameOverScroll: { flex: 1, backgroundColor: C.background },
  gameOverContent: { alignItems: 'center', paddingHorizontal: 28, paddingTop: 56, paddingBottom: 48 },
  levelUpText: { fontSize: 28, fontWeight: '900', letterSpacing: 2, textAlign: 'center', marginTop: 4 },
  newRecordText: { fontSize: 24, fontWeight: '900', letterSpacing: 2, textAlign: 'center', marginTop: 4 },
  gameOverHeader: { fontSize: 36, fontWeight: '900', color: C.foreground, letterSpacing: 4, marginBottom: 10 },
  modeTagText: { fontSize: 13, fontWeight: 'bold', letterSpacing: 1, marginBottom: 14 },
  tierTag: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20, marginBottom: 14 },
  tierTagText: { fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
  gameOverScore: { fontSize: 80, fontWeight: '900', color: C.accent, marginBottom: 8 },
  xpBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: C.secondary, marginBottom: 20 },
  xpBadgeText: { fontWeight: 'bold', fontSize: 15 },
  statsGrid: { flexDirection: 'row', gap: 32, marginBottom: 24 },
  statItem: { alignItems: 'center', gap: 5 },
  statValue: { fontSize: 22, fontWeight: '900', color: C.foreground },
  statLabel: { fontSize: 11, color: C.mutedForeground, letterSpacing: 0.5 },
  shareCard: { width: '100%', backgroundColor: C.card, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: C.border, marginBottom: 18, alignItems: 'center' },
  shareCardTitle: { fontSize: 16, fontWeight: '900', color: C.foreground, letterSpacing: 2, marginBottom: 10 },
  emojiGrid: { fontSize: 26, letterSpacing: 5, marginBottom: 14 },
  shareCardStats: { flexDirection: 'row', gap: 20, marginBottom: 10 },
  legendRow: { flexDirection: 'row', gap: 14 },
  legendText: { fontSize: 11, color: C.mutedForeground },
  gameOverButtons: { width: '100%', gap: 12 },
  shareRow: { flexDirection: 'row', gap: 12 },
  shareBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 16 },
  shareBtnText: { fontSize: 14, fontWeight: '900', letterSpacing: 2, color: C.foreground },
  gameOverBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 16, borderWidth: 1, borderColor: C.border, backgroundColor: 'rgba(255,255,255,0.04)' },
  gameOverBtnText: { fontSize: 14, fontWeight: '900', color: C.foreground, letterSpacing: 2 },
});
