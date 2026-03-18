import { storageGetJSON, storageSetJSON } from './safeStorage';

export type PowerUpType = 'fiftyFifty' | 'extraTime' | 'secondChance';

export interface PowerUpInventory {
  fiftyFifty: number;
  extraTime: number;
  secondChance: number;
}

const STORAGE_KEY = 'sg_powerups';

const DEFAULT_INVENTORY: PowerUpInventory = { fiftyFifty: 1, extraTime: 1, secondChance: 1 };

export const POWERUP_INFO: Record<PowerUpType, { label: string; icon: string; description: string }> = {
  fiftyFifty: { label: '50/50', icon: '✂️', description: 'Remove 2 wrong answers' },
  extraTime: { label: '+5s', icon: '⏱️', description: 'Add 5 seconds' },
  secondChance: { label: '2nd Life', icon: '🛡️', description: 'Save from one wrong answer' },
};

export function getInventory(): PowerUpInventory {
  const raw = storageGetJSON<PowerUpInventory | null>(STORAGE_KEY, null);
  if (!raw) {
    storageSetJSON(STORAGE_KEY, DEFAULT_INVENTORY);
    return { ...DEFAULT_INVENTORY };
  }
  return {
    fiftyFifty: raw.fiftyFifty || 0,
    extraTime: raw.extraTime || 0,
    secondChance: raw.secondChance || 0,
  };
}

export function usePowerUp(type: PowerUpType): boolean {
  const inv = getInventory();
  if (inv[type] <= 0) return false;
  inv[type]--;
  storageSetJSON(STORAGE_KEY, inv);
  return true;
}

export function awardPowerUp(type: PowerUpType, count = 1): void {
  const inv = getInventory();
  inv[type] += count;
  storageSetJSON(STORAGE_KEY, inv);
}

export function awardRandomPowerUp(): PowerUpType {
  const types: PowerUpType[] = ['fiftyFifty', 'extraTime', 'secondChance'];
  const type = types[Math.floor(Math.random() * types.length)];
  awardPowerUp(type);
  return type;
}
