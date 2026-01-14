import { NextRequest, NextResponse } from 'next/server'
import { getServerSessionHelper } from '@/lib/auth-helpers'
import { db } from '@/lib/db'
import { notifyApplicationReceived } from '@/lib/notifications'
import { withApiHandler, validateBody, createdResponse, errorResponse } from '@/lib/api-helpers'
import { z } from 'zod'

const applicationSchema = z.object({
  jobId: z.string().min(1, 'Job ID is required'),
  candidateNote: z.string().optional(),
})

export const POST = withApiHandler(
  async (request: NextRequest, { session }) => {
    // Auth, role, and profile checks are handled by withApiHandler

    const body = await request.json()
    const validated = validateBody(applicationSchema, body)

    // Check if job exists and is live
    const job = await db.job.findUnique({
      where: { id: validated.jobId },
    })

    if (!job) {
      return errorResponse('Job not found', 404)
    }

    if (job.status !== 'LIVE') {
      return errorResponse('Job is not available for applications', 400)
    }

    // Check if already applied
    const existingApplication = await db.application.findFirst({
      where: {
        jobId: validated.jobId,
        candidateId: session.user.candidateProfileId,
      },
    })

    if (existingApplication) {
      return errorResponse('You have already applied to this job', 400)
    }

    // Get candidate and job details for notification
    const candidate = await db.candidateProfile.findUnique({
      where: { id: session!.user.candidateProfileId },
      select: {
        fullName: true,
      },
    })

    const jobWithEmployer = await db.job.findUnique({
      where: { id: validated.jobId },
      include: {
        employer: {
          select: {
            userId: true,
          },
        },
      },
    })

    // Create application
    const application = await db.application.create({
      data: {
        jobId: validated.jobId,
        candidateId: session.user.candidateProfileId,
        status: 'SUBMITTED',
        candidateNote: validated.candidateNote || null,
      },
    })

    // Mark JobMatch as applied if it exists
    await db.jobMatch.updateMany({
      where: {
        jobId: validated.jobId,
        candidateId: session.user.candidateProfileId,
      },
      data: {
        applied: true,
      },
    })

    // Notify employer (fire and forget - don't fail if notification fails)
    if (jobWithEmployer && candidate) {
      notifyApplicationReceived(
        jobWithEmployer.employer.userId,
        application.id,
        jobWithEmployer.title,
        candidate.fullName
      ).catch((err) => {
        // Log but don't fail the request
        console.error('Failed to send application notification:', err)
      })
    }

    return createdResponse(
      { applicationId: application.id },
      'Application submitted successfully'
    )
  },
  {
    requireAuth: true,
    requireRole: 'CANDIDATE',
    requireProfile: 'candidate',
  }
)

