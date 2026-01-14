/**
 * AI Job Matching API (Simplified)
 * POST /api/ai/match-job
 */

import { NextRequest } from 'next/server'
import { withApiHandler, validateBody, successResponse, errorResponse } from '@/lib/api-helpers'
import { z } from 'zod'

const schema = z.object({
  jobId: z.string().min(1),
  limit: z.number().int().min(1).max(50).optional(),
})

export const POST = withApiHandler(
  async (request: NextRequest) => {
    const body = await request.json()
    validateBody(schema, body)

    // Placeholder route (future: job -> candidate matching)
    return successResponse([])
  },
  {
    requireAuth: true,
    rateLimit: { keyPrefix: 'rl:ai', limit: 10, windowSeconds: 60 },
  }
)
