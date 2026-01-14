/**
 * Job Tracking Utilities
 * Tracks job views and integrates with analytics
 */

import { db } from './db'
import { headers } from 'next/headers'

/**
 * Track a job view
 * Called when a user views a job detail page
 */
export async function trackJobView(
  jobId: string,
  userId?: string | null,
  requestHeaders?: Headers
): Promise<void> {
  try {
    // Get IP and user agent from headers if available
    const ipAddress = requestHeaders?.get('x-forwarded-for') || 
                     requestHeaders?.get('x-real-ip') || 
                     null
    const userAgent = requestHeaders?.get('user-agent') || null

    await db.jobView.create({
      data: {
        jobId,
        userId: userId || null,
        ipAddress,
        userAgent,
      },
    })

    // Also log to AnalyticsEvent for consistency
    await db.analyticsEvent.create({
      data: {
        eventType: 'job_view',
        userId: userId || null,
        metadataJson: JSON.stringify({ jobId }),
      },
    })
  } catch (error) {
    console.error('Error tracking job view:', error)
    // Don't throw - tracking failure shouldn't break the page
  }
}

/**
 * Get job view statistics
 */
export async function getJobViewStats(jobId: string) {
  const [totalViews, uniqueViews, recentViews] = await Promise.all([
    db.jobView.count({
      where: { jobId },
    }),
    db.jobView.groupBy({
      by: ['userId'],
      where: {
        jobId,
        userId: { not: null },
      },
    }),
    db.jobView.count({
      where: {
        jobId,
        viewedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
    }),
  ])

  return {
    totalViews,
    uniqueViews: uniqueViews.length,
    recentViews,
  }
}

