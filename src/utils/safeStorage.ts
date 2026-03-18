/**
 * Safe localStorage wrapper.
 * - Handles quota exceeded, private browsing, and JSON parse errors gracefully.
 * - Falls back to an in-memory store so the app never crashes due to storage issues.
 * - Reports errors to the analytics layer rather than swallowing them silently.
 */

import { trackEvent } from './analytics';

const memoryFallback = new Map<string, string>();
let storageAvailable: boolean | null = null;

function isStorageAvailable(): boolean {
  if (storageAvailable !== null) return storageAvailable;
  try {
    const testKey = '__sg_storage_test__';
    localStorage.setItem(testKey, '1');
    localStorage.removeItem(testKey);
    storageAvailable = true;
  } catch {
    storageAvailable = false;
  }
  return storageAvailable;
}

export function storageGet(key: string): string | null {
  if (isStorageAvailable()) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      trackEvent('storage_error', { op: 'get', key, error: String(e) });
      return memoryFallback.get(key) ?? null;
    }
  }
  return memoryFallback.get(key) ?? null;
}

export function storageSet(key: string, value: string): boolean {
  if (isStorageAvailable()) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      // Quota exceeded or private mode — fall back to memory store
      trackEvent('storage_error', { op: 'set', key, error: String(e) });
      memoryFallback.set(key, value);
      return false;
    }
  }
  memoryFallback.set(key, value);
  return false;
}

export function storageRemove(key: string): void {
  memoryFallback.delete(key);
  if (isStorageAvailable()) {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      trackEvent('storage_error', { op: 'remove', key, error: String(e) });
    }
  }
}

export function storageGetJSON<T>(key: string, fallback: T): T {
  const raw = storageGet(key);
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch (e) {
    trackEvent('storage_error', { op: 'parse', key, error: String(e) });
    return fallback;
  }
}

export function storageSetJSON<T>(key: string, value: T): boolean {
  try {
    return storageSet(key, JSON.stringify(value));
  } catch (e) {
    trackEvent('storage_error', { op: 'stringify', key, error: String(e) });
    return false;
  }
}
