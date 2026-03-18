import { describe, it, expect, beforeEach, vi } from 'vitest';

// We'll mock safeStorage to control storage state in tests
let store: Record<string, string> = {};

vi.mock('@/utils/safeStorage', () => ({
  storageGetJSON: vi.fn((key: string, fallback: unknown) => {
    const raw = store[key];
    if (raw === undefined) return fallback;
    try { return JSON.parse(raw); } catch { return fallback; }
  }),
  storageSetJSON: vi.fn((key: string, value: unknown) => {
    store[key] = JSON.stringify(value);
    return true;
  }),
  storageGet: vi.fn((key: string) => store[key] ?? null),
  storageSet: vi.fn((key: string, value: string) => { store[key] = value; return true; }),
  storageRemove: vi.fn((key: string) => { delete store[key]; }),
}));

import { getInventory, usePowerUp, awardPowerUp, awardRandomPowerUp, PowerUpType } from '@/utils/powerups';

describe('powerups', () => {
  beforeEach(() => {
    store = {};
  });

  describe('getInventory', () => {
    it('returns default inventory when storage is empty', () => {
      const inv = getInventory();
      expect(inv.fiftyFifty).toBe(1);
      expect(inv.extraTime).toBe(1);
      expect(inv.secondChance).toBe(1);
    });

    it('returns stored inventory values', () => {
      store['sg_powerups'] = JSON.stringify({ fiftyFifty: 3, extraTime: 0, secondChance: 2 });
      const inv = getInventory();
      expect(inv.fiftyFifty).toBe(3);
      expect(inv.extraTime).toBe(0);
      expect(inv.secondChance).toBe(2);
    });
  });

  describe('usePowerUp', () => {
    it('decrements the power-up count and returns true', () => {
      store['sg_powerups'] = JSON.stringify({ fiftyFifty: 2, extraTime: 1, secondChance: 1 });
      const result = usePowerUp('fiftyFifty');
      expect(result).toBe(true);
      expect(getInventory().fiftyFifty).toBe(1);
    });

    it('returns false when count is 0', () => {
      store['sg_powerups'] = JSON.stringify({ fiftyFifty: 0, extraTime: 1, secondChance: 1 });
      const result = usePowerUp('fiftyFifty');
      expect(result).toBe(false);
      expect(getInventory().fiftyFifty).toBe(0);
    });
  });

  describe('awardPowerUp', () => {
    it('increments the power-up count by 1', () => {
      store['sg_powerups'] = JSON.stringify({ fiftyFifty: 0, extraTime: 0, secondChance: 0 });
      awardPowerUp('extraTime');
      expect(getInventory().extraTime).toBe(1);
    });

    it('increments by custom count', () => {
      store['sg_powerups'] = JSON.stringify({ fiftyFifty: 0, extraTime: 0, secondChance: 0 });
      awardPowerUp('secondChance', 3);
      expect(getInventory().secondChance).toBe(3);
    });
  });

  describe('awardRandomPowerUp', () => {
    it('returns a valid PowerUpType', () => {
      store['sg_powerups'] = JSON.stringify({ fiftyFifty: 0, extraTime: 0, secondChance: 0 });
      const valid: PowerUpType[] = ['fiftyFifty', 'extraTime', 'secondChance'];
      const result = awardRandomPowerUp();
      expect(valid).toContain(result);
    });

    it('increases total inventory by 1', () => {
      store['sg_powerups'] = JSON.stringify({ fiftyFifty: 0, extraTime: 0, secondChance: 0 });
      awardRandomPowerUp();
      const inv = getInventory();
      const total = inv.fiftyFifty + inv.extraTime + inv.secondChance;
      expect(total).toBe(1);
    });
  });
});
