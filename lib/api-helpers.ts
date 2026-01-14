/**
 * API Route Helpers
 * Provides consistent error handling and response formatting for API routes
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSessionHelper } from '@/lib/auth-helpers'
import { z } from 'zod'
import { getUserFriendlyError } from './error-messages'
import { logger } from '@/lib/monitoring/logger'
import { getRequestContext } from '@/lib/monitoring/request-context'
import * as Sentry from '@sentry/nextjs'
import {
  createdResponse,
  errorResponse,
  successResponse,
  validateBody,
  type ApiErrorResponse,
  type ApiSuccessResponse,
} from '@/lib/api-core'
import { rateLimitRequest } from '@/lib/security/rate-limit-request'
import { PHASE_PRODUCTION_BUILD } from 'next/constants'

export type { ApiErrorResponse, ApiSuccessResponse }
export { validateBody, successResponse, createdResponse, errorResponse }

/**
 * Session type from auth helper
 */
type Session = NonNullable<Awaited<ReturnType<typeof getServerSessionHelper>>>

/**
 * Wrapper for API route handlers with consistent error handling
 */
export function withApiHandler<T = unknown>(
  handler: (request: NextRequest, context: { session: Session }) => Promise<NextResponse<T | ApiErrorResponse>>,
  options?: {
    requireAuth?: boolean
    requireRole?: 'CANDIDATE' | 'EMPLOYER' | 'ADMIN'
    requireProfile?: 'candidate' | 'employer'
    rateLimit?: false | { limit: number; windowSeconds: number; keyPrefix?: string }
  }
) {
  return async (request: NextRequest): Promise<NextResponse<T | ApiErrorResponse>> => {
    const ctx = getRequestContext()
    try {
      // Node-runtime KV rate limiting (fail-open inside kvRateLimit).
      const rl = options?.rateLimit
      // During `next build`, Next may attempt to statically analyze/execute handlers;
      // avoid reading request headers (which can trigger dynamic server usage errors).
      if (process.env.NEXT_PHASE !== PHASE_PRODUCTION_BUILD && rl !== false) {
        const limited = await rateLimitRequest(request, {
          keyPrefix: rl?.keyPrefix || 'rl',
          limit: rl?.limit ?? 120,
          windowSeconds: rl?.windowSeconds ?? 60,
        })
        if (limited) return limited
      }

      // Check authentication if required
      if (options?.requireAuth !== false) {
        const session = await getServerSessionHelper()
        
        if (!session) {
          return NextResponse.json<ApiErrorResponse>(
            { error: 'Unauthorized', timestamp: new Date().toISOString() },
            { status: 401 }
          )
        }

        // Check role if required
        if (options?.requireRole && session.user.role !== options.requireRole) {
          return NextResponse.json<ApiErrorResponse>(
            { error: 'Forbidden: Insufficient permissions', timestamp: new Date().toISOString() },
            { status: 403 }
          )
        }

        // Check profile if required
        if (options?.requireProfile === 'candidate' && !session.user.candidateProfileId) {
          return NextResponse.json<ApiErrorResponse>(
            { error: 'Candidate profile not found', timestamp: new Date().toISOString() },
            { status: 404 }
          )
        }

        if (options?.requireProfile === 'employer' && !session.user.employerProfileId) {
          return NextResponse.json<ApiErrorResponse>(
            { error: 'Employer profile not found', timestamp: new Date().toISOString() },
            { status: 404 }
          )
        }

        return handler(request, { session })
      }

      // For routes that don't require auth, session may be null
      return handler(request, { session: null as unknown as Session })
    } catch (error) {
      // Capture server-side exceptions (if configured)
      try {
        Sentry.captureException(error, {
          tags: {
            route: request.nextUrl.pathname,
            method: request.method,
          },
          extra: {
            requestId: ctx.requestId,
          },
        })
      } catch {
        // ignore
      }

      // Handle Zod validation errors
      if (error instanceof z.ZodError) {
        const fieldErrors = error.errors.map(err => {
          const field = err.path.join('.') || 'field'
          return `${field}: ${err.message}`
        }).join(', ')
        
        logger.warn(
          {
            requestId: ctx.requestId,
            route: request.nextUrl.pathname,
            method: request.method,
            ip: ctx.ip,
            userAgent: ctx.userAgent,
            validationErrors: error.errors,
          },
          'API validation failed'
        )

        return NextResponse.json<ApiErrorResponse>(
          { 
            error: `Validation failed: ${fieldErrors}`,
            details: error.errors,
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        )
      }

      // Use centralized error handler
      const friendlyError = getUserFriendlyError(error)

      logger.error(
        {
          requestId: ctx.requestId,
          route: request.nextUrl.pathname,
          method: request.method,
          ip: ctx.ip,
          userAgent: ctx.userAgent,
          status: friendlyError.status,
          details: friendlyError.details,
          err:
            error instanceof Error
              ? { name: error.name, message: error.message, stack: error.stack }
              : { message: String(error) },
        },
        'API handler error'
      )
      
      return NextResponse.json<ApiErrorResponse>(
        {
          error: friendlyError.message,
          details: friendlyError.details,
          timestamp: new Date().toISOString()
        },
        { status: friendlyError.status }
      )
    }
  }
}

