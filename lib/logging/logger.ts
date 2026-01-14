/**
 * Comprehensive Logging System
 * Provides structured logging with different levels and contexts
 */

import { NextRequest, NextResponse } from 'next/server'

// Log levels
export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL'

// Log entry interface
export interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: Record<string, unknown>
  userId?: string
  requestId?: string
  metadata?: Record<string, unknown>
}

// Logger configuration
interface LoggerConfig {
  level: LogLevel
  prettyPrint: boolean
}

// Default configuration
const defaultConfig: LoggerConfig = {
  level: process.env.NODE_ENV === 'development' ? 'DEBUG' : 'INFO',
  prettyPrint: process.env.NODE_ENV === 'development'
}

// Log level priorities
const levelPriorities: Record<LogLevel, number> = {
  DEBUG: 1,
  INFO: 2,
  WARN: 3,
  ERROR: 4,
  CRITICAL: 5
}

// Main logger class
export class Logger {
  private config: LoggerConfig

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...defaultConfig, ...config }
  }

  // Check if level should be logged
  private shouldLog(level: LogLevel): boolean {
    return levelPriorities[level] >= levelPriorities[this.config.level]
  }

  // Format log entry
  private formatLog(entry: LogEntry): string {
    if (this.config.prettyPrint) {
      return JSON.stringify(entry, null, 2)
    }
    return JSON.stringify(entry)
  }

  // Log method
  private log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    if (!this.shouldLog(level)) return

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      userId: typeof context?.userId === 'string' ? context.userId : undefined,
      requestId: typeof context?.requestId === 'string' ? context.requestId : undefined
    }

    // In production, this would write to a log file or service
    console.log(this.formatLog(entry))

    // Additional logging for errors
    if (level === 'ERROR' || level === 'CRITICAL') {
      console.error(`${level}: ${message}`, context)
    }
  }

  // Debug level logging
  debug(message: string, context?: Record<string, unknown>): void {
    this.log('DEBUG', message, context)
  }

  // Info level logging
  info(message: string, context?: Record<string, unknown>): void {
    this.log('INFO', message, context)
  }

  // Warn level logging
  warn(message: string, context?: Record<string, unknown>): void {
    this.log('WARN', message, context)
  }

  // Error level logging
  error(message: string, context?: Record<string, unknown>): void {
    this.log('ERROR', message, context)
  }

  // Critical level logging
  critical(message: string, context?: Record<string, unknown>): void {
    this.log('CRITICAL', message, context)
  }

  // Request logging middleware
  static requestLogger(request: NextRequest): void {
    const logger = new Logger()
    const userId = request.cookies.get('userId')?.value || 'anonymous'
    const requestId = request.headers.get('x-request-id') || crypto.randomUUID()

    // Extract IP from headers (NextRequest doesn't have .ip property)
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
               request.headers.get('x-real-ip') ||
               'unknown'

    logger.info('Request started', {
      method: request.method,
      path: request.nextUrl.pathname,
      userId,
      requestId,
      ip,
      userAgent: request.headers.get('user-agent')
    })
  }

  // API call logging
  static apiCallLogger(
    method: string,
    endpoint: string,
    status: number,
    durationMs: number,
    context?: Record<string, unknown>
  ): void {
    const logger = new Logger()
    const level: LogLevel = status >= 500 ? 'ERROR' : status >= 400 ? 'WARN' : 'INFO'

    logger.log(level, `API ${method} ${endpoint} ${status}`, {
      durationMs,
      ...context
    })
  }

  // Database query logging
  static dbQueryLogger(query: string, durationMs: number, success: boolean): void {
    const logger = new Logger()
    const level: LogLevel = success ? 'DEBUG' : 'ERROR'

    logger.log(level, `Database query ${success ? 'succeeded' : 'failed'}`, {
      query,
      durationMs,
      success
    })
  }

  // Authentication logging
  static authLogger(userId: string, action: 'login' | 'logout' | 'failed_attempt', context?: Record<string, unknown>): void {
    const logger = new Logger()
    const level: LogLevel = action === 'failed_attempt' ? 'WARN' : 'INFO'

    logger.log(level, `Authentication ${action}`, {
      userId,
      ...context
    })
  }

  // File operation logging
  static fileOperationLogger(
    operation: 'upload' | 'download' | 'delete',
    filePath: string,
    success: boolean,
    context?: Record<string, unknown>
  ): void {
    const logger = new Logger()
    const level: LogLevel = success ? 'INFO' : 'ERROR'

    logger.log(level, `File ${operation} ${success ? 'succeeded' : 'failed'}`, {
      filePath,
      operation,
      success,
      ...context
    })
  }
}

// Global logger instance
export const logger = new Logger()

// Request logging middleware
export async function withRequestLogging(
  handler: (request: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const start = Date.now()
  const requestId = crypto.randomUUID()

  // Log request start
  Logger.requestLogger(handler as any)

  try {
    const response = await handler(handler as any)
    const duration = Date.now() - start

    // Log request completion
    logger.info('Request completed', {
      durationMs: duration,
      status: response.status,
      requestId
    })

    return response
  } catch (error) {
    const duration = Date.now() - start

    // Log request error
    logger.error('Request failed', {
      durationMs: duration,
      error: error instanceof Error ? error.message : String(error),
      requestId
    })

    throw error
  }
}

// Performance monitoring
export function monitorPerformance<T>(
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = Date.now()
  return fn()
    .then(result => {
      const duration = Date.now() - start
      logger.debug(`Performance: ${operation} completed in ${duration}ms`)
      return result
    })
    .catch(error => {
      const duration = Date.now() - start
      logger.error(`Performance: ${operation} failed after ${duration}ms`, {
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    })
}