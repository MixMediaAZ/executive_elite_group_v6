/**
 * Unit test for KV rate limit behavior using a jest mock for @vercel/kv.
 */

jest.mock('@vercel/kv', () => {
  const store = new Map<string, { value: number; expiresAt: number | null }>()
  return {
    kv: {
      incr: async (key: string) => {
        const existing = store.get(key)
        const next = (existing?.value ?? 0) + 1
        store.set(key, { value: next, expiresAt: existing?.expiresAt ?? null })
        return next
      },
      expire: async (key: string, seconds: number) => {
        const existing = store.get(key) ?? { value: 0, expiresAt: null }
        existing.expiresAt = Date.now() + seconds * 1000
        store.set(key, existing)
        return 1
      },
    },
  }
})

import { kvRateLimit } from '@/lib/security/kv-rate-limit'

describe('kvRateLimit', () => {
  test('allows up to limit and then limits', async () => {
    const key = 'rl:test'
    const limit = 3
    const windowSeconds = 60

    const r1 = await kvRateLimit({ key, limit, windowSeconds })
    expect(r1.limited).toBe(false)

    const r2 = await kvRateLimit({ key, limit, windowSeconds })
    expect(r2.limited).toBe(false)

    const r3 = await kvRateLimit({ key, limit, windowSeconds })
    expect(r3.limited).toBe(false)

    const r4 = await kvRateLimit({ key, limit, windowSeconds })
    expect(r4.limited).toBe(true)
  })
})

