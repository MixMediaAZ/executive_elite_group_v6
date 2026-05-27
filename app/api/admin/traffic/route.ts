import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSessionHelper } from '@/lib/auth-helpers'
import { Prisma, PrismaClient } from '@prisma/client'

// db is a lazy `any` proxy; cast once for typed $queryRaw generics.
const prisma = db as unknown as PrismaClient

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10)
}

export async function GET(req: NextRequest) {
  const session = await getServerSessionHelper()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const days = Math.min(90, Math.max(1, parseInt(searchParams.get('days') || '14', 10)))
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  since.setUTCHours(0, 0, 0, 0)

  // Daily series — pageviews, unique visitors, registrations
  const daily = await prisma.$queryRaw<Array<{ day: string; views: bigint; uniques: bigint }>>(Prisma.sql`
    SELECT to_char(date_trunc('day', "createdAt"), 'YYYY-MM-DD') AS day,
           COUNT(*)::bigint AS views,
           COUNT(DISTINCT "visitorId")::bigint AS uniques
      FROM "PageView"
     WHERE "createdAt" >= ${since}
     GROUP BY 1
     ORDER BY 1
  `)

  const regs = await prisma.$queryRaw<Array<{ day: string; n: bigint }>>(Prisma.sql`
    SELECT to_char(date_trunc('day', "createdAt"), 'YYYY-MM-DD') AS day,
           COUNT(*)::bigint AS n
      FROM "User"
     WHERE "createdAt" >= ${since}
     GROUP BY 1
     ORDER BY 1
  `)
  const regsByDay: Record<string, number> = {}
  regs.forEach(r => { regsByDay[r.day] = Number(r.n) })

  // Build full series with zero-fill
  const series: Array<{ day: string; views: number; uniques: number; registrations: number }> = []
  const map: Record<string, { views: number; uniques: number }> = {}
  daily.forEach(d => { map[d.day] = { views: Number(d.views), uniques: Number(d.uniques) } })
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    const k = dayKey(d)
    series.push({
      day: k,
      views: map[k]?.views ?? 0,
      uniques: map[k]?.uniques ?? 0,
      registrations: regsByDay[k] ?? 0,
    })
  }

  // Top pages
  const topPages = await prisma.$queryRaw<Array<{ path: string; views: bigint; uniques: bigint; avgMs: number | null }>>(Prisma.sql`
    SELECT path,
           COUNT(*)::bigint AS views,
           COUNT(DISTINCT "visitorId")::bigint AS uniques,
           AVG("durationMs")::float AS "avgMs"
      FROM "PageView"
     WHERE "createdAt" >= ${since}
     GROUP BY path
     ORDER BY views DESC
     LIMIT 15
  `)

  // Top referrers (external only)
  const topReferrers = await prisma.$queryRaw<Array<{ host: string; views: bigint }>>(Prisma.sql`
    SELECT COALESCE(NULLIF(regexp_replace(referrer, '^https?://([^/]+).*$', '\\1'), referrer), '(direct)') AS host,
           COUNT(*)::bigint AS views
      FROM "PageView"
     WHERE "createdAt" >= ${since}
       AND (referrer IS NULL OR referrer NOT ILIKE '%' || host || '%')
     GROUP BY 1
     ORDER BY views DESC
     LIMIT 10
  `)

  // UTM campaigns
  const utms = await prisma.$queryRaw<Array<{ source: string; medium: string; campaign: string; views: bigint }>>(Prisma.sql`
    SELECT COALESCE("utmSource", '(none)') AS source,
           COALESCE("utmMedium", '(none)') AS medium,
           COALESCE("utmCampaign", '(none)') AS campaign,
           COUNT(*)::bigint AS views
      FROM "PageView"
     WHERE "createdAt" >= ${since}
       AND ("utmSource" IS NOT NULL OR "utmMedium" IS NOT NULL OR "utmCampaign" IS NOT NULL)
     GROUP BY 1, 2, 3
     ORDER BY views DESC
     LIMIT 10
  `)

  // Jobs board specific — top viewed jobs (joined with title)
  const topJobs = await prisma.$queryRaw<Array<{ jobId: string; title: string | null; company: string | null; views: bigint; uniques: bigint }>>(Prisma.sql`
    SELECT pv."jobId" AS "jobId",
           j.title AS title,
           j.company AS company,
           COUNT(*)::bigint AS views,
           COUNT(DISTINCT pv."visitorId")::bigint AS uniques
      FROM "PageView" pv
      LEFT JOIN "Job" j ON j.id = pv."jobId"
     WHERE pv."createdAt" >= ${since}
       AND pv."jobId" IS NOT NULL
     GROUP BY pv."jobId", j.title, j.company
     ORDER BY views DESC
     LIMIT 10
  `)

  // Country breakdown
  const countries = await prisma.$queryRaw<Array<{ country: string; views: bigint }>>(Prisma.sql`
    SELECT COALESCE(country, '(unknown)') AS country,
           COUNT(*)::bigint AS views
      FROM "PageView"
     WHERE "createdAt" >= ${since}
     GROUP BY 1
     ORDER BY views DESC
     LIMIT 10
  `)

  // Totals — today / window / all-time
  const todayStart = new Date(); todayStart.setUTCHours(0, 0, 0, 0)
  const [todayViews, todayUniques, windowViews, windowUniques, allTimeViews, allTimeUniques, jobsBoardViews] = await Promise.all([
    prisma.pageView.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.pageView.findMany({ where: { createdAt: { gte: todayStart } }, distinct: ['visitorId'], select: { visitorId: true } }).then(r => r.length),
    prisma.pageView.count({ where: { createdAt: { gte: since } } }),
    prisma.pageView.findMany({ where: { createdAt: { gte: since } }, distinct: ['visitorId'], select: { visitorId: true } }).then(r => r.length),
    prisma.pageView.count(),
    prisma.pageView.findMany({ distinct: ['visitorId'], select: { visitorId: true } }).then(r => r.length),
    prisma.pageView.count({ where: { createdAt: { gte: since }, isJobsBoard: true } }),
  ])

  // Sessions in window — count of distinct sessionIds, plus avg pages per session
  const sessionAgg = await prisma.$queryRaw<Array<{ sessions: bigint; avgPages: number | null; bounceRate: number | null }>>(Prisma.sql`
    WITH s AS (
      SELECT "sessionId", COUNT(*) AS pages
        FROM "PageView"
       WHERE "createdAt" >= ${since}
       GROUP BY "sessionId"
    )
    SELECT COUNT(*)::bigint AS sessions,
           AVG(pages)::float AS "avgPages",
           (COUNT(*) FILTER (WHERE pages = 1))::float / NULLIF(COUNT(*), 0) AS "bounceRate"
      FROM s
  `)

  // Auth split — what % of pageviews come from logged-in users
  const authSplit = await prisma.$queryRaw<Array<{ kind: string; views: bigint }>>(Prisma.sql`
    SELECT CASE WHEN "userId" IS NULL THEN 'anonymous' ELSE 'authenticated' END AS kind,
           COUNT(*)::bigint AS views
      FROM "PageView"
     WHERE "createdAt" >= ${since}
     GROUP BY 1
  `)

  return NextResponse.json({
    windowDays: days,
    totals: {
      today: { views: todayViews, uniques: todayUniques },
      window: { views: windowViews, uniques: windowUniques, jobsBoardViews },
      allTime: { views: allTimeViews, uniques: allTimeUniques },
    },
    sessions: {
      count: Number(sessionAgg[0]?.sessions ?? 0),
      avgPagesPerSession: sessionAgg[0]?.avgPages ?? 0,
      bounceRate: sessionAgg[0]?.bounceRate ?? 0,
    },
    series,
    topPages: topPages.map(p => ({ path: p.path, views: Number(p.views), uniques: Number(p.uniques), avgMs: p.avgMs })),
    topReferrers: topReferrers.map(r => ({ host: r.host, views: Number(r.views) })),
    utms: utms.map(u => ({ source: u.source, medium: u.medium, campaign: u.campaign, views: Number(u.views) })),
    topJobs: topJobs.map(j => ({ jobId: j.jobId, title: j.title, company: j.company, views: Number(j.views), uniques: Number(j.uniques) })),
    countries: countries.map(c => ({ country: c.country, views: Number(c.views) })),
    authSplit: authSplit.map(a => ({ kind: a.kind, views: Number(a.views) })),
  })
}
