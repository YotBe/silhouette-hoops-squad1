import { useRef, useCallback } from 'react';

/**
 * Manages a setInterval-based countdown timer.
 * Returns controls to start, clear, and check the timer ref.
 */
export function useTimerRef() {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const start = useCallback((tick: () => void, intervalMs = 1000) => {
    clear();
    timerRef.current = setInterval(tick, intervalMs);
  }, [clear]);

  return { timerRef, clear, start };
}
