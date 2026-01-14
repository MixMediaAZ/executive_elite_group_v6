/**
 * AI Candidate-Job Matching API
 * POST /api/ai/match-candidate
 */

import { NextRequest } from 'next/server'
import { findMatchesForCandidate, isAIConfigured } from '@/lib/ai'
import { withApiHandler, validateBody, successResponse, errorResponse } from '@/lib/api-helpers'
import { z } from 'zod'

const schema = z.object({
  candidateProfileId: z.string().min(1),
  jobId: z.string().min(1).optional(),
  limit: z.number().int().min(1).max(50).optional(),
})

export const POST = withApiHandler(
  async (request: NextRequest, { session }) => {
    if (!isAIConfigured()) {
      return errorResponse('AI service not configured', 503)
    }

    const body = await request.json()
    const validated = validateBody(schema, body)

    // Candidates can only match for themselves unless admin.
    if (
      session.user.role !== 'ADMIN' &&
      session.user.candidateProfileId &&
      validated.candidateProfileId !== session.user.candidateProfileId
    ) {
      return errorResponse('Forbidden', 403)
    }

    const matches = await findMatchesForCandidate({
      candidateProfileId: validated.candidateProfileId,
      jobId: validated.jobId,
      limit: validated.limit ?? 10,
    })

    return successResponse(matches)
  },
  {
    requireAuth: true,
    rateLimit: { keyPrefix: 'rl:ai', limit: 10, windowSeconds: 60 },
  }
)
