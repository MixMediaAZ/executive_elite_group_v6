import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { withApiHandler, validateBody, successResponse, errorResponse, createdResponse } from '@/lib/api-helpers'

const uploadSchema = z.object({
  fileName: z.string().min(1),
  // We only allow our own stored resume paths here (the actual upload happens via /api/resume/upload-file).
  fileUrl: z.string().min(1),
  fileMimeType: z.string().min(1),
  isPrimary: z.boolean().default(true),
})

export const POST = withApiHandler(
  async (request: NextRequest, { session }) => {
    if (session.user.role !== 'CANDIDATE') return errorResponse('Only candidates can upload resumes', 403)
    if (!session.user.candidateProfileId) return errorResponse('Candidate profile not found', 404)

    const body = await request.json()
    const validated = validateBody(uploadSchema, body)

    // Prevent storing arbitrary external URLs as "resumes"
    const isAllowedResumeUrl = (fileUrl: string) => {
      if (fileUrl.startsWith('/resumes/')) return true
      try {
        const u = new URL(fileUrl)
        // Allow Vercel Blob public URLs only
        return u.protocol === 'https:' && u.hostname.endsWith('blob.vercel-storage.com')
      } catch {
        return false
      }
    }

    if (!isAllowedResumeUrl(validated.fileUrl)) {
      return errorResponse('Invalid fileUrl. Please upload via the resume uploader.', 400)
    }

    // If this is primary, unset other primary resumes
    if (validated.isPrimary) {
      await db.resume.updateMany({
        where: {
          candidateId: session.user.candidateProfileId,
          isPrimary: true,
        },
        data: {
          isPrimary: false,
        },
      })
    }

    // Create resume record
    const resume = await db.resume.create({
      data: {
        candidateId: session.user.candidateProfileId,
        fileUrl: validated.fileUrl,
        fileName: validated.fileName,
        fileMimeType: validated.fileMimeType,
        isPrimary: validated.isPrimary,
      },
    })

    return createdResponse({ resume })
  },
  {
    requireAuth: true,
    rateLimit: { keyPrefix: 'rl:resume', limit: 20, windowSeconds: 60 },
  }
)

