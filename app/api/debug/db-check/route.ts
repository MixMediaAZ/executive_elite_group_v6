import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Diagnostic endpoint to check database connection, tables, and users
// DELETE THIS FILE after debugging is complete
export async function GET(request: NextRequest) {
  const diagnostics: Record<string, any> = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    checks: {},
  }

  // Check 1: Database connection
  try {
    await db.$queryRaw`SELECT 1 as test`
    diagnostics.checks.connection = { status: 'CONNECTED' }
  } catch (error: any) {
    diagnostics.checks.connection = {
      status: 'FAILED',
      error: error?.message || String(error),
    }
    return NextResponse.json(diagnostics, { status: 500 })
  }

  // Check 2: Check if User table exists and get schema
  try {
    const tablesResult = await db.$queryRaw<Array<{ table_name: string; table_schema: string }>>`
      SELECT table_name, table_schema 
      FROM information_schema.tables 
      WHERE table_name = 'User'
        AND table_schema NOT IN ('information_schema', 'pg_catalog')
    `
    diagnostics.checks.userTable = {
      status: tablesResult.length > 0 ? 'EXISTS' : 'NOT_FOUND',
      tables: tablesResult,
    }
  } catch (error: any) {
    diagnostics.checks.userTable = {
      status: 'ERROR',
      error: error?.message || String(error),
    }
  }

  // Check 3: Try to query User table directly
  try {
    const userCount = await db.user.count()
    diagnostics.checks.userQuery = {
      status: 'SUCCESS',
      userCount,
    }
  } catch (error: any) {
    diagnostics.checks.userQuery = {
      status: 'FAILED',
      error: error?.message || String(error),
      errorCode: (error as any)?.code,
    }
  }

  // Check 4: Check for admin users
  try {
    const adminUsers = await db.user.findMany({
      where: { role: 'ADMIN' },
      select: {
        id: true,
        email: true,
        status: true,
        createdAt: true,
      },
      take: 10,
    })
    diagnostics.checks.adminUsers = {
      status: 'SUCCESS',
      count: adminUsers.length,
      users: adminUsers.map(u => ({
        id: u.id.substring(0, 8) + '...',
        email: u.email,
        status: u.status,
      })),
    }
  } catch (error: any) {
    diagnostics.checks.adminUsers = {
      status: 'FAILED',
      error: error?.message || String(error),
    }
  }

  // Check 5: Try to find both admin emails (test exact match and case-insensitive)
  try {
    const admin1Email = 'mixmediaaz@gmail.com'
    const admin2Email = 'spencer.coon@executiveelitegroup.com'
    
    // Test both exact and case-insensitive queries
    const [user1Exact, user1Insensitive, user2Exact, user2Insensitive] = await Promise.all([
      db.user.findFirst({
        where: { email: admin1Email.toLowerCase() },
        select: { id: true, email: true, role: true, status: true },
      }),
      db.user.findFirst({
        where: {
          email: { equals: admin1Email.toLowerCase(), mode: 'insensitive' },
        },
        select: { id: true, email: true, role: true, status: true },
      }),
      db.user.findFirst({
        where: { email: admin2Email.toLowerCase() },
        select: { id: true, email: true, role: true, status: true },
      }),
      db.user.findFirst({
        where: {
          email: { equals: admin2Email.toLowerCase(), mode: 'insensitive' },
        },
        select: { id: true, email: true, role: true, status: true },
      }),
    ])
    
    const [user1, user2] = [user1Insensitive || user1Exact, user2Insensitive || user2Exact]
    
    diagnostics.checks.admin1User = {
      status: user1 ? 'FOUND' : 'NOT_FOUND',
      email: admin1Email,
      user: user1 ? {
        id: user1.id.substring(0, 8) + '...',
        email: user1.email,
        role: user1.role,
        status: user1.status,
        hasPasswordHash: !!user1.passwordHash,
        passwordHashLength: user1.passwordHash?.length || 0,
      } : null,
    }
    
    diagnostics.checks.admin2User = {
      status: user2 ? 'FOUND' : 'NOT_FOUND',
      email: admin2Email,
      user: user2 ? {
        id: user2.id.substring(0, 8) + '...',
        email: user2.email,
        role: user2.role,
        status: user2.status,
        hasPasswordHash: !!user2.passwordHash,
        passwordHashLength: user2.passwordHash?.length || 0,
      } : null,
    }
  } catch (error: any) {
    diagnostics.checks.admin1User = {
      status: 'ERROR',
      error: error?.message || String(error),
    }
    diagnostics.checks.admin2User = {
      status: 'ERROR',
      error: error?.message || String(error),
    }
  }

  // Check 6: List all schemas
  try {
    const schemasResult = await db.$queryRaw<Array<{ schema_name: string }>>`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
      ORDER BY schema_name
    `
    diagnostics.checks.schemas = {
      status: 'SUCCESS',
      schemas: schemasResult.map(s => s.schema_name),
    }
  } catch (error: any) {
    diagnostics.checks.schemas = {
      status: 'ERROR',
      error: error?.message || String(error),
    }
  }

  return NextResponse.json(diagnostics, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store',
    },
  })
}
