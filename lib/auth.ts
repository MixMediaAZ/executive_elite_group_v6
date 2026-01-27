import NextAuth from 'next-auth'
import type { NextAuthConfig } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { logger } from './monitoring/logger'

// Lazy import db to avoid PrismaClient instantiation in Edge Runtime (middleware)
// db is only used in the authorize callback which runs in Node.js runtime, not Edge
const getDb = async () => {
  // Dynamic import ensures db is only loaded when authorize is called (Node.js runtime)
  const { db } = await import('./db')
  return db
}

// Helper function to add timeout to database queries
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    ),
  ])
}

export const authOptions: NextAuthConfig = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // #region agent log
        console.log('[AUTH DEBUG] authorize called', {hasCredentials:!!credentials,hasEmail:!!credentials?.email})
        // #endregion
        
        // Validate environment variables
        if (!process.env.DATABASE_URL) {
          console.error('[AUTH ERROR] DATABASE_URL environment variable is not set')
          return null
        }
        
        const authSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET
        if (!authSecret && process.env.NODE_ENV === 'production') {
          console.error('[AUTH ERROR] AUTH_SECRET or NEXTAUTH_SECRET environment variable is required in production')
          return null
        }

        if (!credentials?.email || !credentials?.password) {
          // #region agent log
          console.log('[AUTH DEBUG] missing credentials', {hasEmail:!!credentials?.email,hasPassword:!!credentials?.password})
          // #endregion
          return null
        }

        const emailInput = (credentials.email as string).trim().toLowerCase()
        const password = credentials.password as string
        
        // #region agent log
        logger.info({
          emailPrefix: emailInput.substring(0, 10),
          emailLength: emailInput.length,
          hasPassword: !!password,
          passwordLength: password?.length || 0,
          authUrl: process.env.AUTH_URL,
          nodeEnv: process.env.NODE_ENV
        }, '[AUTH] Credentials received')
        // #endregion

        // Lazy load db only when authorize is called (in Node.js runtime, not Edge)
        let db
        try {
          db = await getDb()
        } catch (dbError: any) {
          console.error('[AUTH ERROR] Failed to get database connection:', dbError?.message)
          return null
        }

        // Case-insensitive lookup so existing mixed-case emails still work
        let user: {
          id: string
          email: string
          passwordHash: string
          role: string
          status: string
          candidateProfile: { id: string } | null
          employerProfile: { id: string } | null
        } | null
        try {
          // #region agent log
          logger.info({
            emailSearched: emailInput,
            emailLength: emailInput.length,
            hasDot: emailInput.includes('.'),
            hasAt: emailInput.includes('@'),
          }, '[AUTH] Starting user lookup')
          // #endregion
          
          const queryPromise = db.user.findFirst({
            where: {
              email: {
                equals: emailInput,
                mode: 'insensitive',
              },
            },
            include: {
              candidateProfile: true,
              employerProfile: true,
            },
          })

          // Add 10-second timeout to database query
          user = await withTimeout(
            queryPromise,
            10000,
            'Database query timeout'
          )
          
          // #region agent log
          logger.info({
            userFound: !!user,
            userId: user?.id,
            userEmail: user?.email,
            emailMatch: user ? user.email.toLowerCase() === emailInput : false,
          }, '[AUTH] User lookup completed')
          // #endregion
        } catch (queryError: any) {
          if (queryError?.message === 'Database query timeout') {
            logger.error({ emailSearched: emailInput }, '[AUTH] Database query timed out after 10 seconds')
          } else {
            logger.error({
              err: {
                message: queryError?.message,
                code: queryError?.code,
                name: queryError?.name,
              },
              emailSearched: emailInput,
              nodeEnv: process.env.NODE_ENV,
              databaseUrl: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 50) + '...' : 'NOT SET'
            }, '[AUTH] Database query failed')
          }
          return null
        }

        if (!user) {
          // #region agent log
          logger.warn({
            emailPrefix: emailInput.substring(0, 5),
            fullEmail: emailInput,
            dbConnected: !!db,
            nodeEnv: process.env.NODE_ENV
          }, '[AUTH] User not found')
          // #endregion
          return null
        }
        
        // #region agent log
        logger.info({
          userId: user.id,
          userEmail: user.email,
          role: user.role,
          status: user.status,
          emailMatched: user.email.toLowerCase() === emailInput
        }, '[AUTH] User found')
        // #endregion

        // Lazy load bcryptjs so middleware/edge bundles don't pull in Node-only APIs
        const bcrypt = await import('bcryptjs')
        let isValid: boolean
        try {
          isValid = await bcrypt.compare(password, user.passwordHash)
        } catch (bcryptError: any) {
          console.error('[AUTH ERROR] Password comparison failed:', bcryptError?.message)
          return null
        }

        if (!isValid) {
          // #region agent log
          logger.warn({
            userId: user.id,
            email: user.email,
            passwordHashLength: user.passwordHash?.length || 0,
            nodeEnv: process.env.NODE_ENV
          }, '[AUTH] Password invalid')
          // #endregion
          return null
        }
        
        // #region agent log
        console.log('[AUTH DEBUG] password valid', {userId:user.id})
        // #endregion

        if (user.status !== 'ACTIVE') {
          // #region agent log
          console.log('[AUTH DEBUG] user not active', {userId:user.id,status:user.status})
          // #endregion
          return null
        }
        
        // #region agent log
        console.log('[AUTH DEBUG] authorize success', {userId:user.id,role:user.role})
        // #endregion

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          candidateProfileId: user.candidateProfile?.id,
          employerProfileId: user.employerProfile?.id,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.candidateProfileId = user.candidateProfileId
        token.employerProfileId = user.employerProfileId
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.candidateProfileId = token.candidateProfileId as string | undefined
        session.user.employerProfileId = token.employerProfileId as string | undefined
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/login',
    signOut: '/',
  },
  session: {
    strategy: 'jwt',
    // Session max age: 30 days (in seconds)
    maxAge: 30 * 24 * 60 * 60,
    // Update session every 24 hours
    updateAge: 24 * 60 * 60,
  },
  // CRITICAL: Required for Vercel deployment - NextAuth v5 needs to trust the proxy host
  trustHost: true,
  // NextAuth v5 prefers AUTH_SECRET, but fallback to NEXTAUTH_SECRET for backward compatibility
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  // Explicitly set base URL for Vercel (NextAuth v5 can infer, but explicit is safer)
  basePath: '/api/auth',
  // Cookie configuration for production deployments (Vercel, etc.)
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' 
        ? '__Secure-authjs.session-token' 
        : 'authjs.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    callbackUrl: {
      name: process.env.NODE_ENV === 'production'
        ? '__Secure-authjs.callback-url'
        : 'authjs.callback-url',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    csrfToken: {
      name: process.env.NODE_ENV === 'production'
        ? '__Host-authjs.csrf-token'
        : 'authjs.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
}

// Export auth function and handlers for NextAuth v5 beta
export const { auth, handlers } = NextAuth(authOptions)
