import NextAuth from 'next-auth'
import type { NextAuthConfig } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

// Lazy import db to avoid PrismaClient instantiation in Edge Runtime (middleware)
// db is only used in the authorize callback which runs in Node.js runtime, not Edge
const getDb = async () => {
  // #region agent log
  fetch('http://127.0.0.1:7252/ingest/af4f18b1-607b-409e-9a53-dc7dabb167e7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth.ts:getDb',message:'getDb called',data:{hasDbUrl:!!process.env.DATABASE_URL},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion

  const startTime = Date.now()
  try {
    // Dynamic import ensures db is only loaded when authorize is called (Node.js runtime)
    const { db } = await import('./db')
    // #region agent log
    fetch('http://127.0.0.1:7252/ingest/af4f18b1-607b-409e-9a53-dc7dabb167e7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth.ts:getDb',message:'getDb completed',data:{duration:Date.now()-startTime,hasDb:!!db},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    return db
  } catch (err: any) {
    // #region agent log
    fetch('http://127.0.0.1:7252/ingest/af4f18b1-607b-409e-9a53-dc7dabb167e7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth.ts:getDb',message:'getDb error',data:{duration:Date.now()-startTime,error:err?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    throw err
  }
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
        fetch('http://127.0.0.1:7252/ingest/af4f18b1-607b-409e-9a53-dc7dabb167e7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth.ts:authorize',message:'authorize called',data:{hasEmail:!!credentials?.email,hasPassword:!!credentials?.password,nodeEnv:process.env.NODE_ENV},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion

        // Validate environment variables
        if (!process.env.DATABASE_URL) {
          // #region agent log
          fetch('http://127.0.0.1:7252/ingest/af4f18b1-607b-409e-9a53-dc7dabb167e7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth.ts:authorize',message:'DATABASE_URL missing',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
          // #endregion
          console.error('[AUTH ERROR] DATABASE_URL environment variable is not set')
          return null
        }
        if (!process.env.NEXTAUTH_SECRET && process.env.NODE_ENV === 'production') {
          // #region agent log
          fetch('http://127.0.0.1:7252/ingest/af4f18b1-607b-409e-9a53-dc7dabb167e7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth.ts:authorize',message:'NEXTAUTH_SECRET missing',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
          // #endregion
          console.error('[AUTH ERROR] NEXTAUTH_SECRET environment variable is required in production')
          return null
        }

        if (!credentials?.email || !credentials?.password) {
          // #region agent log
          fetch('http://127.0.0.1:7252/ingest/af4f18b1-607b-409e-9a53-dc7dabb167e7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth.ts:authorize',message:'Missing credentials',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
          // #endregion
          return null
        }

        const emailInput = (credentials.email as string).trim().toLowerCase()
        const password = credentials.password as string

        // #region agent log
        fetch('http://127.0.0.1:7252/ingest/af4f18b1-607b-409e-9a53-dc7dabb167e7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth.ts:authorize',message:'Before getDb call',data:{emailInput:emailInput.substring(0,10)+'...'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion

        // Lazy load db only when authorize is called (in Node.js runtime, not Edge)
        let db
        const getDbStartTime = Date.now()
        try {
          db = await getDb()
          // #region agent log
          fetch('http://127.0.0.1:7252/ingest/af4f18b1-607b-409e-9a53-dc7dabb167e7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth.ts:authorize',message:'getDb completed',data:{duration:Date.now()-getDbStartTime,hasDb:!!db},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
          // #endregion
        } catch (dbError: any) {
          // #region agent log
          fetch('http://127.0.0.1:7252/ingest/af4f18b1-607b-409e-9a53-dc7dabb167e7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth.ts:authorize',message:'getDb error',data:{duration:Date.now()-getDbStartTime,error:dbError?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
          // #endregion
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
          fetch('http://127.0.0.1:7252/ingest/af4f18b1-607b-409e-9a53-dc7dabb167e7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth.ts:authorize',message:'Before database query',data:{emailInput:emailInput.substring(0,10)+'...'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
          // #endregion

          const queryStartTime = Date.now()
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

          // #region agent log
          fetch('http://127.0.0.1:7252/ingest/af4f18b1-607b-409e-9a53-dc7dabb167e7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth.ts:authorize',message:'Before withTimeout wrapper',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
          // #endregion

          // Add 10-second timeout to database query
          user = await withTimeout(
            queryPromise,
            10000,
            'Database query timeout'
          )

          // #region agent log
          fetch('http://127.0.0.1:7252/ingest/af4f18b1-607b-409e-9a53-dc7dabb167e7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth.ts:authorize',message:'Database query completed',data:{duration:Date.now()-queryStartTime,hasUser:!!user},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
          // #endregion
        } catch (queryError: any) {
          // #region agent log
          fetch('http://127.0.0.1:7252/ingest/af4f18b1-607b-409e-9a53-dc7dabb167e7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth.ts:authorize',message:'Database query error',data:{error:queryError?.message,isTimeout:queryError?.message==='Database query timeout'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
          // #endregion
          if (queryError?.message === 'Database query timeout') {
            console.error('[AUTH ERROR] Database query timed out after 10 seconds')
          } else {
            console.error('[AUTH ERROR] Database query failed:', queryError?.message)
          }
          return null
        }

        if (!user) {
          // #region agent log
          fetch('http://127.0.0.1:7252/ingest/af4f18b1-607b-409e-9a53-dc7dabb167e7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth.ts:authorize',message:'User not found',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
          // #endregion
          return null
        }

        // #region agent log
        fetch('http://127.0.0.1:7252/ingest/af4f18b1-607b-409e-9a53-dc7dabb167e7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth.ts:authorize',message:'Before password check',data:{userId:user.id,status:user.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion

        // Lazy load bcryptjs so middleware/edge bundles don't pull in Node-only APIs
        const bcrypt = await import('bcryptjs')
        let isValid: boolean
        try {
          isValid = await bcrypt.compare(password, user.passwordHash)
        } catch (bcryptError: any) {
          // #region agent log
          fetch('http://127.0.0.1:7252/ingest/af4f18b1-607b-409e-9a53-dc7dabb167e7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth.ts:authorize',message:'Password check error',data:{error:bcryptError?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
          // #endregion
          console.error('[AUTH ERROR] Password comparison failed:', bcryptError?.message)
          return null
        }

        if (!isValid) {
          // #region agent log
          fetch('http://127.0.0.1:7252/ingest/af4f18b1-607b-409e-9a53-dc7dabb167e7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth.ts:authorize',message:'Password invalid',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
          // #endregion
          return null
        }

        if (user.status !== 'ACTIVE') {
          // #region agent log
          fetch('http://127.0.0.1:7252/ingest/af4f18b1-607b-409e-9a53-dc7dabb167e7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth.ts:authorize',message:'User not active',data:{status:user.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
          // #endregion
          return null
        }

        // #region agent log
        fetch('http://127.0.0.1:7252/ingest/af4f18b1-607b-409e-9a53-dc7dabb167e7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth.ts:authorize',message:'Authorize success',data:{userId:user.id,role:user.role},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
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
