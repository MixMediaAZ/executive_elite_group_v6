/**
 * AI Market Insights API
 * GET /api/ai/market-insights
 */

import { NextRequest } from 'next/server'
import { getMarketInsights, isAIConfigured } from '@/lib/ai'
import { kvCached } from '@/lib/cache/kv'
import { withApiHandler, successResponse, errorResponse } from '@/lib/api-helpers'

export const GET = withApiHandler(
  async (request: NextRequest) => {
    if (!isAIConfigured()) {
      return errorResponse('AI service not configured', 503)
    }

    const { searchParams } = new URL(request.url)
    const orgType = searchParams.get('orgType') || undefined
    const jobLevel = searchParams.get('jobLevel') || undefined
    const location = searchParams.get('location') || undefined

    const cacheKey = `ai:market-insights:${orgType || 'any'}:${jobLevel || 'any'}:${location || 'any'}`
    const { value: result, cache } = await kvCached(cacheKey, 60 * 60 * 6, async () => {
      return await getMarketInsights(orgType, jobLevel, location)
    })

    return successResponse({ ...result, cache })
  },
  {
    requireAuth: true,
    rateLimit: { keyPrefix: 'rl:ai', limit: 30, windowSeconds: 60 },
  }
)
