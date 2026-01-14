/**
 * CSRF Protection Middleware
 * Provides Cross-Site Request Forgery protection for forms and API endpoints
 */

import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'

// CSRF Token Store (in production, use Redis or database)
const csrfTokens = new Map<string, string>()

// CSRF Token cleanup interval (remove expired tokens every hour)
setInterval(() => {
  const now = Date.now()
  // In a real implementation, we would track token expiration times
  // For this memory-based store, we can't automatically clean up
  // This is why Redis/database storage is recommended for production
}, 60 * 60 * 1000)

// Generate CSRF token
export function generateCsrfToken(): string {
  return randomBytes(32).toString('hex')
}

// Store CSRF token for session
export function storeCsrfToken(sessionId: string, token: string): void {
  csrfTokens.set(sessionId, token)
}

// Validate CSRF token
export function validateCsrfToken(sessionId: string, token: string): boolean {
  const storedToken = csrfTokens.get(sessionId)
  return storedToken === token
}

// CSRF Protection Middleware
export async function csrfMiddleware(request: NextRequest): Promise<NextResponse> {
  const { pathname, searchParams } = request.nextUrl
  const sessionId = request.cookies.get('sessionId')?.value || 'anonymous'

  // Generate and store CSRF token if not present
  if (!csrfTokens.has(sessionId)) {
    const csrfToken = generateCsrfToken()
    storeCsrfToken(sessionId, csrfToken)

    // Set CSRF token in cookie
    const response = NextResponse.next()
    response.cookies.set('X-CSRF-Token', csrfToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    })
    return response
  }

  // Skip CSRF check for GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    return NextResponse.next()
  }

  // Validate CSRF token for POST, PUT, DELETE, PATCH requests
  const csrfToken = request.headers.get('X-CSRF-Token') || searchParams.get('csrfToken')

  if (!csrfToken || !validateCsrfToken(sessionId, csrfToken)) {
    return new NextResponse(JSON.stringify({
      error: 'Invalid CSRF token',
      status: 403
    }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  return NextResponse.next()
}

// Get CSRF token for client-side use
export function getCsrfToken(request: NextRequest): string | null {
  const sessionId = request.cookies.get('sessionId')?.value || 'anonymous'
  return csrfTokens.get(sessionId) || null
}