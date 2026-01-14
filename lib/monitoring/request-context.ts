import { headers } from 'next/headers'
import crypto from 'crypto'

export type RequestContext = {
  requestId: string
  ip?: string
  userAgent?: string
}

/**
 * Best-effort request context for server components / route handlers.
 * Safe to call even when headers() is unavailable (returns only requestId).
 */
export function getRequestContext(): RequestContext {
  const requestId = crypto.randomUUID()
  try {
    const h = headers()
    const ip =
      h.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      h.get('x-real-ip') ||
      undefined
    const userAgent = h.get('user-agent') || undefined
    return { requestId, ip, userAgent }
  } catch {
    return { requestId }
  }
}

