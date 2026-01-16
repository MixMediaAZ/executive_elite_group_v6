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
        // #region agent log
        const logEntry = {location:'lib/auth.ts:21',message:'authorize entry',data:{hasEmail:!!credentials?.email,hasPassword:!!credentials?.password,emailProvided:typeof credentials?.email === 'string' ? credentials.email.substring(0,10)+'...' : 'N/A',envCheck:{hasDbUrl:!!process.env.DATABASE_URL,hasNextAuthSecret:!!process.env.NEXTAUTH_SECRET}},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'};
        console.log('[AUTH DEBUG]', JSON.stringify(logEntry));
        fetch('http://127.0.0.1:7252/ingest/af4f18b1-607b-409e-9a53-dc7dabb167e7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logEntry)}).catch(()=>{});
        // #endregion
        if (!credentials?.email || !credentials?.password) {
          // #region agent log
          fetch('http://127.0.0.1:7252/ingest/af4f18b1-607b-409e-9a53-dc7dabb167e7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth.ts:23',message:'authorize early return - missing creds',data:{hasEmail:!!credentials?.email,hasPassword:!!credentials?.password},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
          // #endregion
          return null
        }

        const emailInput = (credentials.email as string).trim()
        const password = credentials.password as string
        // #region agent log
        fetch('http://127.0.0.1:7252/ingest/af4f18b1-607b-409e-9a53-dc7dabb167e7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth.ts:27',message:'before db lookup',data:{emailInput:emailInput.substring(0,20)+'...',emailLength:emailInput.length,passwordLength:password.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion

        // Lazy load db only when authorize is called (in Node.js runtime, not Edge)
        let db
        try {
          db = await getDb()
        } catch (dbError: any) {
          // #region agent log
          fetch('http://127.0.0.1:7252/ingest/af4f18b1-607b-409e-9a53-dc7dabb167e7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth.ts:30',message:'db getDb error',data:{error:dbError?.message,errorCode:dbError?.code,hasDbUrl:!!process.env.DATABASE_URL},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
          // #endregion
          throw dbError
        }
        // Case-insensitive lookup so existing mixed-case emails still work
        let user
        try {
          user = await db.user.findFirst({
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
        const logEntryDbLookup = {location:'lib/auth.ts:43',message:'after db lookup',data:{userFound:!!user,userId:user?.id,userEmail:user?.email,userRole:user?.role,userStatus:user?.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,E'};
        console.log('[AUTH DEBUG]', JSON.stringify(logEntryDbLookup));
        fetch('http://127.0.0.1:7252/ingest/af4f18b1-607b-409e-9a53-dc7dabb167e7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logEntryDbLookup)}).catch(()=>{});
        // #endregion
        } catch (queryError: any) {
          // #region agent log
          fetch('http://127.0.0.1:7252/ingest/af4f18b1-607b-409e-9a53-dc7dabb167e7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth.ts:45',message:'db query error',data:{error:queryError?.message,errorCode:queryError?.code},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
          // #endregion
          throw queryError
        }

        if (!user) {
          // #region agent log
          fetch('http://127.0.0.1:7252/ingest/af4f18b1-607b-409e-9a53-dc7dabb167e7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth.ts:48',message:'user not found',data:{emailInput:emailInput.substring(0,20)+'...'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,C'})}).catch(()=>{});
          // #endregion
          return null
        }

        // Lazy load bcryptjs so middleware/edge bundles don't pull in Node-only APIs
        const bcrypt = await import('bcryptjs')
        const isValid = await bcrypt.compare(password, user.passwordHash)
        // #region agent log
        const logEntryPassword = {location:'lib/auth.ts:52',message:'password check result',data:{isValid,passwordHashLength:user.passwordHash?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'};
        console.log('[AUTH DEBUG]', JSON.stringify(logEntryPassword));
        fetch('http://127.0.0.1:7252/ingest/af4f18b1-607b-409e-9a53-dc7dabb167e7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logEntryPassword)}).catch(()=>{});
        // #endregion

        if (!isValid) {
          // #region agent log
          fetch('http://127.0.0.1:7252/ingest/af4f18b1-607b-409e-9a53-dc7dabb167e7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth.ts:54',message:'password invalid',data:{userId:user.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
          // #endregion
          return null
        }

        if (user.status !== 'ACTIVE') {
          // #region agent log
          fetch('http://127.0.0.1:7252/ingest/af4f18b1-607b-409e-9a53-dc7dabb167e7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth.ts:58',message:'user status not ACTIVE',data:{userId:user.id,status:user.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
          // #endregion
          return null
        }

        // #region agent log
        fetch('http://127.0.0.1:7252/ingest/af4f18b1-607b-409e-9a53-dc7dabb167e7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth.ts:61',message:'authorize success',data:{userId:user.id,role:user.role},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
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
      // #region agent log
      console.log('[AUTH DEBUG]', JSON.stringify({location:'lib/auth.ts:121',message:'jwt callback entry',data:{hasUser:!!user,hasToken:!!token,userId:user?.id,tokenId:token?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'}));
      fetch('http://127.0.0.1:7252/ingest/af4f18b1-607b-409e-9a53-dc7dabb167e7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth.ts:121',message:'jwt callback entry',data:{hasUser:!!user,hasToken:!!token,userId:user?.id,tokenId:token?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
      // #endregion
      if (user) {
        token.id = user.id
        token.role = user.role
        token.candidateProfileId = user.candidateProfileId
        token.employerProfileId = user.employerProfileId
      }
      // #region agent log
      console.log('[AUTH DEBUG]', JSON.stringify({location:'lib/auth.ts:128',message:'jwt callback exit',data:{tokenId:token?.id,tokenRole:token?.role},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'}));
      fetch('http://127.0.0.1:7252/ingest/af4f18b1-607b-409e-9a53-dc7dabb167e7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth.ts:128',message:'jwt callback exit',data:{tokenId:token?.id,tokenRole:token?.role},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
      // #endregion
      return token
    },
    async session({ session, token }) {
      // #region agent log
      console.log('[AUTH DEBUG]', JSON.stringify({location:'lib/auth.ts:130',message:'session callback entry',data:{hasSession:!!session,hasToken:!!token,userId:token?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'}));
      fetch('http://127.0.0.1:7252/ingest/af4f18b1-607b-409e-9a53-dc7dabb167e7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth.ts:130',message:'session callback entry',data:{hasSession:!!session,hasToken:!!token,userId:token?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
      // #endregion
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.candidateProfileId = token.candidateProfileId as string | undefined
        session.user.employerProfileId = token.employerProfileId as string | undefined
      }
      // #region agent log
      console.log('[AUTH DEBUG]', JSON.stringify({location:'lib/auth.ts:137',message:'session callback exit',data:{sessionUserId:session?.user?.id,sessionUserRole:session?.user?.role},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'}));
      fetch('http://127.0.0.1:7252/ingest/af4f18b1-607b-409e-9a53-dc7dabb167e7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth.ts:137',message:'session callback exit',data:{sessionUserId:session?.user?.id,sessionUserRole:session?.user?.role},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
      // #endregion
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
