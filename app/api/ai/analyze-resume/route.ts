/**
 * AI Resume Analysis API
 * POST /api/ai/analyze-resume
 */

import { NextRequest } from 'next/server'
import { analyzeResume, isAIConfigured } from '@/lib/ai'
import { withApiHandler, validateBody, successResponse, errorResponse } from '@/lib/api-helpers'
import { z } from 'zod'
import { sanitizePlainText } from '@/lib/security/sanitize'

const schema = z.object({
  resumeText: z.string().min(50).max(50_000),
  candidateProfileId: z.string().min(1),
})

export const POST = withApiHandler(
  async (request: NextRequest, { session }) => {
    if (!isAIConfigured()) {
      return errorResponse('AI service not configured', 503)
    }

    const body = await request.json()
    const validated = validateBody(schema, body)

    // Ensure user can only analyze their own profile (unless admin)
    if (
      session.user.role !== 'ADMIN' &&
      session.user.candidateProfileId &&
      validated.candidateProfileId !== session.user.candidateProfileId
    ) {
      return errorResponse('Forbidden', 403)
    }

    const result = await analyzeResume({
      resumeText: sanitizePlainText(validated.resumeText, { maxLen: 50_000 }),
      candidateProfileId: validated.candidateProfileId,
    })

    return successResponse(result)
  },
  {
    requireAuth: true,
    rateLimit: { keyPrefix: 'rl:ai', limit: 10, windowSeconds: 60 },
  }
)
