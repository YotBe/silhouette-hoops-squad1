/**
 * Analytics event tracking.
 *
 * Architecture:
 * - In development: logs to console.
 * - In production: dispatches to every registered provider.
 * - Providers are pluggable: register with `addAnalyticsProvider`.
 *
 * To wire up a real provider (e.g. Firebase Analytics, PostHog, Mixpanel):
 *   import { addAnalyticsProvider } from './analytics';
 *   addAnalyticsProvider((name, data) => firebase.analytics().logEvent(name, data));
 */

export type EventName =
  | 'session_start'
  | 'tutorial_complete'
  | 'game_start'
  | 'game_over'
  | 'correct_guess'
  | 'wrong_guess'
  | 'timeout'
  | 'hint_used'
  | 'powerup_used'
  | 'reveal'
  | 'mode_entry'
  | 'daily_complete'
  | 'streak_update'
  | 'achievement_unlocked'
  | 'level_up'
  | 'duel_created'
  | 'duel_joined'
  | 'share'
  | 'gallery_view'
  | 'storage_error';

export type AnalyticsProvider = (name: EventName, data?: Record<string, unknown>) => void;

const providers: AnalyticsProvider[] = [];

/** Register a production analytics provider. */
export function addAnalyticsProvider(provider: AnalyticsProvider): void {
  providers.push(provider);
}

/** Track an analytics event. */
export function trackEvent(name: EventName, data?: Record<string, unknown>): void {
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.debug(`[Analytics] ${name}`, data ?? '');
  }

  for (const provider of providers) {
    try {
      provider(name, data);
    } catch {
      // Never let an analytics error crash the game
    }
  }
}
