import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Updates the most recent pageview for a session with elapsed duration.
// Called via navigator.sendBeacon on visibilitychange/pagehide.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({})) as {
      sessionId?: string
      path?: string
      durationMs?: number
    }
    if (!body.sessionId || !body.path || typeof body.durationMs !== 'number') {
      return NextResponse.json({ ok: true })
    }
    const last = await db.pageView.findFirst({
      where: { sessionId: body.sessionId, path: body.path },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    })
    if (last) {
      await db.pageView.update({
        where: { id: last.id },
        data: { durationMs: Math.min(Math.max(0, Math.round(body.durationMs)), 60 * 60 * 1000) },
      })
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[track-heartbeat]', err)
    return NextResponse.json({ ok: true })
  }
}
