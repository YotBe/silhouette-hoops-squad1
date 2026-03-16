// Season = ISO week number * year. Resets every Monday 00:00 UTC.

export function getCurrentSeasonId(): number {
  const now = new Date();
  // ISO week: Thursday of the week determines the year
  const jan1 = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
  const dayOfYear = Math.floor((now.getTime() - jan1.getTime()) / 86_400_000);
  const week = Math.ceil((dayOfYear + jan1.getUTCDay() + 1) / 7);
  return now.getUTCFullYear() * 100 + Math.max(week, 1);
}

export function getSeasonLabel(seasonId: number): string {
  const year = Math.floor(seasonId / 100);
  const week = seasonId % 100;
  return `S${week} '${String(year).slice(2)}`;
}

export function getSeasonResetMs(): number {
  const now = new Date();
  // Next Monday 00:00 UTC
  const day = now.getUTCDay(); // 0=Sun, 1=Mon
  const daysUntilMonday = day === 1 ? 7 : (8 - day) % 7 || 7;
  const next = new Date(now);
  next.setUTCDate(now.getUTCDate() + daysUntilMonday);
  next.setUTCHours(0, 0, 0, 0);
  return next.getTime() - now.getTime();
}

export function formatSeasonCountdown(ms: number): string {
  const d = Math.floor(ms / 86_400_000);
  const h = Math.floor((ms % 86_400_000) / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
