import AsyncStorage from '@react-native-async-storage/async-storage';

// In-memory cache for synchronous access (mirrors AsyncStorage)
const cache: Record<string, string> = {};

/** Call once on app start to hydrate the in-memory cache from disk */
export async function initStorage(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    if (keys.length > 0) {
      const pairs = await AsyncStorage.multiGet(keys);
      for (const [key, value] of pairs) {
        if (value !== null) cache[key] = value;
      }
    }
  } catch {}
}

/** Synchronous storage API backed by in-memory cache */
export const storage = {
  getItem: (key: string): string | null => cache[key] ?? null,
  setItem: (key: string, value: string): void => {
    cache[key] = value;
    AsyncStorage.setItem(key, value).catch(() => {});
  },
  removeItem: (key: string): void => {
    delete cache[key];
    AsyncStorage.removeItem(key).catch(() => {});
  },
};
