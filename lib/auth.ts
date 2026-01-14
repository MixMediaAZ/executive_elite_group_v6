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

export const authOptions: NextAuthConfig = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const email = credentials.email as string
        const password = credentials.password as string

        // Lazy load db only when authorize is called (in Node.js runtime, not Edge)
        const db = await getDb()
        const user = await db.user.findUnique({
          where: { email },
          include: {
            candidateProfile: true,
            employerProfile: true,
          },
        })

        if (!user) {
          return null
        }

        // Lazy load bcryptjs so middleware/edge bundles don't pull in Node-only APIs
        const bcrypt = await import('bcryptjs')
        const isValid = await bcrypt.compare(password, user.passwordHash)

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
