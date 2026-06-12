import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSessionHelper } from '@/lib/auth-helpers'
import { Prisma, PrismaClient } from '@prisma/client'

// db is a lazy `any` proxy; cast once for typed $queryRaw generics.
const prisma = db as unknown as PrismaClient

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function sinceFor(period: string): Date {
  const now = Date.now()
  switch (period) {
    case '7d':
      return new Date(now - 7 * 24 * 60 * 60 * 1000)
    case '90d':
      return new Date(now - 90 * 24 * 60 * 60 * 1000)
    case 'all':
      return new Date(0)
    case '30d':
    default:
      return new Date(now - 30 * 24 * 60 * 60 * 1000)
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSessionHelper()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const period = searchParams.get('period') || '30d' // 7d, 30d, 90d, all
    const since = sinceFor(period)

    // Per-job view aggregation — driven from Job so every posting appears,
    // including those with zero views in the window. Views/uniques from PageView.
    const jobRows = await prisma.$queryRaw<
      Array<{
        id: string
        title: string | null
        company: string | null
        status: string | null
        views: bigint
        uniques: bigint
      }>
    >(Prisma.sql`
      SELECT j.id AS id,
             j.title AS title,
             COALESCE(j."orgNameOverride", e."orgName") AS company,
             j.status AS status,
             COUNT(pv.id)::bigint AS views,
             COUNT(DISTINCT pv."visitorId")::bigint AS uniques
        FROM "Job" j
        LEFT JOIN "EmployerProfile" e ON e.id = j."employerId"
        LEFT JOIN "PageView" pv
               ON pv."jobId" = j.id
              AND pv."createdAt" >= ${since}
       GROUP BY j.id, j.title, j."orgNameOverride", e."orgName", j.status
       ORDER BY views DESC, j."createdAt" DESC
    `)

    // Applications per job within the same window (for conversion funnel).
    const appGroups = await prisma.application.groupBy({
      by: ['jobId'],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
    })
    const appsByJob: Record<string, number> = {}
    appGroups.forEach((g: { jobId: string; _count: { _all: number } }) => {
      appsByJob[g.jobId] = g._count._all
    })

    const jobs = jobRows.map((r) => {
      const views = Number(r.views)
      const uniques = Number(r.uniques)
      const applications = appsByJob[r.id] ?? 0
      return {
        jobId: r.id,
        title: r.title,
        company: r.company,
        status: r.status,
        views,
        uniques,
        applications,
        // Conversion = applications per unique viewer (guard divide-by-zero).
        conversion: uniques > 0 ? applications / uniques : 0,
      }
    })

    // Window totals — true distinct viewers across all job pages (summing
    // per-job uniques would double-count visitors who viewed multiple jobs).
    const [totalAgg] = await prisma.$queryRaw<Array<{ views: bigint; uniques: bigint }>>(Prisma.sql`
      SELECT COUNT(*)::bigint AS views,
             COUNT(DISTINCT "visitorId")::bigint AS uniques
        FROM "PageView"
       WHERE "jobId" IS NOT NULL
         AND "createdAt" >= ${since}
    `)
    const totalApplications = await prisma.application.count({
      where: { createdAt: { gte: since } },
    })

    return NextResponse.json({
      period,
      totals: {
        views: Number(totalAgg?.views ?? 0),
        uniques: Number(totalAgg?.uniques ?? 0),
        listingsWithViews: jobs.filter((j) => j.views > 0).length,
        applications: totalApplications,
      },
      jobs,
    })
  } catch (err) {
    console.error('[admin/job-views]', err)
    return NextResponse.json(
      { error: 'Failed to load job view stats', detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    )
  }
}
