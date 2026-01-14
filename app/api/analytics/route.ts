import { NextRequest, NextResponse } from 'next/server'
import { getServerSessionHelper } from '@/lib/auth-helpers'
import { db } from '@/lib/db'
import type { AnalyticsEvent } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSessionHelper()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only admins can view analytics' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30d' // 7d, 30d, 90d, all

    // Calculate date range
    const now = new Date()
    let startDate: Date
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(0) // All time
    }

    // Get analytics events
    const events = await db.analyticsEvent.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Aggregate metrics
    const metrics = {
      totalJobs: await db.job.count({
        where: {
          createdAt: { gte: startDate },
        },
      }),
      liveJobs: await db.job.count({
        where: {
          status: 'LIVE',
          createdAt: { gte: startDate },
        },
      }),
      totalApplications: await db.application.count({
        where: {
          createdAt: { gte: startDate },
        },
      }),
      totalUsers: await db.user.count({
        where: {
          createdAt: { gte: startDate },
        },
      }),
      candidates: await db.user.count({
        where: {
          role: 'CANDIDATE',
          createdAt: { gte: startDate },
        },
      }),
      employers: await db.user.count({
        where: {
          role: 'EMPLOYER',
          createdAt: { gte: startDate },
        },
      }),
      totalRevenue: await db.jobPayment.aggregate({
        where: {
          status: 'paid',
          paidAt: { gte: startDate },
        },
        _sum: {
          amountCents: true,
        },
      }),
      eventCounts: {
        jobViews: events.filter((e: AnalyticsEvent) => e.eventType === 'JOB_VIEW').length,
        jobApplies: events.filter((e: AnalyticsEvent) => e.eventType === 'JOB_APPLY').length,
        profileViews: events.filter((e: AnalyticsEvent) => e.eventType === 'PROFILE_VIEW').length,
      },
    }

    // Group events by day for chart data
    const eventsByDay: Record<string, number> = {}
    events.forEach((event: AnalyticsEvent) => {
      const day = event.createdAt.toISOString().split('T')[0]
      eventsByDay[day] = (eventsByDay[day] || 0) + 1
    })

    return NextResponse.json({
      metrics,
      eventsByDay,
      period,
    })
  } catch (error) {
    console.error('Analytics fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}

