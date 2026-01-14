/**
 * Comprehensive Error Handling System
 * Standardizes error responses and provides consistent error handling
 */

import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { logger } from '../logging/logger'

// Standard error types
export type AppErrorType =
  | 'VALIDATION_ERROR'
  | 'AUTHENTICATION_ERROR'
  | 'AUTHORIZATION_ERROR'
  | 'NOT_FOUND_ERROR'
  | 'RATE_LIMIT_ERROR'
  | 'FILE_UPLOAD_ERROR'
  | 'DATABASE_ERROR'
  | 'INTERNAL_SERVER_ERROR'

// Standard error response format
export interface ErrorResponse {
  error: string
  status: number
  type: AppErrorType
  details?: string | object
  timestamp: string
}

// Custom error class
export class AppError extends Error {
  constructor(
    public message: string,
    public status: number,
    public type: AppErrorType,
    public details?: string | object
  ) {
    super(message)
    this.name = 'AppError'
  }
}

// Handle Zod validation errors
export function handleZodError(error: ZodError): ErrorResponse {
  const errors = error.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message
  }))

  return {
    error: 'Validation failed',
    status: 400,
    type: 'VALIDATION_ERROR',
    details: errors,
    timestamp: new Date().toISOString()
  }
}

// Handle authentication errors
export function handleAuthError(): ErrorResponse {
  return {
    error: 'Authentication required',
    status: 401,
    type: 'AUTHENTICATION_ERROR',
    timestamp: new Date().toISOString()
  }
}

// Handle authorization errors
export function handleAuthzError(): ErrorResponse {
  return {
    error: 'Permission denied',
    status: 403,
    type: 'AUTHORIZATION_ERROR',
    timestamp: new Date().toISOString()
  }
}

// Handle not found errors
export function handleNotFoundError(resource: string): ErrorResponse {
  return {
    error: `${resource} not found`,
    status: 404,
    type: 'NOT_FOUND_ERROR',
    timestamp: new Date().toISOString()
  }
}

// Handle rate limit errors
export function handleRateLimitError(): ErrorResponse {
  return {
    error: 'Too many requests',
    status: 429,
    type: 'RATE_LIMIT_ERROR',
    timestamp: new Date().toISOString()
  }
}

// Handle file upload errors
export function handleFileUploadError(details: string): ErrorResponse {
  return {
    error: 'File upload failed',
    status: 400,
    type: 'FILE_UPLOAD_ERROR',
    details,
    timestamp: new Date().toISOString()
  }
}

// Handle database errors
export function handleDatabaseError(error: unknown): ErrorResponse {
  return {
    error: 'Database operation failed',
    status: 500,
    type: 'DATABASE_ERROR',
    details: process.env.NODE_ENV === 'development' ? String(error) : 'Database error occurred',
    timestamp: new Date().toISOString()
  }
}

// Handle internal server errors
export function handleInternalError(error: unknown): ErrorResponse {
  // Log the error with context
  logger.error('Internal server error occurred', {
    error: error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name
    } : String(error),
    timestamp: new Date().toISOString()
  })

  // Extract more detailed error information for development
  let errorDetails: string | object = 'Internal server error occurred'

  if (process.env.NODE_ENV === 'development') {
    if (error instanceof Error) {
      errorDetails = {
        message: error.message,
        stack: error.stack,
        name: error.name
      }
    } else {
      errorDetails = String(error)
    }
  }

  return {
    error: 'Internal server error',
    status: 500,
    type: 'INTERNAL_SERVER_ERROR',
    details: errorDetails,
    timestamp: new Date().toISOString()
  }
}

// Standard error response handler
export function errorResponse(error: ErrorResponse): NextResponse {
  return NextResponse.json(error, {
    status: error.status,
    headers: {
      'Content-Type': 'application/json',
      'X-Error-Type': error.type
    }
  })
}

// Error handling middleware
export async function errorHandler(
  fn: () => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    return await fn()
  } catch (error) {
    if (error instanceof AppError) {
      return errorResponse({
        error: error.message,
        status: error.status,
        type: error.type,
        details: error.details,
        timestamp: new Date().toISOString()
      })
    }

    if (error instanceof ZodError) {
      return errorResponse(handleZodError(error))
    }

    if (error instanceof Error) {
      return errorResponse(handleInternalError(error))
    }

    return errorResponse(handleInternalError(error))
  }
}

// API route error wrapper
export function withErrorHandling(
  handler: (request: Request) => Promise<Response>
): (request: Request) => Promise<Response> {
  return async (request: Request) => {
    try {
      return await handler(request)
    } catch (error) {
      if (error instanceof AppError) {
        return new Response(JSON.stringify({
          error: error.message,
          status: error.status,
          type: error.type,
          details: error.details,
          timestamp: new Date().toISOString()
        }), {
          status: error.status,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      if (error instanceof ZodError) {
        const response = handleZodError(error)
        return new Response(JSON.stringify(response), {
          status: response.status,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      const response = handleInternalError(error)
      return new Response(JSON.stringify(response), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  }
}