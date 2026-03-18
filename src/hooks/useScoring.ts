/**
 * Pure scoring logic extracted from useGameState for testability.
 * All functions are stateless — they take inputs and return numbers.
 */

export interface RoundScoringInput {
  correct: boolean;
  streak: number;           // streak BEFORE this answer
  hintsRevealed: number;
  timeLeft: number;
  timerSeconds: number;     // max time for the round
  isMysteryMode: boolean;
  mysteryCluesRevealed: number;
  isBuzzerMode: boolean;
}

export interface RoundScoringOutput {
  points: number;
  xp: number;
}

/**
 * Calculates the streak multiplier for a given streak length.
 * Every 3 correct answers adds 0.5×, capped at 3×.
 */
export function calcStreakMultiplier(streak: number): number {
  return Math.min(1 + Math.floor(streak / 3) * 0.5, 3);
}

/**
 * Calculates base points for a round answer.
 */
export function calcRoundPoints(input: RoundScoringInput): number {
  const {
    correct,
    streak,
    hintsRevealed,
    timeLeft,
    isMysteryMode,
    mysteryCluesRevealed,
    isBuzzerMode,
  } = input;

  if (!correct) return 0;

  const streakMultiplier = calcStreakMultiplier(streak);
  const hintPenalty = hintsRevealed * 20;
  const speedBonus = isBuzzerMode ? 0 : Math.round(timeLeft * 2);

  const mysteryBase = isMysteryMode
    ? Math.max((3 - mysteryCluesRevealed) * 30, 25)
    : 0;
  const basePoints = isMysteryMode
    ? mysteryBase
    : Math.max(100 - hintPenalty, 25);

  return Math.round(basePoints * streakMultiplier) + (!isMysteryMode ? speedBonus : 0);
}

/**
 * Calculates XP earned for a round answer.
 */
export function calcRoundXP(correct: boolean, streak: number, hintsRevealed: number): number {
  if (!correct) return 0;
  const baseXP = streak > 3 ? 100 : 50;
  return Math.max(baseXP - hintsRevealed * Math.round(baseXP * 0.15), 10);
}
