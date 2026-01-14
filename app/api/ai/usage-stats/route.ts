/**
 * AI Usage Statistics API
 * GET /api/ai/usage-stats
 */

import { NextRequest } from 'next/server'
import { getAIUsageStats, isAIConfigured } from '@/lib/ai'
import { withApiHandler, successResponse, errorResponse } from '@/lib/api-helpers'

export const GET = withApiHandler(
  async (_request: NextRequest, { session }) => {
    if (!isAIConfigured()) {
      return errorResponse('AI service not configured', 503)
    }

    if (session.user.role !== 'ADMIN') {
      return errorResponse('Admin access required', 403)
    }

    const stats = await getAIUsageStats()
    return successResponse(stats)
  },
  {
    requireAuth: true,
    rateLimit: { keyPrefix: 'rl:ai', limit: 20, windowSeconds: 60 },
  }
)
