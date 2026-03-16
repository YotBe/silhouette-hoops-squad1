import * as Haptics from 'expo-haptics';
import { storage } from './storage';

const STORAGE_KEY = 'sg_haptics';

export function isHapticsEnabled(): boolean {
  return storage.getItem(STORAGE_KEY) !== '0';
}

export function setHapticsEnabled(enabled: boolean): void {
  storage.setItem(STORAGE_KEY, enabled ? '1' : '0');
}

export function isWelcomeHapticsEnabled(): boolean {
  return storage.getItem('sg_haptics_welcome') !== '0';
}

export function setWelcomeHapticsEnabled(enabled: boolean): void {
  storage.setItem('sg_haptics_welcome', enabled ? '1' : '0');
}

export function hapticSuccess(): void {
  if (!isHapticsEnabled()) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}

export function hapticError(): void {
  if (!isHapticsEnabled()) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
}

export function hapticLight(): void {
  if (!isHapticsEnabled()) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

export function hapticReveal(): void {
  if (!isHapticsEnabled()) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

export function hapticCountdown(): void {
  if (!isHapticsEnabled()) return;
  Haptics.selectionAsync().catch(() => {});
}

export function hapticPress(): void {
  if (!isHapticsEnabled()) return;
  Haptics.selectionAsync().catch(() => {});
}

export function hapticWelcome(): void {
  if (!isHapticsEnabled()) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}
