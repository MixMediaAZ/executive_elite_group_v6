import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { withApiHandler, successResponse, errorResponse, validateBody } from '@/lib/api-helpers'
import { z } from 'zod'
import { logger } from '@/lib/monitoring/logger'

export const GET = withApiHandler(
  async (_request: NextRequest, { session }) => {
    if (session.user.role !== 'CANDIDATE') return errorResponse('Only candidates can view resumes', 403)
    if (!session.user.candidateProfileId) return errorResponse('Candidate profile not found', 404)

    const resumes = await db.resume.findMany({
      where: {
        candidateId: session.user.candidateProfileId,
      },
      orderBy: [
        { isPrimary: 'desc' },
        { uploadedAt: 'desc' },
      ],
    })

    return successResponse({ resumes })
  },
  { requireAuth: true, rateLimit: { keyPrefix: 'rl:resume', limit: 60, windowSeconds: 60 } }
)

const deleteSchema = z.object({ id: z.string().min(1) })

export const DELETE = withApiHandler(
  async (request: NextRequest, { session }) => {
    if (session.user.role !== 'CANDIDATE') return errorResponse('Only candidates can delete resumes', 403)
    if (!session.user.candidateProfileId) return errorResponse('Candidate profile not found', 404)

    const { searchParams } = new URL(request.url)
    const resumeId = validateBody(deleteSchema, { id: searchParams.get('id') || '' }).id

    // Verify resume belongs to candidate and get file URL
    const resume = await db.resume.findUnique({
      where: { id: resumeId },
      select: { candidateId: true, fileUrl: true },
    })

    if (!resume || resume.candidateId !== session.user.candidateProfileId) {
      return errorResponse('Resume not found', 404)
    }

    // Delete physical file if it exists
    try {
      const { unlink } = await import('fs/promises')
      const { join } = await import('path')
      const { existsSync } = await import('fs')
      
      // Extract filename from URL (e.g., /resumes/filename.pdf)
      if (resume.fileUrl.startsWith('/resumes/')) {
        const fileName = resume.fileUrl.split('/').pop()
        if (fileName) {
          const filePath = join(process.cwd(), 'public', 'resumes', fileName)
          if (existsSync(filePath)) await unlink(filePath)
        }
      }
    } catch (fileError) {
      logger.warn(
        { err: fileError instanceof Error ? { message: fileError.message } : { message: String(fileError) } },
        'Failed to delete physical resume file (continuing)'
      )
    }

    // Delete database record
    await db.resume.delete({
      where: { id: resumeId },
    })

    return successResponse()
  },
  { requireAuth: true, rateLimit: { keyPrefix: 'rl:resume', limit: 30, windowSeconds: 60 } }
)

const patchSchema = z.object({
  resumeId: z.string().min(1),
  isPrimary: z.boolean(),
})

export const PATCH = withApiHandler(
  async (request: NextRequest, { session }) => {
    if (session.user.role !== 'CANDIDATE') return errorResponse('Only candidates can update resumes', 403)
    if (!session.user.candidateProfileId) return errorResponse('Candidate profile not found', 404)

    const body = await request.json()
    const validated = validateBody(patchSchema, body)
    const resumeId = validated.resumeId
    const isPrimary = validated.isPrimary

    // Verify resume belongs to candidate
    const resume = await db.resume.findUnique({
      where: { id: resumeId },
      select: { candidateId: true },
    })

    if (!resume || resume.candidateId !== session.user.candidateProfileId) {
      return errorResponse('Resume not found', 404)
    }

    // If setting as primary, unset all other primary resumes for this candidate
    if (isPrimary) {
      const unsetResult = await db.resume.updateMany({
        where: {
          candidateId: session.user.candidateProfileId,
          isPrimary: true,
          id: { not: resumeId },
        },
        data: {
          isPrimary: false,
        },
      })
      console.log(`Unset ${unsetResult.count} other primary resume(s)`)
    }
    
    // If unsetting as primary, ensure at least one resume remains primary
    if (!isPrimary) {
      const otherPrimaryResume = await db.resume.findFirst({
        where: {
          candidateId: session.user.candidateProfileId,
          isPrimary: true,
          id: { not: resumeId },
        },
      })
      
      // If no other primary resume exists, keep this one as primary
      if (!otherPrimaryResume) {
        return errorResponse('Cannot unset primary resume. At least one resume must be marked as primary.', 400)
      }
    }

    // Update this resume
    const updatedResume = await db.resume.update({
      where: { id: resumeId },
      data: { isPrimary },
    })

    return successResponse({ resume: updatedResume })
  },
  { requireAuth: true, rateLimit: { keyPrefix: 'rl:resume', limit: 30, windowSeconds: 60 } }
)

