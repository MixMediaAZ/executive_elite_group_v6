'use client'

import { SessionProvider } from 'next-auth/react'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider
      // Explicitly set basePath to match NextAuth config - critical for Vercel deployments
      basePath="/api/auth"
      // Refetch session on window focus to keep session in sync
      refetchOnWindowFocus={true}
      // Refetch session every 5 minutes when tab is in focus
      refetchInterval={5 * 60}
    >
      {children}
    </SessionProvider>
  )
}

