/**
 * Rate Limiting Middleware
 * Protects API endpoints from abuse and brute force attacks
 */

import { NextRequest, NextResponse } from 'next/server'

// Rate limiting store (in production, use Redis)
const rateLimits = new Map<string, { count: number, expires: number }>()

interface RateLimitOptions {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests allowed in window
  keyGenerator?: (request: NextRequest) => string // Custom key generator
}

export class RateLimiter {
  private windowMs: number
  private maxRequests: number
  private keyGenerator: (request: NextRequest) => string

  constructor(options: RateLimitOptions) {
    this.windowMs = options.windowMs
    this.maxRequests = options.maxRequests
    this.keyGenerator = options.keyGenerator || this.defaultKeyGenerator
  }

  private defaultKeyGenerator(request: NextRequest): string {
    // Extract IP from headers (NextRequest doesn't have .ip property)
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
               request.headers.get('x-real-ip') ||
               'unknown'
    return ip
  }

  private cleanupExpired(): void {
    const now = Date.now()
    const expiredKeys: string[] = []

    // Collect expired keys first to avoid modifying map during iteration
    for (const [key, value] of rateLimits.entries()) {
      if (value.expires < now) {
        expiredKeys.push(key)
      }
    }

    // Remove expired entries
    for (const key of expiredKeys) {
      rateLimits.delete(key)
    }
  }

  public async limit(request: NextRequest): Promise<{ limited: boolean, remaining: number, windowMs: number, maxRequests: number }> {
    this.cleanupExpired()

    const key = this.keyGenerator(request)
    const now = Date.now()
    const record = rateLimits.get(key) || { count: 0, expires: now + this.windowMs }

    if (record.expires < now) {
      // Reset counter if window has expired
      record.count = 1
      record.expires = now + this.windowMs
    } else {
      // Increment counter if within window
      record.count++
    }

    rateLimits.set(key, record)

    const limited = record.count > this.maxRequests
    const remaining = Math.max(0, this.maxRequests - record.count)

    return { limited, remaining, windowMs: this.windowMs, maxRequests: this.maxRequests }
  }

  // Get public configuration for headers
  public getConfig(): { windowMs: number, maxRequests: number } {
    return { windowMs: this.windowMs, maxRequests: this.maxRequests }
  }
}

// Default rate limiter instance (100 requests per 15 minutes)
export const apiLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
})

// Strict rate limiter for sensitive endpoints (10 requests per minute)
export const strictLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10,
})

// Rate limiting middleware
export async function rateLimitMiddleware(
  request: NextRequest,
  limiter: RateLimiter = apiLimiter
): Promise<NextResponse> {
  const { limited, remaining } = await limiter.limit(request)

  if (limited) {
    const config = limiter.getConfig()
    return new NextResponse(JSON.stringify({
      error: 'Too many requests',
      status: 429,
      details: `Rate limit exceeded. Try again in ${config.windowMs / 1000 / 60} minutes.`
    }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': config.maxRequests.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': Math.ceil((Date.now() + config.windowMs) / 1000).toString()
      }
    })
  }

  const response = NextResponse.next()
  const config = limiter.getConfig()
  response.headers.set('X-RateLimit-Limit', config.maxRequests.toString())
  response.headers.set('X-RateLimit-Remaining', remaining.toString())
  response.headers.set('X-RateLimit-Reset', Math.ceil((Date.now() + config.windowMs) / 1000).toString())

  return response
}

// Middleware wrapper for easy integration
export function withRateLimiting(
  handler: (request: NextRequest) => Promise<NextResponse>,
  limiter: RateLimiter = apiLimiter
) {
  return async (request: NextRequest) => {
    const rateLimitResponse = await rateLimitMiddleware(request, limiter)
    if (rateLimitResponse.status === 429) {
      return rateLimitResponse
    }
    return handler(request)
  }
}