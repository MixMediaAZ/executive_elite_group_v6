/**
 * User-friendly error messages for API responses
 */

export interface ApiError {
  message: string
  status: number
  details?: unknown
}

/**
 * Get user-friendly error message from various error types
 */
export function getUserFriendlyError(error: unknown): ApiError {
  // Zod validation errors
  if (error && typeof error === 'object' && 'issues' in error) {
    const zodError = error as { issues: Array<{ path: string[]; message: string }> }
    const firstIssue = zodError.issues[0]
    const field = firstIssue.path.join('.')
    return {
      message: `Invalid ${field}: ${firstIssue.message}`,
      status: 400,
      details: zodError.issues,
    }
  }

  // Prisma errors
  if (error && typeof error === 'object' && 'code' in error) {
    const prismaError = error as { code: string; message: string }
    
    switch (prismaError.code) {
      case 'P2002':
        return {
          message: 'This record already exists. Please check for duplicates.',
          status: 400,
        }
      case 'P2025':
        return {
          message: 'The requested record was not found.',
          status: 404,
        }
      case 'P2003':
        return {
          message: 'Invalid reference. The related record does not exist.',
          status: 400,
        }
      case 'P2014':
        return {
          message: 'Invalid data relationship. Please check your input.',
          status: 400,
        }
      default:
        return {
          message: 'A database error occurred. Please try again.',
          status: 500,
        }
    }
  }

  // Database connection errors
  if (error && typeof error === 'object' && 'message' in error) {
    const errorMessage = String((error as { message: string }).message).toLowerCase()
    
    if (errorMessage.includes('authentication') || errorMessage.includes('credentials') || errorMessage.includes('password')) {
      return {
        message: 'Database authentication failed. Please check your DATABASE_URL credentials in Vercel environment variables.',
        status: 500,
        details: {
          hint: 'For Supabase: Use format postgresql://postgres.xxxxx:PASSWORD@aws-0-us-west-2.pooler.supabase.com:5432/postgres?sslmode=require',
          commonIssues: [
            'Username should be "postgres.xxxxx" (with project ID)',
            'Password must be URL-encoded if it contains special characters',
            'Get connection string from Supabase Dashboard → Settings → Database',
            'Use "Session mode" connection string for best compatibility'
          ]
        }
      }
    }
    
    if (errorMessage.includes('connect') || errorMessage.includes('connection')) {
      return {
        message: 'Unable to connect to the database. Please check your connection settings.',
        status: 500,
      }
    }
    
    if (errorMessage.includes('timeout')) {
      return {
        message: 'Request timed out. Please try again.',
        status: 504,
      }
    }
  }

  // Default error
  return {
    message: 'An unexpected error occurred. Please try again later.',
    status: 500,
  }
}

/**
 * Format validation errors for display
 */
export function formatValidationErrors(errors: Array<{ path: string[]; message: string }>): string {
  return errors.map(err => {
    const field = err.path.join('.') || 'field'
    return `${field}: ${err.message}`
  }).join(', ')
}

