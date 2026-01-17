// Re-export GET and POST handlers from auth.ts (NextAuth v5 beta pattern)
import { handlers } from '@/lib/auth'
import type { NextRequest } from 'next/server'

const originalPOST = handlers.POST
const originalGET = handlers.GET

export const POST = async (req: NextRequest, context: any) => {
  console.log('[AUTH DEBUG] POST /api/auth/[...nextauth] called', {
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
  })
  const startTime = Date.now()
  try {
    const result = await originalPOST(req, context)
    console.log('[AUTH DEBUG] POST handler completed', {
      duration: Date.now() - startTime + 'ms',
      status: result?.status,
    })
    return result
  } catch (err: any) {
    console.error('[AUTH ERROR] POST handler error', {
      duration: Date.now() - startTime,
      error: err?.message,
    })
    throw err
  }
}

export const GET = originalGET
