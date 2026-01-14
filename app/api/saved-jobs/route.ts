import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { withApiHandler, validateBody, successResponse, errorResponse } from '@/lib/api-helpers'
import { z } from 'zod'

const jobIdSchema = z.string().min(1)

export const GET = withApiHandler(
  async (request: NextRequest, { session }) => {
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')
    if (!jobId) return errorResponse('Job ID required', 400)

    if (session.user.role !== 'CANDIDATE') return errorResponse('Only candidates can save jobs', 403)
    if (!session.user.candidateProfileId) return errorResponse('Profile not found', 404)

    validateBody(jobIdSchema, jobId)

    const saved = await db.savedJob.findFirst({
      where: { jobId, candidateId: session.user.candidateProfileId },
    })

    return successResponse({ saved: Boolean(saved) })
  },
  { requireAuth: true, rateLimit: { keyPrefix: 'rl:saved', limit: 120, windowSeconds: 60 } }
)

const postSchema = z.object({ jobId: jobIdSchema })

export const POST = withApiHandler(
  async (request: NextRequest, { session }) => {
    if (session.user.role !== 'CANDIDATE') return errorResponse('Only candidates can save jobs', 403)
    if (!session.user.candidateProfileId) return errorResponse('Profile not found', 404)

    const body = await request.json()
    const validated = validateBody(postSchema, body)

    const existing = await db.savedJob.findFirst({
      where: { jobId: validated.jobId, candidateId: session.user.candidateProfileId },
    })

    if (existing) return errorResponse('Job already saved', 400)

    const savedJob = await db.savedJob.create({
      data: { jobId: validated.jobId, candidateId: session.user.candidateProfileId },
    })

    return successResponse({ savedJobId: savedJob.id })
  },
  { requireAuth: true, rateLimit: { keyPrefix: 'rl:saved', limit: 60, windowSeconds: 60 } }
)

export const DELETE = withApiHandler(
  async (request: NextRequest, { session }) => {
    if (session.user.role !== 'CANDIDATE') return errorResponse('Only candidates can unsave jobs', 403)
    if (!session.user.candidateProfileId) return errorResponse('Profile not found', 404)

    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')
    if (!jobId) return errorResponse('Job ID required', 400)

    validateBody(jobIdSchema, jobId)

    await db.savedJob.deleteMany({
      where: { jobId, candidateId: session.user.candidateProfileId },
    })

    return successResponse()
  },
  { requireAuth: true, rateLimit: { keyPrefix: 'rl:saved', limit: 60, windowSeconds: 60 } }
)
