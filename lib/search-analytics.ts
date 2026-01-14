/**
 * Search Analytics Utilities
 * Tracks search queries and results for product insights
 */

import { db } from './db'

export interface SearchFilters {
  level?: string
  orgType?: string
  location?: string
  remote?: string
  salaryMin?: string
  salaryMax?: string
  department?: string
}

/**
 * Track a search query
 */
export async function trackSearch(
  query: string,
  filters: SearchFilters,
  resultsCount: number,
  userId?: string | null,
  clickedJobId?: string | null
): Promise<void> {
  try {
    await db.searchAnalytics.create({
      data: {
        userId: userId || null,
        query: query.trim(),
        filtersJson: JSON.stringify(filters),
        resultsCount,
        clickedJobId: clickedJobId || null,
      },
    })
  } catch (error) {
    console.error('Error tracking search:', error)
    // Don't throw - tracking failure shouldn't break search
  }
}

/**
 * Get popular search queries
 */
export async function getPopularSearches(limit: number = 10) {
  const searches = await db.searchAnalytics.groupBy({
    by: ['query'],
    _count: {
      query: true,
    },
    orderBy: {
      _count: {
        query: 'desc',
      },
    },
    take: limit,
    where: {
      query: { not: '' },
    },
  })

  return searches.map((s: { query: string; _count: { query: number } }) => ({
    query: s.query,
    count: s._count.query,
  }))
}

/**
 * Get search analytics for admin dashboard
 */
export async function getSearchAnalytics(period: '7d' | '30d' | '90d' | 'all' = '30d') {
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
      startDate = new Date(0)
  }

  const [totalSearches, searchesWithClicks, popularQueries] = await Promise.all([
    db.searchAnalytics.count({
      where: {
        searchedAt: { gte: startDate },
      },
    }),
    db.searchAnalytics.count({
      where: {
        searchedAt: { gte: startDate },
        clickedJobId: { not: null },
      },
    }),
    db.searchAnalytics.groupBy({
      by: ['query'],
      _count: { query: true },
      where: {
        searchedAt: { gte: startDate },
        query: { not: '' },
      },
      orderBy: {
        _count: { query: 'desc' },
      },
      take: 10,
    }),
  ])

  return {
    totalSearches,
    searchesWithClicks,
    clickThroughRate: totalSearches > 0 ? (searchesWithClicks / totalSearches) * 100 : 0,
    popularQueries: popularQueries.map((q: { query: string; _count: { query: number } }) => ({
      query: q.query,
      count: q._count.query,
    })),
  }
}

