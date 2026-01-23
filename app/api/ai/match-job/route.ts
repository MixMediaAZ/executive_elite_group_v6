/**
 * AI Job Matching API
 * POST /api/ai/match-job
 */

import { NextRequest } from 'next/server'
import { findMatchesForJob, isAIConfigured } from '@/lib/ai'
import { withApiHandler, validateBody, successResponse, errorResponse } from '@/lib/api-helpers'
import { db } from '@/lib/db'
import { z } from 'zod'

const schema = z.object({
  jobId: z.string().min(1),
  limit: z.number().int().min(1).max(50).optional(),
})

export const POST = withApiHandler(
  async (request: NextRequest, { session }) => {
    if (!isAIConfigured()) {
      return errorResponse('AI service not configured', 503)
    }

    const body = await request.json()
    const validated = validateBody(schema, body)

    // Fetch job to verify ownership
    const job = await db.job.findUnique({
      where: { id: validated.jobId },
      select: { employerId: true }
    })

    if (!job) {
      return errorResponse('Job not found', 404)
    }

    // Employers can only match for their own jobs unless admin
    if (
      session.user.role !== 'ADMIN' &&
      session.user.employerProfileId &&
      job.employerId !== session.user.employerProfileId
    ) {
      return errorResponse('Forbidden', 403)
    }

    const matches = await findMatchesForJob({
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
