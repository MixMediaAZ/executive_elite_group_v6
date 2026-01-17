import { NextRequest, NextResponse } from 'next/server'

// Diagnostic endpoint to check auth configuration on Vercel
// DELETE THIS FILE after debugging is complete
export async function GET(request: NextRequest) {
  const diagnostics: Record<string, any> = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    checks: {},
  }

  // Check 1: Environment variables
  diagnostics.checks.env = {
    DATABASE_URL: !!process.env.DATABASE_URL ? 'SET' : 'MISSING',
    DATABASE_URL_preview: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 30) + '...' : 'N/A',
    NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET ? 'SET' : 'MISSING',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'NOT SET',
    AUTH_URL: process.env.AUTH_URL || 'NOT SET',
  }

  // Check 2: Database connection
  try {
    const startTime = Date.now()
    const { db } = await import('@/lib/db')
    
    // Try a simple query with timeout
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('DB query timeout after 5s')), 5000)
    )
    
    const queryPromise = db.user.count()
    const userCount = await Promise.race([queryPromise, timeoutPromise])
    
    diagnostics.checks.database = {
      status: 'CONNECTED',
      duration: Date.now() - startTime + 'ms',
      userCount,
    }
  } catch (dbError: any) {
    diagnostics.checks.database = {
      status: 'FAILED',
      error: dbError?.message || String(dbError),
    }
  }

  // Check 3: Test user lookup (using a known admin email)
  try {
    const { db } = await import('@/lib/db')
    const testEmail = 'mixmediaaz@gmail.com' // lowercase version
    
    const startTime = Date.now()
    const user = await db.user.findFirst({
      where: {
        email: {
          equals: testEmail,
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
      },
    })
    
    diagnostics.checks.userLookup = {
      status: user ? 'FOUND' : 'NOT_FOUND',
      duration: Date.now() - startTime + 'ms',
      user: user ? {
        id: user.id.substring(0, 8) + '...',
        email: user.email,
        role: user.role,
        status: user.status,
      } : null,
    }
  } catch (lookupError: any) {
    diagnostics.checks.userLookup = {
      status: 'ERROR',
      error: lookupError?.message || String(lookupError),
    }
  }

  // Check 4: Request headers (to verify host trust)
  diagnostics.checks.request = {
    host: request.headers.get('host'),
    xForwardedHost: request.headers.get('x-forwarded-host'),
    xForwardedProto: request.headers.get('x-forwarded-proto'),
    origin: request.headers.get('origin'),
  }

  return NextResponse.json(diagnostics, { 
    status: 200,
    headers: {
      'Cache-Control': 'no-store',
    },
  })
}
