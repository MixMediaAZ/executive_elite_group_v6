import NextAuth from 'next-auth'
import type { NextAuthConfig } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

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
        // Validate environment variables
        if (!process.env.DATABASE_URL) {
          console.error('[AUTH ERROR] DATABASE_URL environment variable is not set')
          return null
        }
        if (!process.env.NEXTAUTH_SECRET && process.env.NODE_ENV === 'production') {
          console.error('[AUTH ERROR] NEXTAUTH_SECRET environment variable is required in production')
          return null
        }

        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const emailInput = (credentials.email as string).trim().toLowerCase()
        const password = credentials.password as string

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
        } catch (queryError: any) {
          if (queryError?.message === 'Database query timeout') {
            console.error('[AUTH ERROR] Database query timed out after 10 seconds')
          } else {
            console.error('[AUTH ERROR] Database query failed:', queryError?.message)
          }
          return null
        }

        if (!user) {
          return null
        }

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
          return null
        }

        if (user.status !== 'ACTIVE') {
          return null
        }

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
  },
  secret: (() => {
    const secret = process.env.NEXTAUTH_SECRET
    if (!secret && process.env.NODE_ENV === 'production') {
      throw new Error('NEXTAUTH_SECRET environment variable is required in production')
    }
    return secret || 'dev-secret-change-in-production'
  })(),
}

// Export auth function and handlers for NextAuth v5 beta
export const { auth, handlers } = NextAuth(authOptions)
