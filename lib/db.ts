// Detect Edge Runtime - PrismaClient cannot run in Edge Runtime
const isEdgeRuntime = (typeof process !== 'undefined' && process.env.NEXT_RUNTIME === 'edge')

const globalForPrisma = globalThis as unknown as {
  prisma: any | undefined
}

/**
 * Database connection wrapper
 * Requires DATABASE_URL to be set in environment variables
 * 
 * Note: PrismaClient cannot be used in Edge Runtime (middleware, edge routes)
 * This module uses lazy loading to prevent PrismaClient from being instantiated during module evaluation
 */

// Create a proxy that lazily loads PrismaClient only when methods are called
// This prevents PrismaClient from being instantiated during module evaluation
export const db = new Proxy({} as any, {
  get(_target, prop) {
    if (isEdgeRuntime) {
      throw new Error(
        'PrismaClient cannot be used in Edge Runtime. ' +
        'This module should only be imported in Node.js runtime contexts (API routes, server components). ' +
        'If you see this error in middleware, ensure db is not imported there.'
      )
    }

    // Lazy load the PrismaClient instance
    if (!globalForPrisma.prisma) {
      try {
        // Create instance synchronously for immediate use
        // This will only work in Node.js runtime
        const PrismaClient = require('@prisma/client').PrismaClient
        if (!process.env.DATABASE_URL) {
          throw new Error('DATABASE_URL environment variable is required. Please set it in your .env file.')
        }
        // Validate DATABASE_URL format before creating PrismaClient
        const dbUrl = process.env.DATABASE_URL
        if (dbUrl) {
          try {
            const url = new URL(dbUrl)
            // Check for common Supabase connection string issues
            if (url.hostname.includes('supabase') && !url.username.includes('.')) {
              console.warn('⚠️  Warning: Supabase connection string should use format: postgres.xxxxx (with project ID)')
            }
            if (!url.searchParams.has('sslmode')) {
              console.warn('⚠️  Warning: Missing sslmode=require in DATABASE_URL. Add ?sslmode=require')
            }
          } catch (e) {
            // URL parsing failed, but let Prisma handle the error
          }
        }

        globalForPrisma.prisma = new PrismaClient({
          log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
          errorFormat: 'pretty',
        })
      } catch (error) {
        throw new Error(
          `Failed to load PrismaClient: ${error instanceof Error ? error.message : String(error)}. ` +
          'This usually means you are trying to use PrismaClient in Edge Runtime (middleware). ' +
          'Ensure db is only imported in Node.js runtime contexts (API routes, server components).'
        )
      }
    }

    const instance = globalForPrisma.prisma
    const value = instance[prop]
    
    // If it's a function, bind it to the instance
    if (typeof value === 'function') {
      return value.bind(instance)
    }
    
    return value
  }
})

// Database connection for fresh Supabase database
// All tables are created in the default 'public' schema
// Run `npm run db:setup` to create all tables and seed data
// DATABASE_URL environment variable is required

