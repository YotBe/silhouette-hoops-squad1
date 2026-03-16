const PREFS_KEY = 'sg_notif_prefs';

interface NotifPrefs {
  dailyReminder: boolean;
  streakAlerts: boolean;
}

const DEFAULTS: NotifPrefs = { dailyReminder: false, streakAlerts: false };

export function getNotifPrefs(): NotifPrefs {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(PREFS_KEY) || '{}') };
  } catch { return { ...DEFAULTS }; }
}

export function setNotifPrefs(prefs: Partial<NotifPrefs>): NotifPrefs {
  const current = getNotifPrefs();
  const updated = { ...current, ...prefs };
  localStorage.setItem(PREFS_KEY, JSON.stringify(updated));
  return updated;
}

/** Stub — wire to push notification provider */
export async function requestPermission(): Promise<boolean> {
  if ('Notification' in window) {
    const result = await Notification.requestPermission();
    return result === 'granted';
  }
  return false;
}

/** Stub — schedule daily challenge reminder */
export function scheduleDaily(): void {
  // TODO: wire to push provider (e.g. Firebase Cloud Messaging)
  console.log('[Notifications] Daily reminder scheduled (stub)');
}

/** Stub — schedule streak protection reminder */
export function scheduleStreakReminder(): void {
  // TODO: wire to push provider
  console.log('[Notifications] Streak reminder scheduled (stub)');
}
