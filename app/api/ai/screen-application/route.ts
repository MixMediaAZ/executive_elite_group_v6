/**
 * AI Application Screening API
 * POST /api/ai/screen-application
 */

import { NextRequest } from 'next/server'
import { screenApplication, isAIConfigured } from '@/lib/ai'
import { withApiHandler, validateBody, successResponse, errorResponse } from '@/lib/api-helpers'
import { z } from 'zod'
import { sanitizePlainText } from '@/lib/security/sanitize'

const schema = z.object({
  candidateProfileId: z.string().min(1),
  jobId: z.string().min(1),
  applicationText: z.string().max(20_000).optional(),
})

export const POST = withApiHandler(
  async (request: NextRequest, { session }) => {
    if (!isAIConfigured()) {
      return errorResponse('AI service not configured', 503)
    }

    const body = await request.json()
    const validated = validateBody(schema, body)

    if (
      session.user.role !== 'ADMIN' &&
      session.user.candidateProfileId &&
      validated.candidateProfileId !== session.user.candidateProfileId
    ) {
      return errorResponse('Forbidden', 403)
    }

    const result = await screenApplication({
      candidateProfileId: validated.candidateProfileId,
      jobId: validated.jobId,
      applicationText: validated.applicationText
        ? sanitizePlainText(validated.applicationText, { maxLen: 20_000 })
        : undefined,
    })

    return successResponse(result)
  },
  {
    requireAuth: true,
    rateLimit: { keyPrefix: 'rl:ai', limit: 10, windowSeconds: 60 },
  }
)
