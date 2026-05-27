import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { db } from '@/lib/db'
import { getServerSessionHelper } from '@/lib/auth-helpers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function fingerprint(ip: string, ua: string) {
  return crypto.createHash('sha256').update(ip + '|' + ua).digest('hex').slice(0, 16)
}

function classifyPath(path: string): { isJobsBoard: boolean; jobId: string | null } {
  if (!path.startsWith('/jobs')) return { isJobsBoard: false, jobId: null }
  const m = path.match(/^\/jobs\/([^\/?#]+)/)
  return { isJobsBoard: true, jobId: m ? m[1] : null }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({})) as {
      sessionId?: string
      path?: string
      referrer?: string
      utm?: { source?: string; medium?: string; campaign?: string }
    }
    if (!body.sessionId || !body.path) {
      return NextResponse.json({ ok: true })
    }

    const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim()
      || req.headers.get('x-real-ip') || ''
    const ua = (req.headers.get('user-agent') || '').slice(0, 300)
    if (/bot|crawler|spider|preview|monitor/i.test(ua)) {
      return NextResponse.json({ ok: true })
    }

    const visitorId = fingerprint(ip, ua)
    const host = req.headers.get('host') || null
    const country = req.headers.get('x-vercel-ip-country') || null

    let userId: string | null = null
    try {
      const session = await getServerSessionHelper()
      userId = session?.user?.id ?? null
    } catch { /* unauthenticated is fine */ }

    const path = body.path.slice(0, 500)
    const { isJobsBoard, jobId } = classifyPath(path)

    await db.pageView.create({
      data: {
        sessionId: body.sessionId.slice(0, 64),
        visitorId,
        userId,
        path,
        referrer: body.referrer ? body.referrer.slice(0, 500) : null,
        host,
        utmSource: body.utm?.source?.slice(0, 100) ?? null,
        utmMedium: body.utm?.medium?.slice(0, 100) ?? null,
        utmCampaign: body.utm?.campaign?.slice(0, 100) ?? null,
        country,
        isJobsBoard,
        jobId,
      },
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[track]', err)
    return NextResponse.json({ ok: true })
  }
}
