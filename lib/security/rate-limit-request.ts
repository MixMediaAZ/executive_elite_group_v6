import { NextRequest, NextResponse } from 'next/server'
import { kvRateLimit } from '@/lib/security/kv-rate-limit'

export type RateLimitConfig = {
  keyPrefix: string
  limit: number
  windowSeconds: number
}

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}

/**
 * Apply a KV-backed rate limit to a Node runtime route handler.
 * Returns a NextResponse if limited; otherwise null.
 */
export async function rateLimitRequest(
  request: NextRequest,
  config: RateLimitConfig
): Promise<NextResponse<{ error: string; status: number }> | null> {
  const ip = getClientIp(request)
  const pathname = request.nextUrl.pathname
  const key = `${config.keyPrefix}:${ip}:${request.method}:${pathname}`

  const result = await kvRateLimit({
    key,
    limit: config.limit,
    windowSeconds: config.windowSeconds,
  })

  if (result.limited) {
    return NextResponse.json(
      {
        error: 'Too many requests',
        status: 429,
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': String(result.limit),
          'X-RateLimit-Remaining': '0',
        },
      }
    )
  }

  return null
}

