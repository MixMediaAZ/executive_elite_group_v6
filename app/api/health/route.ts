import { NextResponse } from 'next/server'

/**
 * Health check endpoint for Vercel deployment
 * Returns 200 if server is running, 500 if critical config is missing
 */
import { db } from '@/lib/db'

export async function GET() {
  const checks: Record<string, any> = {
    databaseUrl: !!process.env.DATABASE_URL,
    nextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    nextAuthUrl: !!process.env.NEXTAUTH_URL,
    nodeEnv: process.env.NODE_ENV || 'development',
  }

  // Test database connection if DATABASE_URL is set
  if (checks.databaseUrl) {
    try {
      await db.$queryRaw`SELECT 1`
      checks.databaseConnection = 'connected'
    } catch (error: any) {
      checks.databaseConnection = 'failed'
      checks.databaseError = error?.message || String(error)
      
      // Provide helpful error messages
      if (error?.message?.includes('authentication') || error?.message?.includes('credentials')) {
        checks.databaseErrorHint = 'Authentication failed. Check username format (postgres.xxxxx) and password in DATABASE_URL'
      } else if (error?.message?.includes('reach')) {
        checks.databaseErrorHint = 'Cannot reach database server. Check connection string and network settings'
      }
    }
  } else {
    checks.databaseConnection = 'not_configured'
  }

  const allRequired = checks.databaseUrl && checks.nextAuthSecret && checks.databaseConnection === 'connected'

  return NextResponse.json(
    {
      status: allRequired ? 'healthy' : 'degraded',
      checks,
      timestamp: new Date().toISOString(),
    },
    { status: allRequired ? 200 : 500 }
  )
}

