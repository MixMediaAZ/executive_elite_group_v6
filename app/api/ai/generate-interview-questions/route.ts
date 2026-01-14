/**
 * AI Interview Questions Generator API
 * POST /api/ai/generate-interview-questions
 */

import { NextRequest } from 'next/server'
import { generateInterviewQuestions, isAIConfigured } from '@/lib/ai'
import { withApiHandler, validateBody, successResponse, errorResponse } from '@/lib/api-helpers'
import { z } from 'zod'

const schema = z.object({
  jobId: z.string().min(1),
  candidateProfileId: z.string().min(1),
  questionCount: z.number().int().min(3).max(20).optional(),
})

export const POST = withApiHandler(
  async (request: NextRequest, { session }) => {
    if (!isAIConfigured()) {
      return errorResponse('AI service not configured', 503)
    }

    const body = await request.json()
    const validated = validateBody(schema, body)

    // Candidates can only run AI for themselves unless admin.
    if (
      session.user.role !== 'ADMIN' &&
      session.user.candidateProfileId &&
      validated.candidateProfileId !== session.user.candidateProfileId
    ) {
      return errorResponse('Forbidden', 403)
    }

    const result = await generateInterviewQuestions({
      jobId: validated.jobId,
      candidateProfileId: validated.candidateProfileId,
      questionCount: validated.questionCount ?? 8,
    })

    return successResponse(result)
  },
  {
    requireAuth: true,
    rateLimit: { keyPrefix: 'rl:ai', limit: 10, windowSeconds: 60 },
  }
)
