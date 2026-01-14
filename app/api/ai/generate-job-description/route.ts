/**
 * AI Job Description Generation API
 * POST /api/ai/generate-job-description
 */

import { NextRequest } from 'next/server'
import { generateJobDescriptionAndOutreach, isAIConfigured } from '@/lib/ai'
import { withApiHandler, validateBody, successResponse, errorResponse } from '@/lib/api-helpers'
import { z } from 'zod'
import { sanitizePlainText } from '@/lib/security/sanitize'

const schema = z.object({
  title: z.string().min(1).max(120),
  level: z.string().min(1).max(50),
  location: z.string().min(1).max(120),
  remoteAllowed: z.boolean().optional(),
  serviceLines: z.array(z.string().min(1).max(80)).optional(),
  mustHaveSkills: z.array(z.string().min(1).max(80)).optional(),
  cultureMandate: z.string().max(2000).optional(),
  orgName: z.string().max(120).optional(),
  orgType: z.string().max(80).optional(),
  budgetManaged: z.number().int().min(0).max(1_000_000_000).optional(),
  teamSize: z.number().int().min(0).max(100_000).optional(),
})

export const POST = withApiHandler(
  async (request: NextRequest) => {
    if (!isAIConfigured()) {
      return errorResponse('AI service not configured', 503)
    }

    const body = await request.json()
    const validated = validateBody(schema, body)

    const result = await generateJobDescriptionAndOutreach({
      ...validated,
      remoteAllowed: validated.remoteAllowed ?? false,
      // sanitize free text inputs
      cultureMandate: validated.cultureMandate
        ? sanitizePlainText(validated.cultureMandate, { maxLen: 2000 })
        : undefined,
    })

    return successResponse(result)
  },
  {
    requireAuth: true,
    rateLimit: { keyPrefix: 'rl:ai', limit: 20, windowSeconds: 60 },
  }
)
