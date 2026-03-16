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
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_INVENTORY));
      return { ...DEFAULT_INVENTORY };
    }
    return { fiftyFifty: raw.fiftyFifty || 0, extraTime: raw.extraTime || 0, secondChance: raw.secondChance || 0 };
  } catch {
    return { ...DEFAULT_INVENTORY };
  }
}

export function usePowerUp(type: PowerUpType): boolean {
  const inv = getInventory();
  if (inv[type] <= 0) return false;
  inv[type]--;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(inv));
  return true;
}

export function awardPowerUp(type: PowerUpType, count = 1): void {
  const inv = getInventory();
  inv[type] += count;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(inv));
}

export function awardRandomPowerUp(): PowerUpType {
  const types: PowerUpType[] = ['fiftyFifty', 'extraTime', 'secondChance'];
  const type = types[Math.floor(Math.random() * types.length)];
  awardPowerUp(type);
  return type;
}
