import { redirect } from 'next/navigation'
import { auth } from './auth'

interface SessionUser {
  id: string
  email: string
  role: string
  candidateProfileId?: string
  employerProfileId?: string
}

interface Session {
  user: SessionUser
  expires?: string
}

// Use NextAuth v5 beta's auth() function for server-side session access
export async function getServerSessionHelper(): Promise<Session | null> {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return null
    }

    return {
      user: {
        id: session.user.id,
        email: session.user.email ?? '',
        role: session.user.role,
        candidateProfileId: session.user.candidateProfileId,
        employerProfileId: session.user.employerProfileId,
      },
      expires: session.expires,
    }
  } catch (error) {
    // Log error in production to help debug
    if (process.env.NODE_ENV === 'production') {
      console.error('getServerSessionHelper error:', error instanceof Error ? error.message : String(error))
    }
    return null
  }
}

export async function requireAuth(): Promise<Session> {
  const session = await getServerSessionHelper()
  if (!session) {
    redirect('/auth/login')
  }
  return session
}
