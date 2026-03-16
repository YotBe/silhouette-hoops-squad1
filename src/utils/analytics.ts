/**
 * Analytics event tracking stubs.
 * Replace the log call with your analytics provider (Firebase, GA, etc.)
 */

type EventName =
  | 'session_start'
  | 'tutorial_complete'
  | 'game_start'
  | 'correct_guess'
  | 'wrong_guess'
  | 'reveal'
  | 'mode_entry'
  | 'daily_complete'
  | 'streak_update'
  | 'gallery_view'
  | 'achievement_unlocked'
  | 'share';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function trackEvent(name: EventName, data?: Record<string, any>): void {
  if (import.meta.env.DEV) {
    console.log(`[Analytics] ${name}`, data ?? '');
  }
  // TODO: wire to real provider
  // e.g. firebase.analytics().logEvent(name, data);
}
