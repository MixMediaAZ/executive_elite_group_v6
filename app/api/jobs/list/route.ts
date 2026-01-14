import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { kvCached } from '@/lib/cache/kv'

/**
 * Public job list API (cached).
 * GET /api/jobs/list?take=20
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const take = Math.min(Number(searchParams.get('take') || 20), 50)

  const cacheKey = `jobs:list:live:${take}`
  const { value: jobs, cache } = await kvCached(cacheKey, 30, async () => {
    return await db.job.findMany({
      where: { status: 'LIVE' },
      orderBy: { createdAt: 'desc' },
      take,
      select: {
        id: true,
        title: true,
        level: true,
        location: true,
        remoteAllowed: true,
        compensationMin: true,
        compensationMax: true,
        compensationCurrency: true,
        createdAt: true,
        employer: {
          select: { orgName: true, orgType: true },
        },
        tier: {
          select: { isFeatured: true, isPremium: true },
        },
      },
    })
  })

  return NextResponse.json({ success: true, cache, data: jobs })
}

