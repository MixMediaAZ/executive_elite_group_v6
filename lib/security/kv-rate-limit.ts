import { kv } from '@vercel/kv'
import { logger } from '@/lib/monitoring/logger'

export type RateLimitResult =
  | { limited: false; remaining: number; limit: number; resetSeconds: number }
  | { limited: true; remaining: 0; limit: number; resetSeconds: number }

export type RateLimitOptions = {
  key: string
  limit: number
  windowSeconds: number
}

/**
 * Fixed-window rate limiter backed by Vercel KV.
 * Uses atomic INCR and sets EXPIRE on first hit.
 */
export async function kvRateLimit(opts: RateLimitOptions): Promise<RateLimitResult> {
  const { key, limit, windowSeconds } = opts

  try {
    const current = await kv.incr(key)
    if (current === 1) {
      await kv.expire(key, windowSeconds)
    }

    const remaining = Math.max(0, limit - current)
    const limited = current > limit
    return limited
      ? { limited: true, remaining: 0, limit, resetSeconds: windowSeconds }
      : { limited: false, remaining, limit, resetSeconds: windowSeconds }
  } catch (err) {
    // Fail-open: don't take down the API if KV is misconfigured.
    logger.warn(
      { key, err: err instanceof Error ? { message: err.message } : { message: String(err) } },
      'KV rate limit failed (fail-open)'
    )
    return { limited: false, remaining: limit, limit, resetSeconds: windowSeconds }
  }
}

