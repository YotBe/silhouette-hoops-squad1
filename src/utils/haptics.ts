const STORAGE_KEY = 'sg_haptics';
const WELCOME_KEY = 'sg_haptics_welcome';

export function isHapticsEnabled(): boolean {
  try { return localStorage.getItem(STORAGE_KEY) !== '0'; } catch { return true; }
}

export function isWelcomeHapticsEnabled(): boolean {
  try { return localStorage.getItem(WELCOME_KEY) !== '0'; } catch { return true; }
}

export function setWelcomeHapticsEnabled(enabled: boolean): void {
  localStorage.setItem(WELCOME_KEY, enabled ? '1' : '0');
}

export function setHapticsEnabled(enabled: boolean): void {
  localStorage.setItem(STORAGE_KEY, enabled ? '1' : '0');
}

function vibrate(pattern: number[]): void {
  if (!isHapticsEnabled()) return;
  navigator.vibrate?.(pattern);
}

/** Correct answer / card captured: single short medium tap */
export function hapticSuccess(): void { vibrate([40]); }

/** Wrong answer / timeout: two-pulse pattern, under 220ms total */
export function hapticError(): void { vibrate([80, 60, 80]); }

/** UI interaction (hint, power-up): light tap */
export function hapticLight(): void { vibrate([25]); }

/** Reveal moment: very light single tap */
export function hapticReveal(): void { vibrate([25]); }

/** Countdown last 3s: tiny tension tap */
export function hapticCountdown(): void { vibrate([15]); }

/** Button press: ultra-light tap */
export function hapticPress(): void { vibrate([10]); }

/**
 * Welcome build-up: three escalating pulses (Light → Medium → Heavy)
 * with 50ms gaps — mimics the Yahoo Fantasy startup ramp.
 * Pattern: [light, gap, medium, gap, heavy]
 */
export function hapticWelcome(): void { vibrate([30, 50, 60, 50, 100]); }
