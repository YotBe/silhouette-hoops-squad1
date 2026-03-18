/**
 * Token-bucket rate limiter for API calls.
 *
 * Usage:
 *   const limiter = createRateLimiter({ maxRequests: 5, windowMs: 10_000 });
 *   if (!limiter.tryConsume()) throw new Error('Rate limited');
 *
 * Also exports withRetry() for retrying failed async operations
 * with exponential back-off — useful for Supabase network errors.
 */

export interface RateLimiterOptions {
  /** Max number of requests allowed in the time window */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
}

export interface RateLimiter {
  /** Returns true and consumes a token if under the limit, otherwise false */
  tryConsume(): boolean;
  /** Remaining tokens in the current window */
  remaining(): number;
  /** Reset the limiter (useful in tests) */
  reset(): void;
}

export function createRateLimiter(opts: RateLimiterOptions): RateLimiter {
  let tokens = opts.maxRequests;
  let windowStart = Date.now();

  return {
    tryConsume() {
      const now = Date.now();
      if (now - windowStart >= opts.windowMs) {
        tokens = opts.maxRequests;
        windowStart = now;
      }
      if (tokens > 0) {
        tokens--;
        return true;
      }
      return false;
    },
    remaining() {
      const now = Date.now();
      if (now - windowStart >= opts.windowMs) return opts.maxRequests;
      return tokens;
    },
    reset() {
      tokens = opts.maxRequests;
      windowStart = Date.now();
    },
  };
}

export interface RetryOptions {
  /** Maximum number of attempts (including the first try) */
  maxAttempts?: number;
  /** Initial delay in ms before first retry */
  initialDelayMs?: number;
  /** Multiplier applied to delay after each failure */
  backoffFactor?: number;
  /** Called on each failed attempt with the error and attempt number */
  onRetry?: (error: unknown, attempt: number) => void;
}

/**
 * Retries an async operation with exponential back-off.
 * Throws the last error if all attempts are exhausted.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: RetryOptions = {},
): Promise<T> {
  const {
    maxAttempts = 4,
    initialDelayMs = 2000,
    backoffFactor = 2,
    onRetry,
  } = opts;

  let lastError: unknown;
  let delay = initialDelayMs;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < maxAttempts) {
        onRetry?.(err, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= backoffFactor;
      }
    }
  }

  throw lastError;
}

/** Shared limiters for external APIs */
export const supabaseLimiter = createRateLimiter({ maxRequests: 20, windowMs: 10_000 });
export const claudeLimiter = createRateLimiter({ maxRequests: 5, windowMs: 60_000 });
