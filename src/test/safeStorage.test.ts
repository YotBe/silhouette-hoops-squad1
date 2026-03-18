import { describe, it, expect, beforeEach, vi } from 'vitest';

// We test against a real in-memory localStorage mock
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(global, 'localStorage', { value: localStorageMock });

// Mock analytics to avoid side-effects
vi.mock('@/utils/analytics', () => ({ trackEvent: vi.fn() }));

import { storageGet, storageSet, storageRemove, storageGetJSON, storageSetJSON } from '@/utils/safeStorage';

describe('safeStorage', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe('storageSet / storageGet', () => {
    it('stores and retrieves a string', () => {
      storageSet('test_key', 'hello');
      expect(storageGet('test_key')).toBe('hello');
    });

    it('returns null for missing keys', () => {
      expect(storageGet('nonexistent')).toBeNull();
    });
  });

  describe('storageRemove', () => {
    it('removes a stored value', () => {
      storageSet('del_key', 'value');
      storageRemove('del_key');
      expect(storageGet('del_key')).toBeNull();
    });
  });

  describe('storageGetJSON / storageSetJSON', () => {
    it('stores and retrieves an object', () => {
      const obj = { score: 100, tier: 'rookie' };
      storageSetJSON('obj_key', obj);
      expect(storageGetJSON('obj_key', null)).toEqual(obj);
    });

    it('returns the fallback for missing keys', () => {
      expect(storageGetJSON('missing', { default: true })).toEqual({ default: true });
    });

    it('returns the fallback for corrupted JSON', () => {
      localStorageMock.setItem('bad_json', '{invalid}');
      expect(storageGetJSON('bad_json', 42)).toBe(42);
    });

    it('stores and retrieves arrays', () => {
      const arr = [1, 2, 3];
      storageSetJSON('arr_key', arr);
      expect(storageGetJSON('arr_key', [])).toEqual(arr);
    });

    it('stores and retrieves numbers', () => {
      storageSetJSON('num_key', 999);
      expect(storageGetJSON('num_key', 0)).toBe(999);
    });
  });
});
