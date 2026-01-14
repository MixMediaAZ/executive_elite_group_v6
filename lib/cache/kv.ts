import { kv } from '@vercel/kv'
import { logger } from '@/lib/monitoring/logger'

export async function kvGetJson<T>(key: string): Promise<T | null> {
  try {
    return (await kv.get<T>(key)) ?? null
  } catch (err) {
    logger.warn({ key, err: err instanceof Error ? { message: err.message } : { message: String(err) } }, 'KV get failed')
    return null
  }
}

export async function kvSetJson<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  try {
    // setex expects seconds
    await kv.setex(key, ttlSeconds, value as any)
  } catch (err) {
    logger.warn({ key, err: err instanceof Error ? { message: err.message } : { message: String(err) } }, 'KV set failed')
  }
}

export async function kvCached<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<{ value: T; cache: 'hit' | 'miss' }> {
  const cached = await kvGetJson<T>(key)
  if (cached !== null) return { value: cached, cache: 'hit' }

  const fresh = await fetcher()
  await kvSetJson(key, fresh, ttlSeconds)
  return { value: fresh, cache: 'miss' }
}

