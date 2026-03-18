/**
 * Browser-native notifications using the Web Notifications API.
 * No external dependencies required — works in any modern browser/PWA.
 *
 * To integrate a push provider (e.g. Firebase Cloud Messaging) later,
 * replace the `showLocalNotification` calls with FCM send requests.
 */

import { storageGetJSON, storageSetJSON } from './safeStorage';

const PREFS_KEY = 'sg_notif_prefs';

interface NotifPrefs {
  dailyReminder: boolean;
  streakAlerts: boolean;
  permissionGranted: boolean;
}

const DEFAULTS: NotifPrefs = {
  dailyReminder: false,
  streakAlerts: false,
  permissionGranted: false,
};

export function getNotifPrefs(): NotifPrefs {
  return { ...DEFAULTS, ...storageGetJSON<Partial<NotifPrefs>>(PREFS_KEY, {}) };
}

export function setNotifPrefs(prefs: Partial<NotifPrefs>): NotifPrefs {
  const updated = { ...getNotifPrefs(), ...prefs };
  storageSetJSON(PREFS_KEY, updated);
  return updated;
}

/** Returns whether the Notifications API is supported in this browser/PWA. */
export function isNotificationsSupported(): boolean {
  return 'Notification' in window && 'serviceWorker' in navigator;
}

/** Requests permission and persists the result. */
export async function requestPermission(): Promise<boolean> {
  if (!isNotificationsSupported()) return false;
  if (Notification.permission === 'granted') {
    setNotifPrefs({ permissionGranted: true });
    return true;
  }
  if (Notification.permission === 'denied') return false;

  const result = await Notification.requestPermission();
  const granted = result === 'granted';
  setNotifPrefs({ permissionGranted: granted });
  return granted;
}

/** Current permission status. */
export function getPermissionStatus(): NotificationPermission | 'unsupported' {
  if (!isNotificationsSupported()) return 'unsupported';
  return Notification.permission;
}

/**
 * Shows a local browser notification immediately.
 * Silently no-ops if permission is not granted.
 */
export function showLocalNotification(title: string, options?: NotificationOptions): void {
  if (!isNotificationsSupported()) return;
  if (Notification.permission !== 'granted') return;
  try {
    new Notification(title, {
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      ...options,
    });
  } catch {
    // Some browsers block notifications outside user gestures — fail silently
  }
}

/**
 * Schedules a daily challenge reminder using setTimeout.
 * Fires once at midnight (next day reset). Re-call on each app open.
 */
export function scheduleDaily(): void {
  const prefs = getNotifPrefs();
  if (!prefs.dailyReminder || Notification.permission !== 'granted') return;

  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0); // 9 AM next day

  const delay = tomorrow.getTime() - now.getTime();
  if (delay < 0 || delay > 86_400_000) return; // sanity check: max 24h

  setTimeout(() => {
    showLocalNotification('Daily Challenge is Live! 🏀', {
      body: "A new set of NBA silhouettes is waiting. Can you get them all?",
      tag: 'daily-challenge',
    });
  }, delay);
}

/**
 * Schedules a streak protection reminder — fires 2 hours before midnight
 * if the user hasn't completed today's challenge.
 */
export function scheduleStreakReminder(streakCount: number): void {
  const prefs = getNotifPrefs();
  if (!prefs.streakAlerts || Notification.permission !== 'granted' || streakCount < 2) return;

  const now = new Date();
  const reminder = new Date(now);
  reminder.setHours(22, 0, 0, 0); // 10 PM same day

  const delay = reminder.getTime() - now.getTime();
  if (delay <= 0) return; // already past 10 PM

  setTimeout(() => {
    showLocalNotification(`Don't break your ${streakCount}-day streak! 🔥`, {
      body: "Complete today's Daily Challenge before midnight to keep it alive.",
      tag: 'streak-reminder',
    });
  }, delay);
}
